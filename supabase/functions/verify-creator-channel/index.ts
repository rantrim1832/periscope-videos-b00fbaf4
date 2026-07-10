// Verifies a creator owns their linked YouTube channel by checking that the
// channel description contains the unique PERISCOPE-VERIFY-XXXXXX code we
// issued. On success, auto-claims all seeded_videos where channel_id matches.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')!;

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
    const userId = userData.user.id;

    const { data: channel, error: chErr } = await admin
      .from('creator_channels')
      .select('id, youtube_channel_id, verification_code')
      .eq('user_id', userId)
      .maybeSingle();
    if (chErr || !channel) {
      return new Response(JSON.stringify({ error: 'No creator channel found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!channel.youtube_channel_id || !channel.verification_code) {
      return new Response(JSON.stringify({ error: 'Link YouTube and request a verification code first' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channel.youtube_channel_id}&key=${YOUTUBE_API_KEY}`);
    const j = await r.json();
    const description = j?.items?.[0]?.snippet?.description ?? '';

    if (!description.includes(channel.verification_code)) {
      return new Response(JSON.stringify({ error: 'Code not found in YouTube channel description', verified: false }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await admin.from('creator_channels').update({
      verified: true,
      verified_at: new Date().toISOString(),
      status: 'approved',
    }).eq('id', channel.id);

    // Auto-claim: attribute matching seeded_videos to this creator.
    const { data: claimed } = await admin
      .from('seeded_videos')
      .update({ creator_id: channel.id, source_kind: 'claimed' })
      .eq('channel_id', channel.youtube_channel_id)
      .is('creator_id', null)
      .select('id');

    return new Response(JSON.stringify({ verified: true, claimed_count: claimed?.length ?? 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('verify-creator-channel error', err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});