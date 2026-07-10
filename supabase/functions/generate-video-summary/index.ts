// Admin-only. For each requested seeded_videos row, ask Lovable AI for an
// original 2-3 sentence summary + 3-5 topical tags + a one-line editorial
// angle. Writes the result back into the `hashtags` array via prefixed
// entries (`summary:`, `tag:`, `angle:`) so we don't need a schema change.
//
// Body:
//   { videoIds?: string[]  }  — process just these rows
//   { limit?: number, onlyMissing?: boolean }  — bulk mode over any rows
//                                               without a summary yet
// Response:
//   { processed, updated, skipped, failures: [{id, reason}] }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { corsHeaders } from '../_shared/auth.ts';

const AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-3.5-flash';

type Row = {
  id: string;
  title: string | null;
  caption: string | null;
  city: string | null;
  hashtags: string[] | null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const aiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!aiKey) return json({ error: 'Missing LOVABLE_API_KEY' }, 500);

    const admin = createClient(supaUrl, serviceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.id) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;

    const { data: role } = await admin.from('user_roles').select('role')
      .eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!role) return json({ error: 'Admin only' }, 403);

    const body = await req.json().catch(() => ({})) as {
      videoIds?: string[]; limit?: number; onlyMissing?: boolean;
    };
    const limit = Math.min(Math.max(body.limit ?? 20, 1), 100);

    // Load rows
    let rows: Row[] = [];
    if (body.videoIds && body.videoIds.length > 0) {
      const { data, error } = await admin.from('seeded_videos')
        .select('id, title, caption, city, hashtags')
        .in('id', body.videoIds.slice(0, limit));
      if (error) return json({ error: 'Load failed', detail: error.message }, 500);
      rows = (data as Row[]) ?? [];
    } else {
      // onlyMissing = true by default in bulk mode
      const { data, error } = await admin.from('seeded_videos')
        .select('id, title, caption, city, hashtags')
        .eq('source', 'youtube')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) return json({ error: 'Load failed', detail: error.message }, 500);
      const all = (data as Row[]) ?? [];
      rows = (body.onlyMissing === false ? all : all.filter((r) => !hasSummary(r.hashtags))).slice(0, limit);
    }

    let updated = 0, skipped = 0;
    const failures: { id: string; reason: string }[] = [];

    for (const row of rows) {
      try {
        const channel = extractPrefix(row.hashtags, 'ch:');
        const category = extractPrefix(row.hashtags, 'cat:');
        const prompt = buildPrompt({ title: row.title, channel, city: row.city, caption: row.caption, category });

        const aiRes = await fetch(AI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Lovable-API-Key': aiKey,
            'X-Lovable-AIG-SDK': 'edge-function-fetch',
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
          }),
        });

        if (aiRes.status === 402) {
          return json({ error: 'AI credits exhausted. Add credits in workspace settings.', updated, skipped, failures }, 402);
        }
        if (aiRes.status === 429) {
          failures.push({ id: row.id, reason: 'Rate limited' });
          skipped++;
          await sleep(1500);
          continue;
        }
        if (!aiRes.ok) {
          failures.push({ id: row.id, reason: `AI ${aiRes.status}: ${(await aiRes.text()).slice(0, 200)}` });
          skipped++;
          continue;
        }
        const aiJson = await aiRes.json();
        const content = aiJson?.choices?.[0]?.message?.content;
        if (!content) { skipped++; failures.push({ id: row.id, reason: 'Empty AI response' }); continue; }
        const parsed = parseAiJson(content);
        if (!parsed?.summary) { skipped++; failures.push({ id: row.id, reason: 'AI returned no summary' }); continue; }

        const nextHashtags = withAiMeta(row.hashtags, parsed);
        const { error: upErr } = await admin.from('seeded_videos')
          .update({ hashtags: nextHashtags, updated_at: new Date().toISOString() })
          .eq('id', row.id);
        if (upErr) { failures.push({ id: row.id, reason: `DB: ${upErr.message}` }); skipped++; continue; }
        updated++;
      } catch (e) {
        failures.push({ id: row.id, reason: String(e) });
        skipped++;
      }
    }

    return json({ processed: rows.length, updated, skipped, failures });
  } catch (e) {
    return json({ error: 'Unhandled', detail: String(e) }, 500);
  }
});

// ----- helpers -----

const SYSTEM_PROMPT = `You are an editorial writer for Periscope, a directory of resident video reviews for large multifamily apartment buildings (50+ units). You write short, factual, original summaries around embedded YouTube videos so search engines index unique content and readers get a quick sense of what a video is about before they press play.

Rules:
- Never claim to have made the video. Write about it, not as it.
- Never invent facts not implied by the title, channel, or description.
- Keep the tone neutral, plain, and specific. No hype, no "click here", no emojis.
- Focus on the renter-useful angle: what a viewer will learn about a building, neighborhood, amenity, or process.
- Attribute in the summary when helpful (e.g. "In this walkthrough, @channelname shows...").
- Return ONLY valid JSON matching the requested schema. No prose outside JSON.`;

function buildPrompt(v: { title: string | null; channel: string | null; city: string | null; caption: string | null; category: string | null }): string {
  return `Video metadata:
- Title: ${v.title ?? '(untitled)'}
- Channel: ${v.channel ?? '(unknown)'}
- City: ${v.city ?? '(unspecified)'}
- Category: ${v.category ?? '(general)'}
- Original description snippet: ${(v.caption ?? '').slice(0, 500)}

Return JSON with exactly these fields:
{
  "summary": "2-3 sentence original summary written for a renter. Mention the channel by name once if useful. ~40-70 words. Never quote long strings from the description verbatim.",
  "angle": "One short editorial line (max 12 words) describing WHY a renter should watch — the practical takeaway.",
  "tags": ["3-5 short lowercase topic tags", "e.g. maintenance-response", "elevator", "move-in-condition"]
}`;
}

function parseAiJson(content: string): { summary: string; angle?: string; tags: string[] } | null {
  try {
    const j = JSON.parse(content);
    const summary = typeof j.summary === 'string' ? j.summary.trim() : '';
    if (!summary) return null;
    const angle = typeof j.angle === 'string' ? j.angle.trim() : '';
    const tags: string[] = Array.isArray(j.tags)
      ? j.tags.map((t: unknown) => String(t).toLowerCase().trim().replace(/\s+/g, '-')).filter(Boolean).slice(0, 6)
      : [];
    return { summary: summary.slice(0, 600), angle: angle.slice(0, 120), tags };
  } catch {
    return null;
  }
}

function hasSummary(hashtags: string[] | null): boolean {
  return Array.isArray(hashtags) && hashtags.some((t) => typeof t === 'string' && t.startsWith('summary:'));
}

function extractPrefix(hashtags: string[] | null, prefix: string): string | null {
  if (!Array.isArray(hashtags)) return null;
  const hit = hashtags.find((t) => typeof t === 'string' && t.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

function withAiMeta(
  hashtags: string[] | null | undefined,
  ai: { summary?: string | null; tags?: string[]; angle?: string | null }
): string[] {
  const keep = (Array.isArray(hashtags) ? hashtags : []).filter((t) => {
    if (typeof t !== 'string') return false;
    return !t.startsWith('summary:') && !t.startsWith('tag:') && !t.startsWith('angle:');
  });
  const next = [...keep];
  if (ai.summary) next.push(`summary:${ai.summary}`);
  if (ai.angle) next.push(`angle:${ai.angle}`);
  for (const tag of ai.tags ?? []) {
    const clean = String(tag).trim().slice(0, 40);
    if (clean) next.push(`tag:${clean}`);
  }
  return next;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}