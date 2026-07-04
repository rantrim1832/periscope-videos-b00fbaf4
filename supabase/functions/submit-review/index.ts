// Server-side review submission — the tamper-proof write path.
//
// Moderation MUST happen server-side: a client cannot be trusted to declare its
// own content "approved". This function verifies the user, moderates
// FAIL-CLOSED, and inserts into canonical_review with the service role. The DB
// trigger then auto-recomputes the property's Truth Score.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODERATION_UNCERTAIN = ['moderation_unavailable', 'moderation_error', 'moderation_exception'];

// Parse a public social URL into an embeddable iframe src (no re-host).
function parseEmbed(raw: string): { platform: string; embedUrl: string } | null {
  if (!raw) return null;
  const yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return { platform: 'youtube', embedUrl: `https://www.youtube.com/embed/${yt[1]}` };
  const tt = raw.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|v\/)(\d+)/);
  if (tt) return { platform: 'tiktok', embedUrl: `https://www.tiktok.com/embed/v2/${tt[1]}` };
  const ig = raw.match(/instagram\.com\/(?:reel|p|tv)\/([\w-]+)/);
  if (ig) return { platform: 'instagram', embedUrl: `https://www.instagram.com/reel/${ig[1]}/embed` };
  return null;
}

interface Moderation { approved: boolean; score: number; flags: string[]; reason?: string }

async function moderate(text: string): Promise<Moderation> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return { approved: false, score: 1, flags: ['moderation_unavailable'], reason: 'Moderation unavailable' };
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Moderate apartment-review content. Reply ONLY JSON: {"toxicity_score":0..1,"flags":[],"approved":bool,"reason":""}. Allow honest negative reviews; block hate, threats, sexual content, doxxing, spam.' },
          { role: 'user', content: text },
        ],
      }),
    });
    if (!res.ok) return { approved: false, score: 1, flags: ['moderation_error'], reason: 'Service error' };
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    return {
      approved: !!parsed.approved && (parsed.toxicity_score ?? 1) <= 0.7,
      score: parsed.toxicity_score ?? 1,
      flags: parsed.flags ?? [],
      reason: parsed.reason,
    };
  } catch {
    return { approved: false, score: 1, flags: ['moderation_exception'], reason: 'Exception' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Auth
  const authHeader = req.headers.get('Authorization');
  const { data: { user } } = authHeader
    ? await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    : { data: { user: null } };
  if (!user) {
    return new Response(JSON.stringify({ error: 'Sign in to post' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const draft = await req.json();
    if (!draft?.propertyId || !draft?.title) {
      return new Response(JSON.stringify({ error: 'propertyId and title required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const text = [draft.title, draft.body].filter(Boolean).join('\n').trim();
    const mod = await moderate(text || draft.title);
    const uncertain = mod.flags.some((f: string) => MODERATION_UNCERTAIN.includes(f));
    const moderationStatus = uncertain ? 'pending' : mod.approved ? 'approved' : 'rejected';
    const resultStatus = moderationStatus === 'approved' ? 'published' : moderationStatus;

    const embed = draft.type === 'import' ? parseEmbed(draft.importUrl ?? '') : null;

    const { data, error } = await supabase
      .from('canonical_review')
      .insert({
        canonical_property_id: draft.propertyId,
        resident_id: user.id,
        author_pseudonym: draft.anonymous ? null : (draft.pseudonym ?? null),
        trust_tier: draft.trustTier ?? 'unverified',
        life_stage: draft.lifeStage ?? 'living',
        content_type: draft.type ?? 'text',
        title: draft.title,
        body: draft.body ?? null,
        ratings: draft.ratings ?? {},
        would_lease_again: draft.wouldLeaseAgain ?? null,
        media_asset_id: draft.mediaAssetId ?? null,
        embed_url: embed?.embedUrl ?? null,
        embed_platform: embed?.platform ?? null,
        has_video: draft.type === 'video' || !!embed,
        source: 'resident',
        moderation_status: moderationStatus,
        moderation_score: mod.score,
        ai_flags: mod.flags,
      })
      .select('id')
      .single();
    if (error) throw error;

    // Truth Score recompute is handled automatically by the DB trigger.
    return new Response(
      JSON.stringify({ status: resultStatus, reviewId: data.id, reason: mod.reason }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
