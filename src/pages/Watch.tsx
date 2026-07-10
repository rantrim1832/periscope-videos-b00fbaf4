import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlayCircle, Lock, MapPin, ExternalLink, Sparkles, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { parseVideoMeta, youtubeUrlFor, youtubeChannelUrl } from '@/lib/videoMeta';
import { ShieldCheck } from 'lucide-react';
import type { CreatorChannel } from '@/lib/creatorTypes';
import { InspirationRails } from '@/components/contribute/InspirationRails';
import { publicContentClient } from '@/lib/publicContentClient';

type CuratedRow = {
  id: string;
  title: string;
  embed_url: string;
  hashtags: string[] | null;
  city: string | null;
  caption: string | null;
  source: string;
};

function extractYouTubeId(embedUrl: string, hashtags: string[] | null): string | null {
  const yt = (hashtags ?? []).find((t) => typeof t === 'string' && t.startsWith('yt:'));
  if (yt) return yt.slice(3);
  const m = embedUrl?.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/**
 * Public watch page. Embeds YouTube's privacy-enhanced iframe so playback
 * stays on the Periscope domain — users never bounce to youtube.com. The
 * page is fully public (no auth gate) so it's shareable and indexable, and
 * every card on the landing marquee links here.
 *
 * Route: /watch/:id  where :id is `seeded_videos.id` (UUID).
 */
export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<CuratedRow | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound'>('loading');
  const [creator, setCreator] = useState<CreatorChannel | null>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) { setStatus('notfound'); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await (publicContentClient as any)
        .from('seeded_videos')
        .select('id, title, embed_url, hashtags, city, caption, source')
        .eq('id', id)
        .eq('moderation_status', 'approved')
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) { setStatus('notfound'); return; }
      setRow(data as CuratedRow);
      setStatus('ok');
    })();
    return () => { cancelled = true; };
  }, [id]);

  useDocumentTitle(row ? `${row.title} — Periscope` : 'Watch — Periscope');

  if (status === 'notfound') return <Navigate to="/" replace />;
  if (status === 'loading' || !row) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading video…</div>
      </div>
    );
  }

  const ytId = extractYouTubeId(row.embed_url, row.hashtags);
  const embedSrc = ytId
    ? `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`
    : row.embed_url;
  const meta = parseVideoMeta(row.hashtags, row.caption);
  const channel = meta.channel ?? 'YouTube';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-primary">
            <ArrowLeft className="h-4 w-4" />
            Periscope
          </Link>
          <div className="flex items-center gap-2">
            {authed ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/feed">Feed</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/contribute">Add yours</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/auth?returnTo=%2Ffeed">Create free account</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Player */}
      <section className="bg-black">
        <div className="container py-4 md:py-6">
          <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
            <iframe
              src={embedSrc}
              title={row.title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="eager"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </section>

      {/* Meta + CTA */}
      <section className="container py-6 md:py-10 max-w-4xl">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-balance">{row.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {creator ? (
            <Link to={`/channel/${creator.handle}`} className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary">
              {creator.avatar_url && <img src={creator.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />}
              {creator.display_name}
              {creator.verified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{channel}</span>
          )}
          {row.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {row.city}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] uppercase tracking-wider">
            From YouTube
          </span>
        </div>

        {row.caption && (
          <p className="mt-4 text-sm md:text-base text-muted-foreground whitespace-pre-line">
            {row.caption}
          </p>
        )}

        {meta.angle && (
          <p className="mt-4 text-base md:text-lg font-medium text-foreground">
            {meta.angle}
          </p>
        )}
        {meta.summary && (
          <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Why we highlighted this
            </p>
            <p className="mt-1.5 text-sm md:text-base text-foreground/90 whitespace-pre-line">
              {meta.summary}
            </p>
          </div>
        )}
        {meta.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {meta.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted/40 text-muted-foreground">
                <Tag className="h-3 w-3" /> {t.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        )}
        {meta.editorNote && (
          <p className="mt-3 text-xs italic text-muted-foreground border-l-2 border-primary/40 pl-3">
            Editor's note: {meta.editorNote}
          </p>
        )}

        {/* Attribution — required by YouTube ToS and the right thing to do */}
        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>Original video by</span>
          {youtubeChannelUrl(channel) ? (
            <a href={youtubeChannelUrl(channel)!} target="_blank" rel="noopener noreferrer"
               className="font-semibold text-foreground hover:text-primary inline-flex items-center gap-1">
              {channel} <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="font-semibold text-foreground">{channel}</span>
          )}
          <span>on YouTube.</span>
          {youtubeUrlFor(meta.youtubeId) && (
            <a href={youtubeUrlFor(meta.youtubeId)!} target="_blank" rel="noopener noreferrer"
               className="text-primary hover:underline inline-flex items-center gap-1">
              Watch on YouTube <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="mt-8">
          <InspirationRails />
        </div>

        {/* Upsell — the whole point of keeping watchers on-site */}
        <div className="mt-8 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/15 p-2 text-primary">
              <PlayCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold tracking-tight">
                {authed ? 'Add your apartment video next' : 'See the real reviews behind the videos'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {authed
                  ? 'Post the kind of walkthrough, warning, or local detail you wish you had before signing.'
                  : 'Periscope collects real resident video reviews for 50+ unit apartment buildings — Truth Scores, deposit stories, maintenance timelines. Free with an account.'}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Button variant="hero" size="lg" asChild>
                  <Link to={authed ? '/contribute' : '/auth?returnTo=%2Ffeed'}>
                    {authed ? 'Add yours' : 'Create free account'}
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to={authed ? '/feed' : '/auth'}>
                    <Lock className="h-4 w-4" /> {authed ? 'Back to feed' : 'I already have one'}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD for the video — helps search discovery of watch pages */}
      {ytId && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'VideoObject',
              name: row.title,
              description: row.caption ?? row.title,
              thumbnailUrl: [`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`],
              uploadDate: undefined,
              embedUrl: embedSrc,
              contentUrl: `https://www.youtube.com/watch?v=${ytId}`,
            }),
          }}
        />
      )}
    </div>
  );
}