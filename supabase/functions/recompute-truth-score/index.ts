// Manual / batch Truth Score recomputation. The DB trigger recomputes
// automatically when approved reviews change; this endpoint lets admins force a
// recompute for one property or all of them (e.g. after a bulk import or a
// weighting change). Single algorithm source of truth: the SQL function
// public.recompute_property_truth_score.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function requireAdmin(req: Request, supabase: ReturnType<typeof createClient>): Promise<void> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing Authorization header');
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) throw new Error('Invalid session');
  const { data } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  if (!data) throw new Error('Admin privileges required');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    await requireAdmin(req, supabase);
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { propertyId, all } = await req.json().catch(() => ({}));

    if (propertyId) {
      const { error } = await supabase.rpc('recompute_property_truth_score', { p_property_id: propertyId });
      if (error) throw error;
      return json({ recomputed: 1 });
    }

    if (all) {
      // Recompute every property that has at least one approved review.
      const { data, error } = await supabase
        .from('canonical_review')
        .select('canonical_property_id')
        .eq('moderation_status', 'approved');
      if (error) throw error;
      const ids = [...new Set((data ?? []).map((r: { canonical_property_id: string }) => r.canonical_property_id))];
      for (const id of ids) {
        await supabase.rpc('recompute_property_truth_score', { p_property_id: id });
      }
      return json({ recomputed: ids.length });
    }

    return new Response(JSON.stringify({ error: 'Provide propertyId or all:true' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  function json(body: unknown) {
    return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
