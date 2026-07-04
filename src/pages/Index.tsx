import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Play, MapPin, PenLine, Building2, Sparkles, Heart, Flame, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getPropertyProvider } from "@/data/propertyProvider";
import { type FeedItem, type PropertyView } from "@/domain/property";
import { getStoredLocalCity, nearestSeededCity, SEEDED_CITIES, setStoredLocalCity, type LocalCity } from "@/lib/localDiscovery";

// Homepage vibe: Netflix meets Instagram. Cinematic edge-to-edge hero,
// IG-style circular city "stories", Netflix-style horizontal poster rails
// (including a numbered Top 10), and an Instagram explore-style photo mosaic.

const Index = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [localCity, setLocalCity] = useState<LocalCity | null>(() => getStoredLocalCity());
  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const { data: feed = [], isLoading: feedLoading } = useQuery({ queryKey: ["home-feed"], queryFn: () => getPropertyProvider().feed() });
  const { data: properties = [], isLoading: propsLoading } = useQuery({ queryKey: ["home-props"], queryFn: () => getPropertyProvider().listSummaries() });
  const loading = feedLoading || propsLoading;

  const hero = feed[0];
  const cityRows = useMemo(() => {
    const cities = [...new Set(feed.map((i) => i.location).filter(Boolean))].slice(0, 10);
    return cities.map((city) => ({ city, items: feed.filter((i) => i.location === city).slice(0, 12) }));
  }, [feed]);
  const localRow = localCity
    ? cityRows.find((row) => row.city.toLowerCase().includes(localCity.city.toLowerCase()))
    : null;
  const photoItems = feed.filter((i) => i.thumbnailUrl).slice(0, 18);
  const tourItems = feed.filter((i) => i.embedUrl || i.platform === 'matterport' || i.category === 'Property tours').slice(0, 18);
  const needTruth = properties.slice(0, 18);
  const trending = feed.filter((i) => i.thumbnailUrl).slice(0, 10);
  const mosaic = feed.filter((i) => i.thumbnailUrl).slice(0, 9);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {loading ? (
        <div className="flex justify-center py-40">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
        </div>
      ) : !hero && properties.length === 0 ? (
        <main className="container py-6"><ColdStart /></main>
      ) : (
        <>
          {hero && <CinematicHero item={hero} q={q} setQ={setQ} runSearch={runSearch} />}

          <StoriesRail localCity={localCity} onChange={setLocalCity} />

          <main className="container pt-6 pb-10 space-y-12 md:space-y-16">
            {trending.length > 0 && <TrendingRail items={trending} />}
            {localRow && <PosterRail title={`Near ${localCity?.label}`} subtitle="Official photos, tours, and verified resident posts near you." items={localRow.items} accent />}
            {tourItems.length > 0 && <PosterRail title="Official tours and walkthroughs" subtitle="Verified property tours from official channels" items={tourItems} />}
            {mosaic.length >= 6 && <PhotoMosaic items={mosaic} />}
            {cityRows.slice(0, 3).map((row) => (
              <PosterRail key={row.city} title={`Popular in ${row.city}`} items={row.items} />
            ))}
            {photoItems.length > 0 && <PosterRail title="Verified property photography" subtitle="Official and sourced imagery" items={photoItems} />}
            <PropertyRail title="Properties seeking resident input" properties={needTruth} />
            <InfiniteFeed items={feed} />
          </main>
        </>
      )}

      <div
        className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <Button variant="hero" className="pointer-events-auto shadow-elevated" asChild>
          <Link to="/contribute"><PenLine className="w-4 h-4" /> Share an experience</Link>
        </Button>
      </div>
    </div>
  );
};

const POPULAR_CITIES = [
  'Phoenix', 'Dallas', 'Atlanta', 'Los Angeles', 'Austin', 'Chicago', 'Denver', 'Seattle', 'Miami', 'Charlotte',
];

const ColdStart = () => (
  <div className="text-center py-12 max-w-2xl mx-auto">
    <h2 className="text-3xl font-bold mb-3">Help the next renter understand this place</h2>
    <p className="text-muted-foreground mb-8">
      Look up a place you know, add a quick note or short video, and make the next renter&apos;s decision a little easier.
    </p>
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {POPULAR_CITIES.map((c) => (
        <Button key={c} variant="outline" size="sm" asChild>
          <Link to={`/search?q=${encodeURIComponent(c)}`}>{c}</Link>
        </Button>
      ))}
    </div>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button variant="hero" size="lg" asChild><Link to="/contribute"><PenLine className="w-5 h-5 mr-2" /> Add a renter note</Link></Button>
      <Button variant="outline" size="lg" asChild><Link to="/welcome">How it works</Link></Button>
    </div>
  </div>
);

// Cinematic Netflix-style hero: edge-to-edge imagery, layered gradients, integrated search.
const CinematicHero = ({ item, q, setQ, runSearch }: { item: FeedItem; q: string; setQ: (v: string) => void; runSearch: (e: React.FormEvent) => void }) => (
  <section className="relative w-full overflow-hidden bg-black text-white h-[72vh] min-h-[520px] max-h-[820px]">
    {item.thumbnailUrl && (
      <img
        src={item.thumbnailUrl}
        alt={item.title}
        className="absolute inset-0 h-full w-full object-cover scale-105 animate-fade-in"
      />
    )}
    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.28),transparent_60%)]" />

    <div className="relative z-10 container h-full flex flex-col justify-end pb-10 md:pb-16">
      <div className="max-w-2xl space-y-4 md:space-y-5 animate-fade-in-up">
        <Badge className="bg-white/15 text-white border-white/25 backdrop-blur-md gap-1.5">
          <Sparkles className="w-3 h-3" /> Featured property
        </Badge>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.02] tracking-tight text-balance drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]">
          See the property<br className="hidden md:block" /> before you sign the lease.
        </h1>
        <p className="text-white/85 text-base md:text-lg line-clamp-2 max-w-xl">{item.title}</p>
        <p className="text-white/70 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4 shrink-0" /> {item.propertyName} · {item.location}
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button size="lg" className="bg-white text-black hover:bg-white/90 font-semibold shadow-elevated" asChild>
            <Link to={`/property/${item.propertyId}`}><Play className="w-5 h-5 fill-black" /> Watch tour</Link>
          </Button>
          <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-md" asChild>
            <Link to="/feed">Browse feed</Link>
          </Button>
        </div>

        <form onSubmit={runSearch} className="pt-4 max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 h-4 w-4" />
            <Input
              placeholder="Search any apartment, city, or address…"
              className="pl-11 pr-24 h-12 bg-black/40 border-white/20 text-white placeholder:text-white/50 backdrop-blur-md focus-visible:ring-primary/50"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button type="submit" size="sm" variant="hero" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9">
              Search
            </Button>
          </div>
        </form>
      </div>
    </div>
  </section>
);

// Instagram-style circular "story" avatars for cities.
const StoriesRail = ({ localCity, onChange }: { localCity: LocalCity | null; onChange: (city: LocalCity) => void }) => {
  const [locating, setLocating] = useState(false);
  const useLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const city = nearestSeededCity(pos.coords.latitude, pos.coords.longitude);
        setStoredLocalCity(city);
        onChange(city);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <div className="border-b border-border/40 bg-background/95">
      <div className="container py-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4">
          <button
            onClick={useLocation}
            disabled={locating}
            className="flex flex-col items-center gap-1.5 shrink-0 w-16 group"
          >
            <span className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary via-secondary to-primary-glow">
              <span className="flex items-center justify-center w-full h-full rounded-full bg-background">
                <MapPin className="w-6 h-6 text-primary" />
              </span>
            </span>
            <span className="text-[11px] text-foreground/80 truncate w-full text-center">{locating ? '…' : 'Near me'}</span>
          </button>

          {SEEDED_CITIES.slice(0, 14).map((city) => {
            const active = localCity?.label === city.label;
            return (
              <Link
                key={city.label}
                to={`/search?q=${encodeURIComponent(city.label)}`}
                onClick={() => { setStoredLocalCity(city); onChange(city); }}
                className="flex flex-col items-center gap-1.5 shrink-0 w-16 group"
              >
                <span className={
                  active
                    ? "relative w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-primary via-secondary to-primary-glow"
                    : "relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-muted-foreground/30 to-border group-hover:from-primary/60 group-hover:to-secondary/60 transition-all"
                }>
                  <span className="flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-primary/15 to-secondary/15 text-primary font-bold text-lg">
                    {city.city[0]}
                  </span>
                </span>
                <span className={`text-[11px] truncate w-full text-center ${active ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover:text-foreground'}`}>{city.city}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Netflix "Top 10" — numbered oversized posters with a giant outlined numeral.
const TrendingRail = ({ items }: { items: FeedItem[] }) => (
  <section>
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
          <Flame className="w-6 h-6 text-primary" /> Trending now
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Most-watched listings this week</p>
      </div>
      <Link to="/feed" className="text-sm font-medium text-primary hover:underline flex items-center gap-0.5 shrink-0">See all <ChevronRight className="w-4 h-4" /></Link>
    </div>
    <div className="flex gap-2 md:gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
      {items.map((item, i) => (
        <Link key={item.id} to={`/property/${item.propertyId}`} className="group shrink-0 flex items-end">
          <span
            aria-hidden
            className="text-[6.5rem] md:text-[10rem] leading-[0.8] font-black text-transparent select-none -mr-4 md:-mr-6"
            style={{ WebkitTextStroke: '2px hsl(var(--primary))' }}
          >
            {i + 1}
          </span>
          <div className="relative w-32 md:w-44 aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-card group-hover:shadow-card-hover group-hover:-translate-y-1 transition-all duration-300">
            {item.thumbnailUrl && (
              <img src={item.thumbnailUrl} alt={item.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-2.5">
              <p className="text-white font-semibold text-xs md:text-sm line-clamp-1">{item.propertyName}</p>
              <p className="text-white/70 text-[10px] md:text-xs truncate">{item.location}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </section>
);

// Netflix-style horizontal rail of portrait posters.
const PosterRail = ({ title, subtitle, items, accent }: { title: string; subtitle?: string; items: FeedItem[]; accent?: boolean }) => {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mb-3 md:mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${accent ? 'flex items-center gap-2' : ''}`}>
            {accent && <span className="inline-block w-1 h-6 rounded-full bg-gradient-to-b from-primary to-secondary" />}
            {title}
          </h2>
          {subtitle && <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4">
        {items.map((item) => <PosterCard key={item.id} item={item} />)}
      </div>
    </section>
  );
};

const PosterCard = ({ item }: { item: FeedItem }) => (
  <Link to={`/property/${item.propertyId}`} className="group shrink-0 w-40 md:w-56">
    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
      {item.thumbnailUrl ? (
        <img src={item.thumbnailUrl} alt={item.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20"><Building2 className="w-10 h-10 text-muted-foreground" /></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      {item.category && (
        <Badge className="absolute top-2 left-2 bg-black/60 text-white border-0 text-[10px] backdrop-blur-md">{item.category}</Badge>
      )}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-elevated">
          <Play className="w-5 h-5 text-black fill-black ml-0.5" />
        </span>
      </div>
      <div className="absolute bottom-0 inset-x-0 p-3">
        <p className="text-white font-semibold text-sm line-clamp-1 leading-snug">{item.propertyName}</p>
        <p className="text-white/75 text-xs truncate mt-0.5">{item.location}</p>
      </div>
    </div>
  </Link>
);

// Instagram explore-page mosaic — one large tile + a grid of squares.
const PhotoMosaic = ({ items }: { items: FeedItem[] }) => {
  const featured = items[0];
  const rest = items.slice(1, 9);
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" /> Latest across the network
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Recent photos, tours, and resident posts</p>
        </div>
        <Link to="/feed" className="text-sm font-medium text-primary hover:underline flex items-center gap-0.5 shrink-0">See all <ChevronRight className="w-4 h-4" /></Link>
      </div>
      <div className="grid grid-cols-3 gap-1 md:gap-1.5 rounded-2xl overflow-hidden">
        {featured && (
          <Link to={`/property/${featured.propertyId}`} className="relative col-span-2 row-span-2 aspect-square bg-muted overflow-hidden group">
            {featured.thumbnailUrl && <img src={featured.thumbnailUrl} alt={featured.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-4 text-white">
              <p className="font-bold text-lg line-clamp-1">{featured.propertyName}</p>
              <p className="text-white/75 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {featured.location}</p>
            </div>
          </Link>
        )}
        {rest.map((item) => (
          <Link key={item.id} to={`/property/${item.propertyId}`} className="relative aspect-square bg-muted overflow-hidden group">
            {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </section>
  );
};

const PropertyRail = ({ title, properties }: { title: string; properties: PropertyView[] }) => {
  if (properties.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-3 md:mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4">
        {properties.map((p) => {
          const count = p.officialChannels?.filter((c) => ['gallery', 'matterport', 'instagram', 'tiktok', 'youtube'].includes(c.kind)).length ?? 0;
          const img = p.officialChannels?.find((c) => c.kind === 'gallery' && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(c.url))?.url;
          return (
            <Link key={p.id} to={`/property/${p.id}`} className="group shrink-0 w-56">
              <Card className="overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 border-border/50">
                <div className="aspect-video bg-muted relative">
                  {img && <img src={img} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" loading="lazy" />}
                  {count > 0 && <Badge className="absolute right-2 top-2 bg-background/90 text-foreground backdrop-blur-sm border border-border/40">{count} sources</Badge>}
                </div>
                <CardContent className="p-3">
                  <p className="font-semibold truncate text-sm group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{[p.city, p.state].filter(Boolean).join(', ')}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default Index;
