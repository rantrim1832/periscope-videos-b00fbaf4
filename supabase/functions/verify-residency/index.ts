// Server-side residency verification. Trust-tier changes must be tamper-proof —
// the client cannot self-declare "verified." GPS within range → instant
// Likely Resident (T2). Document → pending Verified (T3), admin-approved.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const authHeader = req.headers.get('Authorization');
  const { data: { user } } = authHeader ? await supabase.auth.getUser(authHeader.replace('Bearer ', '')) : { data: { user: null } };
  if (!user) {
    return new Response(JSON.stringify({ error: 'Sign in to verify' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const { propertyId, method, latitude, longitude } = await req.json();
    if (!propertyId || !method) return json({ error: 'propertyId and method required' }, 400);

    if (method === 'gps_dwell') {
      const { data: prop } = await supabase.from('canonical_property').select('latitude, longitude').eq('id', propertyId).maybeSingle();
      if (!prop?.latitude || !prop?.longitude) return json({ error: 'Property has no location on file yet' }, 400);
      if (typeof latitude !== 'number' || typeof longitude !== 'number') return json({ error: 'Location required' }, 400);
      const dist = distanceMeters(latitude, longitude, prop.latitude, prop.longitude);
      if (dist > 250) return json({ error: `You appear to be ~${Math.round(dist)}m away. Verify from the property.` }, 400);

      await supabase.from('residency_verification').insert({
        resident_id: user.id, canonical_property_id: propertyId, method: 'gps_dwell',
        target_tier: 'likely_resident', status: 'approved', reviewed_at: new Date().toISOString(),
      });
      await supabase.rpc('upgrade_trust_tier', { _resident: user.id, _tier: 'likely_resident' });
      await supabase.from('residency_claim').insert({
        resident_id: user.id, canonical_property_id: propertyId,
        verification_tier: 'likely_resident', verification_method: 'gps_dwell', is_current: true,
      });
      return json({ tier: 'likely_resident', message: 'Verified as a Likely Resident' });
    }

    // Document-based → pending admin review for Verified Resident (T3).
    await supabase.from('residency_verification').insert({
      resident_id: user.id, canonical_property_id: propertyId, method,
      target_tier: 'verified_resident', status: 'pending',
    });
    return json({ status: 'pending', message: 'Document submitted for verification' });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
