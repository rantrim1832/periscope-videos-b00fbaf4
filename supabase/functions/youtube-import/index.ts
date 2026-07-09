// YouTube import — bulk-imports publicly posted YouTube videos matching a
// query into `seeded_videos` so the logged-in feed can render a full,
// varied catalog per category. We only store metadata + the official embed
// URL; the video itself is streamed by YouTube's iframe (ToS-compliant,
// creator credit preserved via the embed).
//
// Category is stored as the first hashtag prefixed with `cat:` so we don't
// need a schema migration. Source URL and channel go in follow-up tags.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const YT_API = 'https://www.googleapis.com/youtube/v3';

interface ImportBody {
  query: string;
  category: string;        // slug, e.g. "maintenance"
  maxResults?: number;     // 1–50
  videoDuration?: 'any' | 'short' | 'medium' | 'long';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ytKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!ytKey) return json({ error: 'YOUTUBE_API_KEY not configured' }, 500);

    // Verify caller is an admin.
    const authed = createClient(supaUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await authed.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401);
    const userId = claims.claims.sub as string;

    const admin = createClient(supaUrl, serviceKey);
    const { data: role } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    if (!role) return json({ error: 'Admin only' }, 403);

    const body = (await req.json()) as ImportBody;
    const query = (body.query ?? '').trim();
    const category = (body.category ?? '').trim();
    const maxResults = Math.min(Math.max(body.maxResults ?? 25, 1), 50);
    const videoDuration = body.videoDuration ?? 'any';
    if (!query || !category) return json({ error: 'query and category are required' }, 400);

    // 1) Search for video IDs.
    const searchUrl = new URL(`${YT_API}/search`);
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', String(maxResults));
    searchUrl.searchParams.set('videoEmbeddable', 'true');
    searchUrl.searchParams.set('safeSearch', 'moderate');
    searchUrl.searchParams.set('relevanceLanguage', 'en');
    if (videoDuration !== 'any') searchUrl.searchParams.set('videoDuration', videoDuration);
    searchUrl.searchParams.set('key', ytKey);

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      const t = await searchRes.text();
      return json({ error: 'YouTube search failed', detail: t }, searchRes.status);
    }
    const searchJson = await searchRes.json();
    const ids: string[] = (searchJson.items ?? [])
      .map((it: any) => it?.id?.videoId)
      .filter(Boolean);
    if (ids.length === 0) return json({ imported: 0, skipped: 0, results: [] });

    // 2) Skip anything already stored (by yt:<id> tag).
    const ytTags = ids.map((id) => `yt:${id}`);
    const { data: existing } = await admin
      .from('seeded_videos')
      .select('hashtags')
      .overlaps('hashtags', ytTags);
    const existingIds = new Set<string>();
    for (const row of existing ?? []) {
      for (const t of row.hashtags ?? []) {
        if (typeof t === 'string' && t.startsWith('yt:')) existingIds.add(t.slice(3));
      }
    }
    const freshIds = ids.filter((id) => !existingIds.has(id));

    // 3) Fetch full snippet data for the fresh IDs.
    const rows: any[] = [];
    if (freshIds.length > 0) {
      const detailsUrl = new URL(`${YT_API}/videos`);
      detailsUrl.searchParams.set('part', 'snippet');
      detailsUrl.searchParams.set('id', freshIds.join(','));
      detailsUrl.searchParams.set('key', ytKey);
      const detailsRes = await fetch(detailsUrl);
      if (!detailsRes.ok) {
        const t = await detailsRes.text();
        return json({ error: 'YouTube details failed', detail: t }, detailsRes.status);
      }
      const detailsJson = await detailsRes.json();
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
            `cat:${category}`,
            `yt:${vid}`,
            `q:${query}`,
            channel ? `ch:${channel}` : null,
            `src:https://www.youtube.com/watch?v=${vid}`,
          ].filter(Boolean),
          source: 'youtube',
          moderation_status: 'approved',
          is_positive: false,
        });
      }
    }

    let inserted = 0;
    if (rows.length > 0) {
      const { error: insErr, count } = await admin
        .from('seeded_videos')
        .insert(rows, { count: 'exact' });
      if (insErr) return json({ error: 'Insert failed', detail: insErr.message }, 500);
      inserted = count ?? rows.length;
    }

    return json({
      imported: inserted,
      skipped: ids.length - freshIds.length,
      totalFound: ids.length,
    });
  } catch (e) {
    return json({ error: 'Unhandled', detail: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
