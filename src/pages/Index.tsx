import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Play, MapPin, PenLine, Building2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getPropertyProvider } from "@/data/propertyProvider";
import { FEED_CATEGORIES, type FeedItem, type PropertyView } from "@/domain/property";
import { getStoredLocalCity, nearestSeededCity, SEEDED_CITIES, setStoredLocalCity, type LocalCity } from "@/lib/localDiscovery";

// The homepage answers one question in <10s: "What's the most interesting thing
// happening in apartment living right now?" Content-hook-first (TikTok + Zillow +
// Consumer Reports + Reddit). Discover by using, not by reading.

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
  const tourItems = feed.filter((i) => i.embedUrl || i.platform === 'matterport' || i.category === 'Luxury tours').slice(0, 18);
  const needTruth = properties.slice(0, 18);

  return (
    <div className="min-h-screen bg-background pb-16">
      <Header />

      {/* Slim utility bar — search only, no explanation */}
      <div className="border-b border-border/40 bg-background/95">
        <div className="container py-3">
          <form onSubmit={runSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search any apartment, city, or address…" className="pl-9 h-11" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Button type="submit" variant="hero">Search</Button>
          </form>
        </div>
      </div>

      <main className="container py-6 space-y-10 md:space-y-14">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          </div>
        ) : !hero && properties.length === 0 ? (
          <ColdStart />
        ) : (
          <>
            {hero && <HeroFeature item={hero} />}
            <LocalCityRail localCity={localCity} onChange={setLocalCity} />
            {localRow && <ContentRail title={`Near ${localCity?.label}`} subtitle="Start with local official photos, tours, and social posts." items={localRow.items} />}
            <CityRail onSelect={setLocalCity} />
            <ContentRail title="Official tours & walkthroughs" subtitle="Real property tours and sourced visual context" items={tourItems} />
            <ContentRail title="Photos that make pages feel real" subtitle="Seeded official/public imagery from property sources" items={photoItems} />
            {cityRows.slice(0, 4).map((row) => (
              <ContentRail key={row.city} title={`Popular in ${row.city}`} items={row.items} />
            ))}
            <PropertyRail title="Help complete these pages" properties={needTruth} />
          </>
        )}
      </main>

      {/* One small nudge — safe-area aware on mobile */}
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

// Shown when there's no content yet (nationwide launch reality). Curiosity- and
// action-forward — never a blank page.
const ColdStart = () => (
  <div className="text-center py-12 max-w-2xl mx-auto">
    <h2 className="text-3xl font-bold mb-3">Help the next renter understand this place</h2>
    <p className="text-muted-foreground mb-8">
      Look up a place you know, add a quick note or short video, and make the next renter’s decision a little easier.
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

const HeroFeature = ({ item }: { item: FeedItem }) => (
  <section className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border/40 bg-card min-h-[380px] md:min-h-[460px] shadow-elevated animate-fade-in-up">
    {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.title} className="absolute inset-0 h-full w-full object-cover scale-105" />}
    <div className="absolute inset-0 bg-gradient-to-tr from-black/95 via-black/70 to-black/20" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent md:hidden" />
    <div className="relative z-10 max-w-2xl p-6 md:p-12 text-white space-y-4 md:space-y-5">
      <Badge className="bg-white/15 text-white border-white/25 backdrop-blur-sm"><Sparkles className="w-3 h-3 mr-1" /> Featured</Badge>
      <h1 className="text-3xl md:text-6xl font-black leading-[1.05] text-balance">Get a clearer look before you tour or apply.</h1>
      <p className="text-white/85 text-base md:text-lg line-clamp-3 text-pretty">{item.title}</p>
      <p className="text-white/70 text-sm flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" /> {item.propertyName} · {item.location}</p>
      <div className="flex flex-wrap gap-3 pt-1">
        <Button variant="secondary" size="lg" asChild><Link to={`/property/${item.propertyId}`}><Play className="w-5 h-5" /> View property</Link></Button>
        <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white" asChild><Link to="/feed">Browse feed</Link></Button>
      </div>
    </div>
  </section>
);

const LocalCityRail = ({ localCity, onChange }: { localCity: LocalCity | null; onChange: (city: LocalCity) => void }) => {
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
    <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/40 to-muted/10 p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{localCity ? `Your market · ${localCity.label}` : 'Make it local'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Pick a city or use location so we start with places near you.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="hero" size="sm" onClick={useLocation} disabled={locating}>
            <MapPin className="w-4 h-4" /> {locating ? 'Finding…' : 'Use my location'}
          </Button>
          {SEEDED_CITIES.slice(0, 8).map((city) => (
            <Button key={city.label} variant={localCity?.label === city.label ? 'default' : 'outline'} size="sm" onClick={() => { setStoredLocalCity(city); onChange(city); }}>
              {city.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};

const CityRail = ({ onSelect }: { onSelect: (city: LocalCity) => void }) => (
  <section>
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Start with a city</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Jump into markets with official photos, tours, and social posts.</p>
      </div>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
      {POPULAR_CITIES.map((city) => (
        <Button key={city} variant="outline" className="h-20 min-w-36 flex-col gap-1 shrink-0 hover:border-primary/60 hover:bg-primary/5" asChild>
          <Link
            to={`/search?q=${encodeURIComponent(city)}`}
            onClick={() => {
              const found = SEEDED_CITIES.find((c) => c.label === city);
              if (found) { setStoredLocalCity(found); onSelect(found); }
            }}
          >
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">{city}</span>
          </Link>
        </Button>
      ))}
    </div>
  </section>
);

const ContentRail = ({ title, subtitle, items }: { title: string; subtitle?: string; items: FeedItem[] }) => {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4">
        {items.map((item) => <PosterCard key={item.id} item={item} />)}
      </div>
    </section>
  );
};

const PosterCard = ({ item }: { item: FeedItem }) => (
  <Link to={`/property/${item.propertyId}`} className="group shrink-0 w-44 md:w-56">
    <Card className="overflow-hidden bg-card shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 border-border/50">
      <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><Building2 className="w-10 h-10 text-muted-foreground" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
        {item.category && <Badge className="absolute top-2 left-2 bg-black/60 text-white border-0 text-[10px] backdrop-blur-sm">{item.category}</Badge>}
        <div className="absolute bottom-0 inset-x-0 p-3">
          <p className="text-white font-semibold text-sm line-clamp-2 leading-snug">{item.propertyName}</p>
          <p className="text-white/75 text-xs truncate mt-0.5">{item.location}</p>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="text-xs line-clamp-2 text-muted-foreground leading-relaxed">{item.title}</p>
      </CardContent>
    </Card>
  </Link>
);

const PropertyRail = ({ title, properties }: { title: string; properties: PropertyView[] }) => {
  if (properties.length === 0) return null;
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">{title}</h2>
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
