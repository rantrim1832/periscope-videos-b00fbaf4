import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ShieldCheck, Building2, Share2, PenLine, Play } from 'lucide-react';
import { getPropertyProvider } from '@/data/propertyProvider';
import { getVideoProvider } from '@/services/providers/video';
import { VideoPlayer } from '@/components/property/VideoPlayer';
import { FEED_CATEGORIES, type FeedItem } from '@/domain/property';
import { useToast } from '@/hooks/use-toast';
import { getStoredLocalCity } from '@/lib/localDiscovery';

const Feed = () => {
  const [category, setCategory] = useState<string>('All');
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: () => getPropertyProvider().feed(),
  });
  const cities = [...new Set(items.map((i) => i.location).filter(Boolean))].slice(0, 12);
  const stored = getStoredLocalCity();
  const preferredLocation = stored ? `${stored.city}, ${stored.state}` : 'All';
  const [city, setCity] = useState<string>(preferredLocation);

  const effectiveCity = city === 'All' || cities.includes(city) ? city : 'All';
  const filtered = items.filter((i) =>
    (category === 'All' || i.category === category) &&
    (effectiveCity === 'All' || i.location === effectiveCity),
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Category rail */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="container mx-auto px-4 py-3 space-y-3">
          <div className="flex gap-2 overflow-x-auto">
            {FEED_CATEGORIES.map((c) => (
              <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} className="whitespace-nowrap" onClick={() => setCategory(c)}>
                {c}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {['All', ...cities].map((c) => (
              <Button key={c} size="sm" variant={effectiveCity === c ? 'default' : 'outline'} className="whitespace-nowrap" onClick={() => setCity(c)}>
                {c === 'All' ? 'All cities' : c}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Want to find your current or past building?</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild><Link to="/search">Search property</Link></Button>
              <Button size="sm" variant="ghost" asChild><Link to="/contribute">Post your story</Link></Button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-20">Loading feed…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">No {category === 'All' ? '' : `“${category}” `}content yet.</p>
          <Button variant="hero" asChild><Link to="/contribute">Be the first to post</Link></Button>
        </div>
      ) : (
        <div className="h-[calc(100vh-12rem)] overflow-y-auto snap-y snap-mandatory">
          {filtered.map((item) => <FeedCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
};

const FeedCard = ({ item }: { item: FeedItem }) => {
  const { toast } = useToast();
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const play = async () => {
    if (item.embedUrl) { setPlaying(true); return; }
    if (item.thumbnailUrl && !item.playbackUrl) return;
    const p = await getVideoProvider().getPlayback(item.playbackUrl ?? item.id);
    setSrc(p.hlsUrl);
    setPlaying(true);
  };

  const share = async () => {
    const url = `${window.location.origin}/property/${item.propertyId}`;
    try {
      if (navigator.share) await navigator.share({ title: item.propertyName, text: item.title, url });
      else { await navigator.clipboard.writeText(url); toast({ title: 'Link copied' }); }
    } catch { /* cancelled */ }
  };

  return (
    <section className="snap-start h-[calc(100vh-12rem)] flex items-center justify-center bg-black relative">
      <div className="relative w-full max-w-sm h-full mx-auto">
        {/* Media */}
        <div className="absolute inset-0 flex items-center justify-center">
          {playing ? (
            item.embedUrl ? (
              <iframe src={item.embedUrl} title={item.title} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            ) : src ? (
              <VideoPlayer src={src} className="w-full h-full object-contain bg-black" />
            ) : null
          ) : (
            <button onClick={play} className="w-full h-full bg-gradient-to-br from-primary/25 to-secondary/25 flex flex-col items-center justify-center gap-3">
              {item.thumbnailUrl && (
                <img src={item.thumbnailUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-80" loading="lazy" />
              )}
              <div className="absolute inset-0 bg-black/25" />
              {!(item.thumbnailUrl && !item.embedUrl) && (
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center z-10"><Play className="w-7 h-7 text-black ml-1" /></div>
              )}
              <span className="text-white/80 text-sm z-10">{item.thumbnailUrl && !item.embedUrl ? 'Official photo' : 'Tap to play'}</span>
            </button>
          )}
        </div>

        {/* Overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          {item.source === 'official'
            ? <Badge variant="secondary" className="gap-1"><Building2 className="w-3 h-3" /> Official</Badge>
            : <Badge variant="success" className="gap-1"><ShieldCheck className="w-3 h-3" /> {item.verified ? 'Verified resident' : 'Resident'}</Badge>}
          {item.category && <Badge variant="outline" className="bg-black/40 text-white border-white/30">{item.category}</Badge>}
        </div>

        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4 space-y-2">
          <p className="text-white font-semibold">{item.title}</p>
          <Link to={`/property/${item.propertyId}`} className="flex items-center gap-1 text-white/80 text-sm hover:text-white">
            <MapPin className="w-4 h-4" /> {item.propertyName} · {item.location}
          </Link>
          {item.creatorId && item.creatorName && (
            <Link to={`/creator/${item.creatorId}`} className="text-white/70 text-xs hover:text-white">
              by {item.creatorName}
            </Link>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={share}><Share2 className="w-4 h-4 mr-1" /> Share</Button>
            <Button size="sm" variant="hero" asChild><Link to={`/contribute/${item.propertyId}`}><PenLine className="w-4 h-4 mr-1" /> Add your truth</Link></Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feed;
