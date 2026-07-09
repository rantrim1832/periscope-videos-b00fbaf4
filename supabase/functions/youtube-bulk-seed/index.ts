// Bulk seed — loops every curated category and every suggested query,
// invoking the same YouTube search + insert logic as `youtube-import`.
// One admin click yields hundreds of embeddable videos across all subjects.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const YT_API = 'https://www.googleapis.com/youtube/v3';

// Kept in sync with src/lib/curatedCategories.ts. Duplicated here because
// edge functions can't import from the frontend bundle.
const CATEGORIES: { slug: string; queries: string[] }[] = [
  { slug: 'maintenance', queries: [
    'apartment maintenance nightmare','apartment mold problem','apartment ceiling leak story',
    'bad landlord maintenance','apartment pest infestation','apartment ac broken summer',
  ]},
  { slug: 'application', queries: [
    'apartment application fees hidden','apartment security deposit scam',
    'apartment lease surprise fees','apartment denied application story','apartment lease breaking fees',
  ]},
  { slug: 'local-vibe', queries: [
    'brooklyn apartment neighborhood walk','best apartment neighborhoods nyc',
    'apartment neighborhood safety review','downtown la apartment area vibe',
    'chicago apartment neighborhood tour','austin apartment neighborhood guide',
  ]},
  { slug: 'amenities', queries: [
    'luxury apartment amenities tour','apartment gym pool tour',
    'apartment rooftop amenity','apartment coworking lounge tour','apartment building amenities review',
  ]},
  { slug: 'tours', queries: [
    'nyc apartment tour','la luxury apartment tour','chicago high rise apartment tour',
    'apartment tour before signing','miami luxury apartment tour','seattle apartment tour',
  ]},
  { slug: 'design-tips', queries: [
    'small apartment design tips','rental apartment decor ideas','ikea apartment hacks',
    'studio apartment makeover','apartment organization tips','rental friendly apartment upgrades',
  ]},
  { slug: 'leasing-gurus', queries: [
    'apartment leasing agent tips','how to negotiate rent',
    'apartment red flags before signing','renters rights explained','first time apartment renter tips',
  ]},
  { slug: 'reviews', queries: [
    'honest apartment review','moving out apartment review',
    'worst apartment i lived in','apartment complex review','luxury apartment honest review',
  ]},
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ytKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!ytKey) return json({ error: 'YOUTUBE_API_KEY not configured' }, 500);

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
    const perQuery = Math.min(Math.max(Number(body.perQuery) || 15, 1), 50);
    const onlyCategory: string | undefined = body.category;
    const cats = onlyCategory ? CATEGORIES.filter((c) => c.slug === onlyCategory) : CATEGORIES;

    const perCat: Record<string, { imported: number; skipped: number; found: number }> = {};
    let totalImported = 0, totalSkipped = 0, totalFound = 0;

    for (const cat of cats) {
      perCat[cat.slug] = { imported: 0, skipped: 0, found: 0 };
      for (const q of cat.queries) {
        const r = await searchAndInsert(admin, ytKey, q, cat.slug, perQuery);
        perCat[cat.slug].imported += r.imported;
        perCat[cat.slug].skipped += r.skipped;
        perCat[cat.slug].found += r.found;
        totalImported += r.imported;
        totalSkipped += r.skipped;
        totalFound += r.found;
        // Gentle pacing to stay well under YouTube quota bursts.
        await new Promise((res) => setTimeout(res, 150));
      }
    }

    return json({ ok: true, totalImported, totalSkipped, totalFound, perCategory: perCat });
  } catch (e) {
    return json({ error: 'Unhandled', detail: String(e) }, 500);
  }
});

async function searchAndInsert(admin: any, ytKey: string, query: string, category: string, maxResults: number) {
  const searchUrl = new URL(`${YT_API}/search`);
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('maxResults', String(maxResults));
  searchUrl.searchParams.set('videoEmbeddable', 'true');
  searchUrl.searchParams.set('safeSearch', 'moderate');
  searchUrl.searchParams.set('relevanceLanguage', 'en');
  searchUrl.searchParams.set('key', ytKey);

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) return { imported: 0, skipped: 0, found: 0 };
  const searchJson = await searchRes.json();
  const ids: string[] = (searchJson.items ?? []).map((it: any) => it?.id?.videoId).filter(Boolean);
  if (ids.length === 0) return { imported: 0, skipped: 0, found: 0 };

  const ytTags = ids.map((id) => `yt:${id}`);
  const { data: existing } = await admin.from('seeded_videos').select('hashtags').overlaps('hashtags', ytTags);
  const existingIds = new Set<string>();
  for (const row of existing ?? []) {
    for (const t of row.hashtags ?? []) {
      if (typeof t === 'string' && t.startsWith('yt:')) existingIds.add(t.slice(3));
    }
  }
  const freshIds = ids.filter((id) => !existingIds.has(id));
  if (freshIds.length === 0) return { imported: 0, skipped: ids.length, found: ids.length };

  const detailsUrl = new URL(`${YT_API}/videos`);
  detailsUrl.searchParams.set('part', 'snippet');
  detailsUrl.searchParams.set('id', freshIds.join(','));
  detailsUrl.searchParams.set('key', ytKey);
  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) return { imported: 0, skipped: ids.length - freshIds.length, found: ids.length };
  const detailsJson = await detailsRes.json();

  const rows: any[] = [];
  for (const it of detailsJson.items ?? []) {
    const vid = it.id as string;
    const snip = it.snippet ?? {};
    const title = String(snip.title ?? '').slice(0, 300);
    const channel = String(snip.channelTitle ?? '').slice(0, 120);
    const description = String(snip.description ?? '').slice(0, 400);
    rows.push({
      title: title || 'Untitled',
      embed_url: `https://www.youtube.com/embed/${vid}`,
      caption: channel ? `${channel} · ${description}` : description,
      hashtags: [
        `cat:${category}`, `yt:${vid}`,
        channel ? `ch:${channel}` : null,
        `src:https://www.youtube.com/watch?v=${vid}`,
      ].filter(Boolean),
      source: 'youtube',
      moderation_status: 'approved',
      is_positive: false,
    });
  }

  let inserted = 0;
  if (rows.length > 0) {
    const { error, count } = await admin.from('seeded_videos').insert(rows, { count: 'exact' });
    if (!error) inserted = count ?? rows.length;
  }
  return { imported: inserted, skipped: ids.length - freshIds.length, found: ids.length };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}