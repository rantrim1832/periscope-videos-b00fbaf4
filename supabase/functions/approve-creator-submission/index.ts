// Admin promotes a pending creator_submission into seeded_videos, attributing
// it to the creator with source_kind='submitted'.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { corsHeaders } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const submissionId = String(body?.submission_id ?? '');
    const action = String(body?.action ?? 'approve'); // approve | reject
    const reviewerNotes = body?.reviewer_notes ? String(body.reviewer_notes) : null;
    if (!submissionId) return new Response(JSON.stringify({ error: 'submission_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: sub, error: subErr } = await admin
      .from('creator_submissions')
      .select('*, creator:creator_channels(id, youtube_channel_id, display_name)')
      .eq('id', submissionId)
      .maybeSingle();
    if (subErr || !sub) return new Response(JSON.stringify({ error: 'Submission not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (action === 'reject') {
      await admin.from('creator_submissions').update({ status: 'rejected', reviewer_notes: reviewerNotes }).eq('id', submissionId);
      return new Response(JSON.stringify({ ok: true, status: 'rejected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Approve → insert into seeded_videos
    if (sub.kind === 'youtube_url' && sub.youtube_video_id) {
      const embedUrl = `https://www.youtube-nocookie.com/embed/${sub.youtube_video_id}`;
      const hashtags = [`yt:${sub.youtube_video_id}`, ...(sub.hashtags ?? [])];
      await admin.from('seeded_videos').insert({
        title: sub.title ?? 'Creator submission',
        embed_url: embedUrl,
        source: 'youtube',
        moderation_status: 'approved',
        hashtags,
        caption: sub.description,
        channel_id: sub.creator?.youtube_channel_id ?? null,
        channel_title: sub.creator?.display_name ?? null,
        creator_id: sub.creator_id,
        source_kind: 'submitted',
      } as never);
    }

    await admin.from('creator_submissions').update({ status: 'approved', reviewer_notes: reviewerNotes }).eq('id', submissionId);
    return new Response(JSON.stringify({ ok: true, status: 'approved' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('approve-creator-submission error', err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});