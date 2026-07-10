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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { corsHeaders } from '../_shared/auth.ts';

const PLACES_SEARCH = 'https://places.googleapis.com/v1/places:searchText';

type PlaceCandidate = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
};

type GoogleResult<T> = {
  data: T | null;
  error: string | null;
  status?: number;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Accept either a dedicated Places key OR the same Google Cloud key we
    // already use for YouTube (many users enable Places API on that same key).
    const googleKey =
      Deno.env.get('GOOGLE_PLACES_API_KEY') ||
      Deno.env.get('YOUTUBE_API_KEY');
    if (!googleKey) return json({ error: 'No Google API key configured (GOOGLE_PLACES_API_KEY or YOUTUBE_API_KEY)' }, 500);

    const admin = createClient(supaUrl, serviceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.id) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;

    const { data: role } = await admin.from('user_roles').select('role')
      .eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!role) return json({ error: 'Admin only' }, 403);

    const body = await req.json().catch(() => ({}));
    const propertyIds: string[] | undefined = Array.isArray(body.propertyIds) ? body.propertyIds : undefined;
    const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 100);

    let q = admin.from('properties')
      .select('id, name, address, address_line1, city, state, zip, zip_code, google_place_id')
      .limit(limit);
    if (propertyIds && propertyIds.length) q = q.in('id', propertyIds);
    const { data: props, error: pErr } = await q;
    if (pErr) return json({ error: 'properties fetch failed', detail: pErr.message }, 500);

    const perProperty: any[] = [];
    let totalReviews = 0;

    for (const p of props ?? []) {
      let placeId = p.google_place_id as string | null;
      let placeStatus = 'existing';
      let details: any | null = null;
      const attempts: any[] = [];

      if (placeId) {
        const existingDetails = await placeDetails(googleKey, placeId);
        if (existingDetails.error) {
          perProperty.push({
            propertyId: p.id,
            propertyName: p.name,
            status: 'google_api_error',
            stage: 'place_details',
            placeId,
            error: existingDetails.error,
            httpStatus: existingDetails.status ?? null,
          });
          continue;
        }
        details = existingDetails.data;
        attempts.push({ kind: 'cached_place_id', placeId, reviews: Array.isArray(details?.reviews) ? details.reviews.length : 0 });
      }

      if (!details || !Array.isArray(details.reviews) || details.reviews.length === 0) {
        const queries = buildSearchQueries(p);
        let foundAnyCandidate = false;
        let apiError: { error: string; status?: number; query: string } | null = null;

        for (const query of queries) {
          const searched = await searchPlaces(googleKey, query);
          if (searched.error) {
            apiError = { error: searched.error, status: searched.status, query };
            break;
          }

          const candidates = searched.data ?? [];
          foundAnyCandidate = foundAnyCandidate || candidates.length > 0;
          const rankedCandidates = [...candidates].sort((a, b) => Number(b.userRatingCount ?? 0) - Number(a.userRatingCount ?? 0));
          attempts.push({
            kind: 'search',
            query,
            candidates: rankedCandidates.slice(0, 3).map((c) => ({
              id: c.id,
              name: c.displayName?.text ?? null,
              address: c.formattedAddress ?? null,
              rating: c.rating ?? null,
              userRatingCount: c.userRatingCount ?? null,
            })),
          });

          for (const candidate of rankedCandidates.slice(0, 5)) {
            if (!candidate.id || candidate.id === placeId) continue;
            const candidateDetails = await placeDetails(googleKey, candidate.id);
            if (candidateDetails.error) {
              apiError = { error: candidateDetails.error, status: candidateDetails.status, query };
              break;
            }
            const reviewCount = Array.isArray(candidateDetails.data?.reviews) ? candidateDetails.data.reviews.length : 0;
            attempts.push({ kind: 'candidate_details', placeId: candidate.id, placeName: candidate.displayName?.text ?? null, reviews: reviewCount });
            if (reviewCount > 0 || !details) {
              placeId = candidate.id;
              placeStatus = 'newly_found';
              details = candidateDetails.data;
            }
            if (reviewCount > 0) break;
          }

          if (apiError || (details && Array.isArray(details.reviews) && details.reviews.length > 0)) break;
        }

        if (apiError) {
          perProperty.push({
            propertyId: p.id,
            propertyName: p.name,
            status: 'google_api_error',
            stage: 'place_search',
            query: apiError.query,
            error: apiError.error,
            httpStatus: apiError.status ?? null,
            attempts,
          });
          continue;
        }

        if (!details || !placeId) {
          perProperty.push({
            propertyId: p.id,
            propertyName: p.name,
            status: foundAnyCandidate ? 'no_details' : 'no_place_found',
            queries,
            attempts,
          });
          continue;
        }

        if (placeStatus === 'newly_found') {
          await admin.from('properties').update({ google_place_id: placeId }).eq('id', p.id);
        }
      }

      const reviews = Array.isArray(details.reviews) ? details.reviews : [];
      if (reviews.length === 0) {
        perProperty.push({
          propertyId: p.id,
          propertyName: p.name,
          status: 'no_reviews_returned',
          placeId,
          placeStatus,
          rating: details.rating ?? null,
          totalRatings: details.userRatingCount ?? null,
          attempts,
        });
        continue;
      }

      let inserted = 0;
      let insertErrors = 0;
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
        else insertErrors++;
      }
      totalReviews += inserted;
      perProperty.push({
        propertyId: p.id,
        placeId,
        placeStatus,
        rating: details.rating ?? null,
        totalRatings: details.userRatingCount ?? null,
        reviewsInserted: inserted,
        insertErrors,
        status: inserted > 0 ? 'reviews_cached' : 'insert_failed',
        attempts,
      });
      // Gentle pacing
      await new Promise((res) => setTimeout(res, 150));
    }

    const statusCounts = perProperty.reduce<Record<string, number>>((acc, item) => {
      const key = String(item.status ?? 'unknown');
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const sampleFailures = perProperty
      .filter((item) => item.status !== 'reviews_cached')
      .slice(0, 8)
      .map((item) => ({
        propertyName: item.propertyName ?? item.propertyId,
        status: item.status,
        error: item.error ?? null,
        query: item.query ?? item.queries?.[0] ?? null,
        placeId: item.placeId ?? null,
        rating: item.rating ?? null,
        totalRatings: item.totalRatings ?? null,
      }));

    return json({ ok: true, propertiesProcessed: perProperty.length, totalReviews, statusCounts, sampleFailures, perProperty });
  } catch (e) {
    return json({ error: 'Unhandled', detail: String(e) }, 500);
  }
});

function buildSearchQueries(p: any): string[] {
  const address = p.address_line1 || p.address;
  const zip = p.zip || p.zip_code;
  const fullAddress = [address, p.city, p.state, zip].filter(Boolean).join(', ');
  const name = String(p.name ?? '').trim();
  const queries = [
    name && fullAddress && !sameNormalized(name, fullAddress) ? `${name}, ${fullAddress}` : null,
    fullAddress ? `${fullAddress} apartments` : null,
    name || fullAddress,
  ].filter(Boolean) as string[];
  return [...new Set(queries)];
}

function sameNormalized(a: string, b: string): boolean {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

async function searchPlaces(apiKey: string, query: string): Promise<GoogleResult<PlaceCandidate[]>> {
  const res = await fetch(PLACES_SEARCH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 10 }),
  });
  if (!res.ok) return { data: null, error: await googleError(res), status: res.status };
  const data = await res.json();
  return { data: Array.isArray(data.places) ? data.places : [], error: null };
}

async function placeDetails(apiKey: string, placeId: string): Promise<GoogleResult<any>> {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,reviews',
    },
  });
  if (!res.ok) return { data: null, error: await googleError(res), status: res.status };
  return { data: await res.json(), error: null };
}

async function googleError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  if (!text) return `Google API returned HTTP ${res.status}`;
  try {
    const parsed = JSON.parse(text);
    return String(parsed?.error?.message ?? parsed?.message ?? text).slice(0, 500);
  } catch {
    return text.slice(0, 500);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}