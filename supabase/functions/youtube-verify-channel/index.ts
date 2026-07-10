// Resolve a YouTube channel URL / @handle / raw UC... id to canonical channel
// data via YouTube Data API. Used by the creator dashboard when a creator
// links their YouTube channel.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { corsHeaders } from '../_shared/auth.ts';

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')!;

async function resolveChannel(input: string): Promise<{ id: string; title: string; description: string; thumbnail: string | null } | null> {
  const trimmed = input.trim();
  let channelId: string | null = null;
  let handle: string | null = null;

  const ucMatch = trimmed.match(/UC[A-Za-z0-9_-]{22}/);
  if (ucMatch) channelId = ucMatch[0];

  const handleMatch = trimmed.match(/@([A-Za-z0-9._-]+)/);
  if (!channelId && handleMatch) handle = handleMatch[1];

  if (channelId) {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`);
    const j = await r.json();
    const item = j?.items?.[0];
    if (!item) return null;
    return { id: item.id, title: item.snippet.title, description: item.snippet.description ?? '', thumbnail: item.snippet.thumbnails?.high?.url ?? null };
  }

  if (handle) {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=@${handle}&key=${YOUTUBE_API_KEY}`);
    const j = await r.json();
    const item = j?.items?.[0];
    if (!item) return null;
    return { id: item.id, title: item.snippet.title, description: item.snippet.description ?? '', thumbnail: item.snippet.thumbnails?.high?.url ?? null };
  }

  // Fallback: try search
  const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(trimmed)}&key=${YOUTUBE_API_KEY}`);
  const j = await r.json();
  const item = j?.items?.[0];
  if (!item) return null;
  return { id: item.snippet.channelId, title: item.snippet.channelTitle, description: '', thumbnail: item.snippet.thumbnails?.high?.url ?? null };
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
    const input = String(body?.input ?? '').slice(0, 500);
    if (!input) return new Response(JSON.stringify({ error: 'input required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const result = await resolveChannel(input);
    if (!result) return new Response(JSON.stringify({ error: 'Channel not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('youtube-verify-channel error', err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});