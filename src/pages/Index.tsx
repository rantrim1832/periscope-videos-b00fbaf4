import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Play, MapPin, PenLine, Building2, Heart, Flame, ChevronRight, Shield, Building, UserCheck, Sparkles, DollarSign, Wrench, Home as HomeIcon, MessageSquareWarning, Trees, ClipboardCheck, Video, Volume2, Shield as ShieldIcon, Bug, Thermometer, Wifi, Car, PawPrint, Package, WashingMachine, Truck, KeyRound, TrendingDown, AlertTriangle, Coffee, Users, Briefcase, Accessibility, Star, Sofa, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getPropertyProvider } from "@/data/propertyProvider";
import { type FeedItem, type PropertyView } from "@/domain/property";
import { getStoredLocalCity, nearestSeededCity, SEEDED_CITIES, setStoredLocalCity, sortByLocalState, stateFromLocation, type LocalCity } from "@/lib/localDiscovery";
import { PromptTileRail, type PromptTile } from "@/components/PromptTileRail";
import { TrendingRail as ViralTrendingRail } from "@/components/home/TrendingRail";
import { NearYouRail } from "@/components/home/NearYouRail";
import { FeaturedCreatorsRail } from "@/components/home/FeaturedCreatorsRail";

// Renter contribution tiles surfaced on the home page so every viewer sees
// the full library of video angles they can record — not just the ones on
// the empty-state Feed.
const HOME_RENTER_TILES: PromptTile[] = [
  { key: 'record-review', title: 'Record a video review', hint: 'A 60-sec walkthrough — good or bad, the honest version.', icon: Sparkles,
    cover: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop', to: '/contribute?topic=record-review', featured: true, badge: 'Start here' },
  { key: 'loved-it', title: 'What you love', hint: 'The team, layout, neighbors, price.', icon: Sparkles,
    cover: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop', to: '/contribute?topic=loved-it' },
  { key: 'pricing', title: 'Pricing surprises', hint: 'Rent hikes, fees, deposits, utilities.', icon: DollarSign,
    cover: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop', to: '/contribute?topic=pricing' },
  { key: 'management', title: 'Management issues', hint: 'Responsiveness and follow-through.', icon: MessageSquareWarning,
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop', to: '/contribute?topic=management' },
  { key: 'maintenance', title: 'Maintenance', hint: 'Speed and quality of repairs.', icon: Wrench,
    cover: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&auto=format&fit=crop', to: '/contribute?topic=maintenance' },
  { key: 'property-condition', title: 'Property condition', hint: 'Halls, elevators, parking, cleanliness.', icon: HomeIcon,
    cover: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop', to: '/contribute?topic=property-condition' },
  { key: 'local-vibe', title: 'Local vibe', hint: 'Transit, groceries, safety, weekends.', icon: Trees,
    cover: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop', to: '/contribute?topic=local-vibe' },
  { key: 'application', title: 'Application process', hint: 'Screening, fees, approval timing.', icon: ClipboardCheck,
    cover: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop', to: '/contribute?topic=application' },
  { key: 'full-tour', title: 'Full property tour', hint: 'Unit + amenities + halls + street.', icon: Video,
    cover: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop', to: '/contribute?topic=full-tour' },
];

const HOME_RENTER_MORE_TILES: PromptTile[] = [
  { key: 'unit-tour', title: 'Inside your unit', hint: 'Kitchen, bath, closets, windows.', icon: Sofa,
    cover: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop', to: '/contribute?topic=unit-tour' },
  { key: 'amenities-real', title: 'Amenities in real life', hint: 'The gym at 6pm, not the brochure.', icon: Star,
    cover: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&auto=format&fit=crop', to: '/contribute?topic=amenities-real' },
  { key: 'noise', title: 'Noise & neighbors', hint: 'What you actually hear through the walls.', icon: Volume2,
    cover: 'https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?w=800&auto=format&fit=crop', to: '/contribute?topic=noise' },
  { key: 'safety', title: 'Safety & security', hint: 'Walking home, lobby, package theft.', icon: ShieldIcon,
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&auto=format&fit=crop', to: '/contribute?topic=safety' },
  { key: 'pests', title: 'Pests & bugs', hint: 'Roaches, mice, bedbugs — and response.', icon: Bug,
    cover: 'https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=800&auto=format&fit=crop', to: '/contribute?topic=pests' },
  { key: 'hvac', title: 'Heat, AC & utilities', hint: 'Did heat actually work last winter?', icon: Thermometer,
    cover: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&auto=format&fit=crop', to: '/contribute?topic=hvac' },
  { key: 'wifi-signal', title: 'Wifi & cell signal', hint: 'Which provider actually works.', icon: Wifi,
    cover: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop', to: '/contribute?topic=wifi-signal' },
  { key: 'parking', title: 'Parking & garage', hint: 'Cost, guest rules, EV charging.', icon: Car,
    cover: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop', to: '/contribute?topic=parking' },
  { key: 'pets', title: 'Pet-friendly reality', hint: 'Fees, breed rules, dog run.', icon: PawPrint,
    cover: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&auto=format&fit=crop', to: '/contribute?topic=pets' },
  { key: 'packages', title: 'Packages & mail', hint: 'Lockers, theft, delivery access.', icon: Package,
    cover: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop', to: '/contribute?topic=packages' },
  { key: 'laundry', title: 'Laundry situation', hint: 'In-unit vs shared — cost, reliability.', icon: WashingMachine,
    cover: 'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?w=800&auto=format&fit=crop', to: '/contribute?topic=laundry' },
  { key: 'move-in-day', title: 'Move-in day', hint: 'Keys, elevators, loading dock.', icon: Truck,
    cover: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop', to: '/contribute?topic=move-in-day' },
  { key: 'move-out', title: 'Move-out story', hint: 'Notice, cleaning, damage claims.', icon: KeyRound,
    cover: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop', to: '/contribute?topic=move-out' },
  { key: 'deposit-return', title: 'Deposit return', hint: 'What they charged and what you got back.', icon: DollarSign,
    cover: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop', to: '/contribute?topic=deposit-return' },
  { key: 'renewal-negotiation', title: 'Renewal & negotiation', hint: 'How you negotiated your renewal.', icon: TrendingDown,
    cover: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop', to: '/contribute?topic=renewal-negotiation' },
  { key: 'red-flags', title: 'Red flags on tour', hint: 'What to look for before signing.', icon: AlertTriangle,
    cover: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop', to: '/contribute?topic=red-flags' },
  { key: 'day-in-life', title: 'Day in the life', hint: 'A real weekday morning.', icon: Coffee,
    cover: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop', to: '/contribute?topic=day-in-life' },
  { key: 'commute', title: 'Commute & transit', hint: 'Door to desk — how long really.', icon: Truck,
    cover: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop', to: '/contribute?topic=commute' },
  { key: 'families-schools', title: 'Families & schools', hint: 'Living here with kids.', icon: Users,
    cover: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&auto=format&fit=crop', to: '/contribute?topic=families-schools' },
  { key: 'wfh-setup', title: 'Work-from-home', hint: 'Coworking, wifi, quiet.', icon: Briefcase,
    cover: 'https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?w=800&auto=format&fit=crop', to: '/contribute?topic=wfh-setup' },
  { key: 'accessibility', title: 'Accessibility', hint: 'Elevators, ramps, ADA units.', icon: Accessibility,
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&auto=format&fit=crop', to: '/contribute?topic=accessibility' },
  { key: 'staff-shoutout', title: 'Staff shoutout', hint: 'Recognize a team member.', icon: MessageCircle,
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop', to: '/contribute?topic=staff-shoutout' },
];

// Homepage vibe: Netflix meets Instagram. Cinematic edge-to-edge hero,
// IG-style circular city "stories", Netflix-style horizontal poster rails
// (including a numbered Top 10), and an Instagram explore-style photo mosaic.

const Index = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [localCity, setLocalCity] = useState<LocalCity | null>(() => getStoredLocalCity());
  const { user, isManager } = useViewer();
  const { isAdmin } = useAdmin();
  // Signed-in renters land on the Feed — that's the primary experience for
  // them. Managers and admins keep the Index dashboard.
  useEffect(() => {
    if (user && !isAdmin && !isManager) {
      navigate('/feed', { replace: true });
    }
  }, [user, isAdmin, isManager, navigate]);
  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const { data: feed = [], isLoading: feedLoading } = useQuery({ queryKey: ["home-feed"], queryFn: () => getPropertyProvider().feed() });
  const { data: properties = [], isLoading: propsLoading } = useQuery({ queryKey: ["home-props"], queryFn: () => getPropertyProvider().listSummaries() });
  const loading = feedLoading || propsLoading;

  const localState = localCity?.state ?? null;
  const localFeed = useMemo(() => sortByLocalState(feed, (i) => i.location, localState), [feed, localState]);
  const localProperties = useMemo(() => sortByLocalState(properties, (p) => [p.city, p.state].filter(Boolean).join(', '), localState), [properties, localState]);

  const cityRows = useMemo(() => {
    // Prefer cities in the viewer's state so rails don't lead with far-away metros.
    const allCities = [...new Set(feed.map((i) => i.location).filter(Boolean))];
    const ordered = localState
      ? [
          ...allCities.filter((c) => stateFromLocation(c) === localState),
          ...allCities.filter((c) => stateFromLocation(c) !== localState),
        ]
      : allCities;
    return ordered.slice(0, 10).map((city) => ({ city, items: feed.filter((i) => i.location === city).slice(0, 12) }));
  }, [feed, localState]);
  const localRow = localCity
    ? cityRows.find((row) => row.city.toLowerCase().includes(localCity.city.toLowerCase()))
    : null;
  const photoItems = localFeed.filter((i) => i.thumbnailUrl).slice(0, 18);
  const tourItems = localFeed.filter((i) => i.embedUrl || i.platform === 'matterport' || i.category === 'Property tours').slice(0, 18);
  const needTruth = localProperties.slice(0, 18);
  const trending = localFeed.filter((i) => i.thumbnailUrl).slice(0, 10);
  const mosaic = localFeed.filter((i) => i.thumbnailUrl).slice(0, 9);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {loading ? (
        <div className="flex justify-center py-40">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
        </div>
      ) : feed.length === 0 && properties.length === 0 ? (
        <main className="container py-6"><ColdStart /></main>
      ) : (
        <>
          <PersonalizedTopBar
            user={user}
            isAdmin={isAdmin}
            isManager={isManager}
            localCity={localCity}
            q={q}
            setQ={setQ}
            runSearch={runSearch}
          />
          <StoriesRail localCity={localCity} onChange={setLocalCity} />

          <main className="container pt-6 pb-10 space-y-12 md:space-y-16">
            <NearYouRail linkMode="watch" />
            <ViralTrendingRail linkMode="watch" title="Trending now" eyebrow="🔥 Viral apartment videos" />
            <FeaturedCreatorsRail />
            <PromptTileRail
              eyebrow="Post your own"
              title={localCity ? `What renters in ${localCity.city} are sharing` : 'What renters are sharing'}
              subtitle="Pick any angle you can tell in under a minute — it helps the next renter."
              tiles={HOME_RENTER_TILES}
              seeAllHref="/contribute"
              seeAllLabel="See all"
            />
            <PromptTileRail
              eyebrow="More angles"
              title="Every detail renters wish they'd checked"
              subtitle="Noise, pests, parking, pets, packages, laundry, deposits — the stuff tours skip."
              tiles={HOME_RENTER_MORE_TILES}
            />
            {trending.length > 0 && <TrendingRail items={trending} />}
            {localRow && <PosterRail title={`Near ${localCity?.label}`} subtitle="Official photos, tours, and resident posts near you." items={localRow.items} accent />}
            {tourItems.length > 0 && <PosterRail title="Official tours and walkthroughs" subtitle="Verified property tours from official channels" items={tourItems} />}
            {mosaic.length >= 6 && <PhotoMosaic items={mosaic} />}
            {cityRows.slice(0, 3).map((row) => (
              <PosterRail key={row.city} title={`Popular in ${row.city}`} items={row.items} />
            ))}
            {photoItems.length > 0 && <PosterRail title="Verified property photography" subtitle="Official and sourced imagery" items={photoItems} />}
            <PropertyRail title="Properties without reviews" properties={needTruth} />
            <InfiniteFeed items={feed} />
          </main>
        </>
      )}

      <div
        className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <Button variant="hero" className="pointer-events-auto shadow-elevated" asChild>
          <Link to="/contribute"><PenLine className="w-4 h-4" /> Review your apartment</Link>
        </Button>
      </div>
    </div>
  );
};

// Lightweight viewer detection: signed in? has any managed property?
const useViewer = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isManager, setIsManager] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!active) return;
      setUser(user);
      if (!user) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('property_manager').select('id').eq('user_id', user.id).limit(1).maybeSingle();
      if (active) setIsManager(!!data);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  return { user, isManager };
};

// Compact personalized top bar — replaces the oversized cinematic hero.
// Greeting, primary CTA, and inline search adapt to the viewer's role.
const PersonalizedTopBar = ({
  user, isAdmin, isManager, localCity, q, setQ, runSearch,
}: {
  user: SupabaseUser | null;
  isAdmin: boolean;
  isManager: boolean;
  localCity: LocalCity | null;
  q: string;
  setQ: (v: string) => void;
  runSearch: (e: React.FormEvent) => void;
}) => {
  const firstName = (user?.user_metadata?.full_name || user?.email || '').toString().split(/[\s@]/)[0];
  const locale = localCity?.city;

  let icon = <Play className="w-4 h-4" />;
  let eyebrow = 'Apartment reviews';
  let headline = locale
    ? `Where Apartment Reviews Come to Life in ${locale}.`
    : 'Where Apartment Reviews Come to Life.';
  let sub = 'Read honest resident reviews and watch video tours of large apartment buildings. Then review your own.';
  let cta: { to: string; label: string; icon: React.ReactNode } = {
    to: '/contribute', label: 'Review your apartment', icon: <PenLine className="w-4 h-4" />,
  };

  if (isAdmin) {
    icon = <Shield className="w-4 h-4" />;
    eyebrow = 'Admin';
    headline = firstName ? `Welcome back, ${firstName}.` : 'Welcome back.';
    sub = 'Jump into moderation, claims, and property operations.';
    cta = { to: '/admin/settings', label: 'Open admin', icon: <Shield className="w-4 h-4" /> };
  } else if (isManager) {
    icon = <Building className="w-4 h-4" />;
    eyebrow = 'Property manager';
    headline = firstName ? `Welcome back, ${firstName}.` : 'Get discovered on Periscope.';
    sub = 'Update your page, add official videos and content, and get alerts the moment a new review is posted.';
    cta = { to: '/manager', label: 'Manager tools', icon: <Building className="w-4 h-4" /> };
  } else if (user) {
    icon = <UserCheck className="w-4 h-4" />;
    eyebrow = firstName ? `Welcome back, ${firstName}` : 'Welcome back';
    headline = locale
      ? `New reviews near ${locale}.`
      : 'New apartment reviews across the network.';
    sub = 'Keep watching, or review the apartment you live in.';
    cta = { to: '/contribute', label: 'Review your apartment', icon: <PenLine className="w-4 h-4" /> };
  }

  return (
    <section className="border-b border-border/40 bg-gradient-to-b from-primary/[0.06] via-background to-background">
      <div className="container py-5 md:py-7">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary/90 mb-2">
              {icon} {eyebrow}
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-balance leading-tight">
              {headline}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">{sub}</p>
          </div>
          <div className="shrink-0">
            <Button variant="hero" size="sm" asChild>
              <Link to={cta.to}>{cta.icon} {cta.label}</Link>
            </Button>
          </div>
        </div>

        <form onSubmit={runSearch} className="mt-4 md:mt-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={locale ? `Search apartments in ${locale} or anywhere…` : 'Search any apartment, city, or address…'}
              className="pl-10 pr-24 h-11"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button type="submit" size="sm" variant="hero" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8">
              Search
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};

const POPULAR_CITIES = [
  'Phoenix', 'Dallas', 'Atlanta', 'Los Angeles', 'Austin', 'Chicago', 'Denver', 'Seattle', 'Miami', 'Charlotte',
];

const ColdStart = () => (
  <div className="text-center py-12 max-w-2xl mx-auto">
    <h2 className="text-3xl font-bold mb-3">No properties yet</h2>
    <p className="text-muted-foreground mb-8">
      Search for a property or add one to get started.
    </p>
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {POPULAR_CITIES.map((c) => (
        <Button key={c} variant="outline" size="sm" asChild>
          <Link to={`/search?q=${encodeURIComponent(c)}`}>{c}</Link>
        </Button>
      ))}
    </div>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button variant="hero" size="lg" asChild><Link to="/contribute"><PenLine className="w-5 h-5 mr-2" /> Add a property</Link></Button>
      <Button variant="outline" size="lg" asChild><Link to="/welcome">How it works</Link></Button>
    </div>
  </div>
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

// Instagram-style infinite scroll: pages through the full feed 12 items at a
// time as the sentinel enters the viewport. Purely client-side pagination over
// the already-loaded feed (no extra network).
const InfiniteFeed = ({ items }: { items: FeedItem[] }) => {
  const pool = useMemo(() => items.filter((i) => i.thumbnailUrl), [items]);
  const PAGE = 12;
  const [count, setCount] = useState(PAGE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = count < pool.length;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setCount((c) => Math.min(c + PAGE, pool.length));
        }
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, pool.length]);

  if (pool.length === 0) return null;
  const visible = pool.slice(0, count);

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">More properties</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Additional listings across the network</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
        {visible.map((item) => (
          <Link key={item.id} to={`/property/${item.propertyId}`} className="group relative aspect-square rounded-xl overflow-hidden bg-muted shadow-card hover:shadow-card-hover transition-all">
            {item.thumbnailUrl && (
              <img src={item.thumbnailUrl} alt={item.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-2.5 text-white">
              <p className="font-semibold text-xs md:text-sm line-clamp-1">{item.propertyName}</p>
              <p className="text-white/70 text-[10px] md:text-xs truncate">{item.location}</p>
            </div>
          </Link>
        ))}
      </div>

      <div ref={sentinelRef} className="h-16 flex items-center justify-center mt-4">
        {hasMore ? (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
        ) : (
          <p className="text-xs text-muted-foreground">End of results.</p>
        )}
      </div>
    </section>
  );
};

export default Index;
