// Fetch public Google reviews (up to 5 per property, Google's cap) via
// Google Places API, and cache them in property_external_reviews. Admin-only.
//
// Requires GOOGLE_PLACES_API_KEY in the project secrets. Enable "Places API
// (New)" in Google Cloud, and restrict the key to that API.
//
// Flow per property:
//   1) If google_place_id is missing, search by "name, address_line1, city, state".
//   2) Call Place Details (fields=reviews,rating,userRatingCount).
//   3) Upsert each review into property_external_reviews (source=google_places).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const PLACES_SEARCH = 'https://places.googleapis.com/v1/places:searchText';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleKey) return json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, 500);

    const authed = createClient(supaUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await authed.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401);
    const userId = claims.claims.sub as string;

    const admin = createClient(supaUrl, serviceKey);
    const { data: role } = await admin.from('user_roles').select('role')
      .eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!role) return json({ error: 'Admin only' }, 403);

    const body = await req.json().catch(() => ({}));
    const propertyIds: string[] | undefined = Array.isArray(body.propertyIds) ? body.propertyIds : undefined;
    const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 100);

    let q = admin.from('properties')
      .select('id, name, address_line1, city, state, zip, google_place_id')
      .limit(limit);
    if (propertyIds && propertyIds.length) q = q.in('id', propertyIds);
    const { data: props, error: pErr } = await q;
    if (pErr) return json({ error: 'properties fetch failed', detail: pErr.message }, 500);

    const perProperty: any[] = [];
    let totalReviews = 0;

    for (const p of props ?? []) {
      let placeId = p.google_place_id as string | null;
      let placeStatus = 'existing';
      if (!placeId) {
        const query = [p.name, p.address_line1, p.city, p.state, p.zip].filter(Boolean).join(', ');
        const found = await searchPlace(googleKey, query);
        if (!found) {
          perProperty.push({ propertyId: p.id, status: 'no_place_found', query });
          continue;
        }
        placeId = found;
        placeStatus = 'newly_found';
        await admin.from('properties').update({ google_place_id: placeId }).eq('id', p.id);
      }

      const details = await placeDetails(googleKey, placeId);
      if (!details) {
        perProperty.push({ propertyId: p.id, status: 'no_details', placeId });
        continue;
      }
      const reviews = Array.isArray(details.reviews) ? details.reviews : [];
      let inserted = 0;
      for (const r of reviews) {
        const row = {
          property_id: p.id,
          source: 'google_places',
          source_review_id: String(r.name ?? r.publishTime ?? crypto.randomUUID()),
          source_url: r.googleMapsUri ?? null,
          author_name: r.authorAttribution?.displayName ?? null,
          author_url: r.authorAttribution?.uri ?? null,
          rating: typeof r.rating === 'number' ? r.rating : null,
          text: r.text?.text ?? r.originalText?.text ?? null,
          language: r.text?.languageCode ?? null,
          published_at: r.publishTime ?? null,
          raw: r,
        };
        const { error } = await admin.from('property_external_reviews')
          .upsert(row, { onConflict: 'property_id,source,source_review_id' });
        if (!error) inserted++;
      }
      totalReviews += inserted;
      perProperty.push({
        propertyId: p.id,
        placeId,
        placeStatus,
        rating: details.rating ?? null,
        totalRatings: details.userRatingCount ?? null,
        reviewsInserted: inserted,
      });
      // Gentle pacing
      await new Promise((res) => setTimeout(res, 150));
    }

    return json({ ok: true, propertiesProcessed: perProperty.length, totalReviews, perProperty });
  } catch (e) {
    return json({ error: 'Unhandled', detail: String(e) }, 500);
  }
});

async function searchPlace(apiKey: string, query: string): Promise<string | null> {
  const res = await fetch(PLACES_SEARCH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: query }),
  });
  if (!res.ok) { await res.text(); return null; }
  const data = await res.json();
  return data.places?.[0]?.id ?? null;
}

async function placeDetails(apiKey: string, placeId: string): Promise<any | null> {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews',
    },
  });
  if (!res.ok) { await res.text(); return null; }
  return await res.json();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}