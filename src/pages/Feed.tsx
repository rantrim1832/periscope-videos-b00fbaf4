import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ShieldCheck, Building2, Share2, PenLine, Play, SlidersHorizontal, X } from 'lucide-react';
import { getPropertyProvider } from '@/data/propertyProvider';
import { getVideoProvider } from '@/services/providers/video';
import { VideoPlayer } from '@/components/property/VideoPlayer';
import { FEED_CATEGORIES, type FeedItem } from '@/domain/property';
import { useToast } from '@/hooks/use-toast';
import { getStoredLocalCity, sortByLocalState, stateFromLocation } from '@/lib/localDiscovery';

const Feed = () => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: () => getPropertyProvider().feed(),
  });
  const stored = getStoredLocalCity();
  const localState = stored?.state ?? null;
  const preferredLocation = stored ? `${stored.city}, ${stored.state}` : 'All';
  const [category, setCategory] = useState<string>('All');
  const [city, setCity] = useState<string>(preferredLocation);
  // State chip narrows the feed to the viewer's home state by default, so a
  // Southern California renter doesn't get a wall of Texas content.
  const [stateFilter, setStateFilter] = useState<string>(localState ?? 'All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const statesList = [...new Set(items.map((i) => stateFromLocation(i.location)).filter(Boolean))] as string[];
  // If the viewer's home state has no content yet, don't strand them on an
  // empty feed — quietly widen to all states so they see something to watch.
  const effectiveState = stateFilter === 'All' || statesList.includes(stateFilter) ? stateFilter : 'All';
  const citiesForState = [...new Set(
    items
      .filter((i) => effectiveState === 'All' || stateFromLocation(i.location) === effectiveState)
      .map((i) => i.location)
      .filter(Boolean),
  )].slice(0, 24);
  const effectiveCity = city === 'All' || citiesForState.includes(city) ? city : 'All';
  const filteredRaw = items.filter((i) =>
    (category === 'All' || i.category === category) &&
    (effectiveState === 'All' || stateFromLocation(i.location) === effectiveState) &&
    (effectiveCity === 'All' || i.location === effectiveCity),
  );
  // When "All states" is picked but the viewer has a home state, still float
  // local content to the top instead of shuffling in far-away metros first.
  const filtered = effectiveState === 'All'
    ? sortByLocalState(filteredRaw, (i) => i.location, localState)
    : filteredRaw;
  const activeCount = (category !== 'All' ? 1 : 0) + (effectiveCity !== 'All' ? 1 : 0) + (effectiveState !== 'All' && effectiveState !== (localState ?? 'All') ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Compact single-line filter bar. Expands on demand so it never eats the video. */}
      <div className="sticky top-14 md:top-16 z-30 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="container px-4 py-2 flex items-center gap-2">
          <Button
            size="sm"
            variant={filtersOpen || activeCount > 0 ? 'default' : 'outline'}
            className="shrink-0"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
          </Button>
          <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar text-xs text-muted-foreground items-center min-w-0">
            <span className="truncate">
              {category === 'All' ? 'All stories' : category}
              {stateFilter !== 'All' ? ` · ${stateFilter}` : ''}
              {effectiveCity !== 'All' ? ` · ${effectiveCity}` : ''}
            </span>
          </div>
          {activeCount > 0 && (
            <Button size="sm" variant="ghost" className="shrink-0 h-8 px-2" onClick={() => { setCategory('All'); setCity('All'); setStateFilter(localState ?? 'All'); }}>
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}
        </div>
        {filtersOpen && (
          <div className="container px-4 pb-3 space-y-2 border-t border-border/40 pt-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Category</p>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {FEED_CATEGORIES.map((c) => (
                  <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} className="whitespace-nowrap h-8" onClick={() => setCategory(c)}>
                    {c}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">State</p>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {['All', ...statesList].map((s) => (
                  <Button key={s} size="sm" variant={stateFilter === s ? 'default' : 'outline'} className="whitespace-nowrap h-8" onClick={() => { setStateFilter(s); setCity('All'); }}>
                    {s === 'All' ? 'All states' : s}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">City</p>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {['All', ...citiesForState].map((c) => (
                  <Button key={c} size="sm" variant={effectiveCity === c ? 'default' : 'outline'} className="whitespace-nowrap h-8" onClick={() => setCity(c)}>
                    {c === 'All' ? 'All cities' : c}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-20">Loading feed…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">No {category === 'All' ? '' : `“${category}” `}content yet.</p>
          <Button variant="hero" asChild><Link to="/contribute">Add a review</Link></Button>
        </div>
      ) : (
        <div className="h-[calc(100dvh-8rem)] md:h-[calc(100dvh-9rem)] overflow-y-auto snap-y snap-mandatory">
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
    <section className="snap-start h-[calc(100dvh-8rem)] md:h-[calc(100dvh-9rem)] flex items-center justify-center bg-black relative">
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
            <Button size="sm" variant="hero" asChild><Link to={`/contribute/${item.propertyId}`}><PenLine className="w-4 h-4 mr-1" /> Add a review</Link></Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feed;
