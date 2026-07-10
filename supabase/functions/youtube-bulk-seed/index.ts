// Bulk seed — loops every curated category and every suggested query,
// invoking the same YouTube search + insert logic as `youtube-import`.
// One admin click yields hundreds of embeddable videos across all subjects.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { corsHeaders } from '../_shared/auth.ts';

const YT_API = 'https://www.googleapis.com/youtube/v3';

function getYouTubeApiKey(): string | null {
  return (
    Deno.env.get('YOUTUBE_API_KEY') ||
    Deno.env.get('GOOGLE_API_KEY') ||
    Deno.env.get('GOOGLE_PLACES_API_KEY') ||
    null
  );
}

// Periscope covers large multifamily apartment BUILDINGS. Exclude Airbnb /
// short-term rentals and NYC-style "houses called apartments" (brownstones,
// townhouses, single-family) so seeded content stays on-brand.
const NEGATIVE_QUERY_TERMS =
  ' -airbnb -bnb -"air bnb" -brownstone -townhouse -"single family" -house';
const BLOCKED_RE =
  /\b(airbnb|air\s*bnb|brownstone|townhouse|single[-\s]?family|brooklyn|manhattan|new york city|\bnyc\b)\b/i;

async function readYouTubeError(res: Response): Promise<{ quotaExceeded: boolean }> {
  const detail = await res.text();
  return {
    quotaExceeded:
      res.status === 429 ||
      /quota exceeded|rateLimitExceeded|RATE_LIMIT_EXCEEDED|RESOURCE_EXHAUSTED|defaultSearchListPerDayPerProject/i.test(detail),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ytKey = getYouTubeApiKey();
    if (!ytKey) {
      return json({
        error: 'YouTube API key not configured on the production backend',
        detail: 'Set YOUTUBE_API_KEY for the deployed backend function and redeploy youtube-bulk-seed.',
      }, 500);
    }

    const admin = createClient(supaUrl, serviceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.id) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;

    const { data: role } = await admin.from('user_roles').select('role')
      .eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!role) return json({ error: 'Admin only' }, 403);

    const body = await req.json().catch(() => ({}));
    const perQuery = Math.min(Math.max(Number(body.perQuery) || 15, 1), 50);
    const onlyCategory: string | undefined = body.category;

    // Load categories from DB (editable via /admin/curated).
    let catQ = admin
      .from('curated_categories')
      .select('slug, suggested_queries')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (onlyCategory) catQ = catQ.eq('slug', onlyCategory);
    const { data: catRows, error: catErr } = await catQ;
    if (catErr) return json({ error: 'Failed to load categories', detail: catErr.message }, 500);
    const cats = (catRows ?? []).map((r: any) => ({
      slug: r.slug as string,
      queries: (Array.isArray(r.suggested_queries) ? r.suggested_queries : []) as string[],
    }));
    if (cats.length === 0) return json({ error: 'No categories found' }, 400);

    const perCat: Record<string, { imported: number; skipped: number; found: number }> = {};
    let totalImported = 0, totalSkipped = 0, totalFound = 0;

    for (const cat of cats) {
      perCat[cat.slug] = { imported: 0, skipped: 0, found: 0 };
      for (const q of cat.queries) {
        const r = await searchAndInsert(admin, ytKey, q, cat.slug, perQuery);
        if (r.quotaExceeded) {
          return json({
            ok: false,
            quotaExceeded: true,
            error: 'YouTube daily search quota is exhausted. Manual link import still works; wait for the daily reset or use a key/project with higher YouTube Search quota.',
            totalImported,
            totalSkipped,
            totalFound,
            perCategory: perCat,
          });
        }
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
  searchUrl.searchParams.set('q', query + NEGATIVE_QUERY_TERMS);
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('maxResults', String(maxResults));
  searchUrl.searchParams.set('videoEmbeddable', 'true');
  searchUrl.searchParams.set('safeSearch', 'moderate');
  searchUrl.searchParams.set('relevanceLanguage', 'en');
  searchUrl.searchParams.set('key', ytKey);

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    const { quotaExceeded } = await readYouTubeError(searchRes);
    return { imported: 0, skipped: 0, found: 0, quotaExceeded };
  }
  const searchJson = await searchRes.json();
  const ids: string[] = (searchJson.items ?? []).map((it: any) => it?.id?.videoId).filter(Boolean);
  if (ids.length === 0) return { imported: 0, skipped: 0, found: 0 };

  const existingIds = await loadExistingYouTubeIds(admin);
  const freshIds = ids.filter((id) => !existingIds.has(id));
  if (freshIds.length === 0) return { imported: 0, skipped: ids.length, found: ids.length };

  const detailsUrl = new URL(`${YT_API}/videos`);
  detailsUrl.searchParams.set('part', 'snippet');
  detailsUrl.searchParams.set('id', freshIds.join(','));
  detailsUrl.searchParams.set('key', ytKey);
  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) {
    const { quotaExceeded } = await readYouTubeError(detailsRes);
    return { imported: 0, skipped: ids.length - freshIds.length, found: ids.length, quotaExceeded };
  }
  const detailsJson = await detailsRes.json();

  const rows: any[] = [];
  for (const it of detailsJson.items ?? []) {
    const vid = it.id as string;
    const snip = it.snippet ?? {};
    const title = String(snip.title ?? '').slice(0, 300);
    const channel = String(snip.channelTitle ?? '').slice(0, 120);
    const description = String(snip.description ?? '').slice(0, 400);
    // Skip Airbnb / NYC-house content — not what Periscope is about.
    if (BLOCKED_RE.test(title) || BLOCKED_RE.test(channel) || BLOCKED_RE.test(description)) continue;
    rows.push({
      title: title || 'Untitled',
      embed_url: `https://www.youtube.com/embed/${vid}`,
      caption: channel ? `${channel} · ${description}` : description,
      hashtags: [
        `cat:${category}`, `yt:${vid}`,
        `q:${query}`,
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
  return { imported: inserted, skipped: ids.length - freshIds.length, found: ids.length, quotaExceeded: false };
}

async function loadExistingYouTubeIds(admin: any): Promise<Set<string>> {
  const { data } = await admin
    .from('seeded_videos')
    .select('hashtags')
    .eq('source', 'youtube')
    .limit(20000);
  const existingIds = new Set<string>();
  for (const row of data ?? []) {
    for (const t of normalizeTags(row.hashtags)) {
      if (t.startsWith('yt:')) existingIds.add(t.slice(3));
    }
  }
  return existingIds;
}

function normalizeTags(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === 'string') : [];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}