// Verified creator submits a YouTube URL. We fetch metadata and insert a
// creator_submissions row for admin review.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { corsHeaders } from '../_shared/auth.ts';

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')!;

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

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

    const body = await req.json().catch(() => ({}));
    const youtubeUrl = String(body?.youtube_url ?? '').trim();
    const propertyId = body?.property_id ? String(body.property_id) : null;
    if (!youtubeUrl) return new Response(JSON.stringify({ error: 'youtube_url required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) return new Response(JSON.stringify({ error: 'Invalid YouTube URL' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: channel } = await admin
      .from('creator_channels')
      .select('id, verified, youtube_channel_id')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (!channel) return new Response(JSON.stringify({ error: 'No creator channel' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!channel.verified) return new Response(JSON.stringify({ error: 'Channel not verified yet' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`);
    const j = await r.json();
    const item = j?.items?.[0];
    if (!item) return new Response(JSON.stringify({ error: 'Video not found on YouTube' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (channel.youtube_channel_id && item.snippet.channelId !== channel.youtube_channel_id) {
      return new Response(JSON.stringify({ error: 'This video is not from your linked YouTube channel' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: submission, error: insErr } = await admin
      .from('creator_submissions')
      .insert({
        creator_id: channel.id,
        kind: 'youtube_url',
        youtube_url: youtubeUrl,
        youtube_video_id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        property_id: propertyId,
        status: 'pending',
      })
      .select()
      .single();
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ ok: true, submission }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('submit-creator-video error', err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});