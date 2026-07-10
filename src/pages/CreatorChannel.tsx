import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ShieldCheck, Youtube, Instagram, Globe, PlayCircle } from 'lucide-react';
import type { CreatorChannel } from '@/lib/creatorTypes';

export default function CreatorChannelPage() {
  const { handle = '' } = useParams();
  const [channel, setChannel] = useState<CreatorChannel | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound'>('loading');

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from('creator_channels').select('*').eq('handle', handle).eq('status', 'approved').maybeSingle();
      if (!data) { setStatus('notfound'); return; }
      setChannel(data);
      const { data: vids } = await (supabase as any).from('seeded_videos')
        .select('id, title, embed_url, hashtags, city')
        .eq('creator_id', data.id)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });
      setVideos(vids ?? []);
      setStatus('ok');
    })();
  }, [handle]);

  useDocumentTitle(channel ? `${channel.display_name} — Periscope Creator` : 'Creator — Periscope');

  if (status === 'notfound') return <Navigate to="/creators" replace />;
  if (status === 'loading' || !channel) return <div className="min-h-screen bg-background"><Header /><div className="container py-16 text-center text-muted-foreground">Loading…</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="relative h-40 md:h-60 bg-gradient-to-br from-primary/20 via-secondary/20 to-background border-b" style={channel.banner_url ? { backgroundImage: `url(${channel.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
      <div className="container max-w-5xl -mt-12 md:-mt-16 relative z-10">
        <div className="flex items-end gap-4">
          {channel.avatar_url ? (
            <img src={channel.avatar_url} alt={channel.display_name} className="h-24 w-24 md:h-32 md:w-32 rounded-2xl border-4 border-background object-cover" />
          ) : (
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-2xl border-4 border-background bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-primary-foreground">
              {channel.display_name[0]}
            </div>
          )}
          <div className="pb-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{channel.display_name}</h1>
              {channel.verified && <Badge className="gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Verified</Badge>}
              {channel.featured && <Badge variant="secondary">Featured</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">@{channel.handle}</p>
          </div>
        </div>

        {channel.bio && <p className="mt-6 text-base text-foreground/90 whitespace-pre-line max-w-3xl">{channel.bio}</p>}

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {channel.youtube_url && <a href={channel.youtube_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"><Youtube className="h-4 w-4" /> YouTube</a>}
          {channel.instagram_url && <a href={channel.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"><Instagram className="h-4 w-4" /> Instagram</a>}
          {channel.tiktok_url && <a href={channel.tiktok_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary">TikTok</a>}
          {channel.website_url && <a href={channel.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"><Globe className="h-4 w-4" /> Website</a>}
        </div>

        <section className="mt-10 pb-16">
          <h2 className="text-xl font-semibold mb-4">Videos ({videos.length})</h2>
          {videos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No videos yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((v) => {
                const yt = (v.hashtags ?? []).find((t: string) => t?.startsWith?.('yt:'))?.slice(3);
                const thumb = yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : null;
                return (
                  <Link key={v.id} to={`/watch/${v.id}`} className="group block rounded-xl overflow-hidden border bg-card hover:shadow-lg transition">
                    <div className="aspect-video bg-muted relative">
                      {thumb ? <img src={thumb} alt={v.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><PlayCircle className="h-10 w-10 text-muted-foreground" /></div>}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm line-clamp-2 group-hover:text-primary">{v.title}</p>
                      {v.city && <p className="text-xs text-muted-foreground mt-1">{v.city}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}