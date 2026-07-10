import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ShieldCheck, Building2, Share2, PenLine, Play, SlidersHorizontal, X, Sparkles, DollarSign, MessageSquareWarning, Wrench, Home, Trees, ClipboardCheck, Video, PlusCircle, Bell, Search, Volume2, Shield, Bug, Thermometer, Wifi, Car, PawPrint, Package, WashingMachine, Truck, KeyRound, TrendingDown, AlertTriangle, Coffee, Users, Briefcase, Accessibility, Star, LayoutGrid, Sofa, UserSquare2, MessageCircle, PartyPopper, Leaf, Lock, Tag, HelpCircle, Hammer } from 'lucide-react';
import { getPropertyProvider } from '@/data/propertyProvider';
import { getVideoProvider } from '@/services/providers/video';
import { VideoPlayer } from '@/components/property/VideoPlayer';
import { FEED_CATEGORIES, type FeedItem } from '@/domain/property';
import { useToast } from '@/hooks/use-toast';
import { getStoredLocalCity, stateFromLocation } from '@/lib/localDiscovery';
import { PromptTileRail, type PromptTile } from '@/components/PromptTileRail';

const RENTER_VIDEO_TILES: PromptTile[] = [
  {
    key: 'record-review',
    title: 'Record a video review of your apartment',
    hint: 'Great or bad — show the building, the unit, and what daily life is really like.',
    icon: Sparkles,
    cover: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
    to: '/contribute?topic=record-review',
    featured: true,
    badge: 'Start here',
  },
  {
    key: 'loved-it',
    title: 'Share what you love about living here',
    hint: 'Rent, team, neighbors, layout — what would make you re-sign?',
    icon: Sparkles,
    cover: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
    to: '/contribute?topic=loved-it',
  },
  {
    key: 'pricing',
    title: 'Share pricing issues',
    hint: 'Rent increases, fees, deposits, utilities, and move-out charges.',
    icon: DollarSign,
    cover: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop',
    to: '/contribute?topic=pricing',
  },
  {
    key: 'management',
    title: 'Share management issues',
    hint: 'Responsiveness, communication, leasing promises, and follow-through.',
    icon: MessageSquareWarning,
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop',
    to: '/contribute?topic=management',
  },
  {
    key: 'maintenance',
    title: 'Show maintenance issues',
    hint: 'What broke, how long repairs took, and what still needs attention.',
    icon: Wrench,
    cover: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&auto=format&fit=crop',
    to: '/contribute?topic=maintenance',
  },
  {
    key: 'property-condition',
    title: 'Show property issues',
    hint: 'Hallways, elevators, parking, common areas, noise, and cleanliness.',
    icon: Home,
    cover: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
    to: '/contribute?topic=property-condition',
  },
  {
    key: 'local-vibe',
    title: 'Capture the local vibe',
    hint: 'Transit, traffic, groceries, restaurants, safety, and weekend life.',
    icon: Trees,
    cover: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop',
    to: '/contribute?topic=local-vibe',
  },
  {
    key: 'application',
    title: 'Share the application process',
    hint: 'Screening, fees, approval timing, deposits, and lease surprises.',
    icon: ClipboardCheck,
    cover: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop',
    to: '/contribute?topic=application',
  },
  {
    key: 'full-tour',
    title: 'Record a full property tour',
    hint: 'Unit, amenities, parking, hallways, entry, and street frontage.',
    icon: Video,
    cover: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop',
    to: '/contribute?topic=full-tour',
  },
];

const RENTER_MORE_TILES: PromptTile[] = [
  { key: 'unit-tour', title: 'Tour inside your unit', hint: 'Kitchen, bath, closets, windows — the real layout.', icon: Sofa,
    cover: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop', to: '/contribute?topic=unit-tour' },
  { key: 'amenities-real', title: 'Amenities in real life', hint: 'The gym at 6pm, not in the brochure.', icon: Star,
    cover: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&auto=format&fit=crop', to: '/contribute?topic=amenities-real' },
  { key: 'noise', title: 'Noise & neighbors', hint: 'What you actually hear through the walls.', icon: Volume2,
    cover: 'https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?w=800&auto=format&fit=crop', to: '/contribute?topic=noise' },
  { key: 'safety', title: 'Safety & security', hint: 'Walking home, lobby access, package theft.', icon: Shield,
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&auto=format&fit=crop', to: '/contribute?topic=safety' },
  { key: 'pests', title: 'Pests & bugs', hint: 'Roaches, mice, bedbugs — and how they responded.', icon: Bug,
    cover: 'https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=800&auto=format&fit=crop', to: '/contribute?topic=pests' },
  { key: 'hvac', title: 'Heat, AC & utilities', hint: 'Did the heat actually work last winter?', icon: Thermometer,
    cover: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&auto=format&fit=crop', to: '/contribute?topic=hvac' },
  { key: 'wifi-signal', title: 'Wifi & cell signal', hint: 'Which provider actually works in this building.', icon: Wifi,
    cover: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop', to: '/contribute?topic=wifi-signal' },
  { key: 'parking', title: 'Parking & garage', hint: 'Cost, guest rules, EV charging, garage condition.', icon: Car,
    cover: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop', to: '/contribute?topic=parking' },
  { key: 'pets', title: 'Pet-friendly reality', hint: 'Fees, breed rules, dog run, elevator etiquette.', icon: PawPrint,
    cover: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&auto=format&fit=crop', to: '/contribute?topic=pets' },
  { key: 'packages', title: 'Packages & mail', hint: 'Package room, lockers, theft, delivery access.', icon: Package,
    cover: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop', to: '/contribute?topic=packages' },
  { key: 'laundry', title: 'Laundry situation', hint: 'In-unit vs shared — cost and reliability.', icon: WashingMachine,
    cover: 'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?w=800&auto=format&fit=crop', to: '/contribute?topic=laundry' },
  { key: 'move-in-day', title: 'Move-in day', hint: 'Keys, elevators, loading dock, walkthrough.', icon: Truck,
    cover: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop', to: '/contribute?topic=move-in-day' },
  { key: 'move-out', title: 'Move-out story', hint: 'Notice, cleaning, walkthrough, damage claims.', icon: KeyRound,
    cover: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop', to: '/contribute?topic=move-out' },
  { key: 'deposit-return', title: 'Deposit return', hint: 'What they charged and what you got back.', icon: DollarSign,
    cover: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop', to: '/contribute?topic=deposit-return' },
  { key: 'renewal-negotiation', title: 'Renewal & negotiation', hint: 'How you negotiated your renewal rent.', icon: TrendingDown,
    cover: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop', to: '/contribute?topic=renewal-negotiation' },
  { key: 'red-flags', title: 'Red flags on tour', hint: 'What to look for before signing.', icon: AlertTriangle,
    cover: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop', to: '/contribute?topic=red-flags' },
  { key: 'day-in-life', title: 'Day in the life', hint: 'A real weekday morning at your building.', icon: Coffee,
    cover: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop', to: '/contribute?topic=day-in-life' },
  { key: 'commute', title: 'Commute & transit', hint: 'Door to desk — how long it actually takes.', icon: Truck,
    cover: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop', to: '/contribute?topic=commute' },
  { key: 'families-schools', title: 'Families & schools', hint: 'Living here with kids — the honest take.', icon: Users,
    cover: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&auto=format&fit=crop', to: '/contribute?topic=families-schools' },
  { key: 'wfh-setup', title: 'Work-from-home', hint: 'Home office, coworking, wifi, quiet.', icon: Briefcase,
    cover: 'https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?w=800&auto=format&fit=crop', to: '/contribute?topic=wfh-setup' },
  { key: 'accessibility', title: 'Accessibility', hint: 'Elevators, ramps, doorways, ADA units.', icon: Accessibility,
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&auto=format&fit=crop', to: '/contribute?topic=accessibility' },
  { key: 'staff-shoutout', title: 'Staff shoutout', hint: 'Recognize the team member who saved your week.', icon: MessageCircle,
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop', to: '/contribute?topic=staff-shoutout' },
];

const MANAGER_VIDEO_TILES: PromptTile[] = [
  {
    key: 'leasing-tour',
    title: 'Record the leasing tour',
    hint: 'The strongest first video: walk renters through the property like a live tour.',
    icon: Sparkles,
    cover: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
    to: '/manager?topic=leasing-tour',
    featured: true,
    badge: 'Recommended',
  },
  {
    key: 'claim',
    title: 'Claim or create your property',
    hint: 'Find the building, verify your role, or create a new property page.',
    icon: PlusCircle,
    cover: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop',
    to: '/manager',
  },
  {
    key: 'interiors',
    title: 'Upload interior videos',
    hint: 'Show real units, finishes, storage, windows, light, and layout flow.',
    icon: Home,
    cover: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop',
    to: '/manager?topic=interiors',
  },
  {
    key: 'amenities',
    title: 'Upload amenity videos',
    hint: 'Gym, pool, lounge, coworking, rooftop, pet areas, and parking.',
    icon: Video,
    cover: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&auto=format&fit=crop',
    to: '/manager?topic=amenities',
  },
  {
    key: 'area',
    title: 'Upload the area vibe',
    hint: 'The block, transit, restaurants, coffee, parks, and daily convenience.',
    icon: Trees,
    cover: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop',
    to: '/manager?topic=area',
  },
  {
    key: 'resident-story',
    title: 'Ask renters to share their story',
    hint: 'Invite residents to post authentic video reviews for your building.',
    icon: MessageSquareWarning,
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop',
    to: '/manager',
  },
  {
    key: 'alerts',
    title: 'Turn on review alerts',
    hint: 'Get notified when a new apartment video review is posted.',
    icon: Bell,
    cover: 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=800&auto=format&fit=crop',
    to: '/manager',
  },
];

const MANAGER_MORE_TILES: PromptTile[] = [
  { key: 'floorplans', title: 'Floorplan walkthrough', hint: 'Studio through 3-bed — layout, sqft, price.', icon: LayoutGrid,
    cover: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop', to: '/manager?topic=floorplans' },
  { key: 'model-unit', title: 'Model unit', hint: 'The staged model — finishes and appliances.', icon: Sofa,
    cover: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop', to: '/manager?topic=model-unit' },
  { key: 'staff-intro', title: 'Meet the team', hint: 'Faces behind the front desk and maintenance.', icon: UserSquare2,
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop', to: '/manager?topic=staff-intro' },
  { key: 'resident-testimonial', title: 'Resident testimonial', hint: 'A real resident on why they renewed.', icon: MessageCircle,
    cover: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop', to: '/manager?topic=resident-testimonial' },
  { key: 'events', title: 'Community events', hint: 'Rooftop happy hour, fitness, holiday parties.', icon: PartyPopper,
    cover: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop', to: '/manager?topic=events' },
  { key: 'pet-friendly', title: 'Pet-friendly features', hint: 'Dog run, pet spa, policy and fees.', icon: PawPrint,
    cover: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&auto=format&fit=crop', to: '/manager?topic=pet-friendly' },
  { key: 'sustainability', title: 'Sustainability & tech', hint: 'Smart thermostats, EV chargers, LEED.', icon: Leaf,
    cover: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&auto=format&fit=crop', to: '/manager?topic=sustainability' },
  { key: 'safety-features', title: 'Safety & security', hint: '24/7 access, cameras, secure package room.', icon: Lock,
    cover: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop', to: '/manager?topic=safety-features' },
  { key: 'incentives', title: 'Current specials', hint: '6 weeks free, look-and-lease, referral bonuses.', icon: Tag,
    cover: 'https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=800&auto=format&fit=crop', to: '/manager?topic=incentives' },
  { key: 'faq', title: 'Renter FAQ', hint: 'Top 5 questions from every tour — on camera.', icon: HelpCircle,
    cover: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop', to: '/manager?topic=faq' },
  { key: 'renovation-update', title: 'Renovation updates', hint: 'Lobby, gym, hallways — before & after.', icon: Hammer,
    cover: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop', to: '/manager?topic=renovation-update' },
];

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
  const [stateFilter, setStateFilter] = useState<string>(localState ?? 'All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const statesList = useMemo(() => [...new Set(items.map((i) => stateFromLocation(i.location)).filter(Boolean))] as string[], [items]);
  const citiesForState = useMemo(() => [...new Set(
    items
      .filter((i) => stateFilter === 'All' || stateFromLocation(i.location) === stateFilter)
      .map((i) => i.location)
      .filter(Boolean),
  )].slice(0, 24), [items, stateFilter]);
  const cityOptions = city !== 'All' && !citiesForState.includes(city) ? [city, ...citiesForState] : citiesForState;
  const filteredRaw = items.filter((i) => {
    const isGlobalCuratedVideo = i.source === 'imported' && !i.location;
    return (category === 'All' || i.category === category) &&
      (isGlobalCuratedVideo || stateFilter === 'All' || stateFromLocation(i.location) === stateFilter) &&
      (isGlobalCuratedVideo || city === 'All' || i.location === city);
  });
  const filtered = filteredRaw;
  const activeCount = (category !== 'All' ? 1 : 0) + (city !== 'All' ? 1 : 0) + (stateFilter !== 'All' && stateFilter !== (localState ?? 'All') ? 1 : 0);
  const resetToLocal = () => {
    setCategory('All');
    setStateFilter(localState ?? 'All');
    setCity(stored ? preferredLocation : 'All');
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
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
              {city !== 'All' ? ` · ${city}` : ''}
            </span>
          </div>
          {activeCount > 0 && (
            <Button size="sm" variant="ghost" className="shrink-0 h-8 px-2" onClick={resetToLocal}>
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
                {['All', ...cityOptions].map((c) => (
                  <Button key={c} size="sm" variant={city === c ? 'default' : 'outline'} className="whitespace-nowrap h-8" onClick={() => setCity(c)}>
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
        <LocalVideoStart
          locationLabel={city !== 'All' ? city : stateFilter !== 'All' ? stateFilter : 'your area'}
          category={category}
        />
      ) : (
        <>
          <div className="h-[calc(100dvh-8rem)] md:h-[calc(100dvh-9rem)] overflow-y-auto overflow-x-hidden snap-y snap-mandatory">
            {filtered.map((item) => <FeedCard key={item.id} item={item} />)}
          </div>
          <div className="container px-4 py-6 space-y-6">
            <PromptTileRail
              eyebrow="Post your own"
              title="What renters are sharing"
              subtitle="Pick any angle — it helps the next renter."
              tiles={RENTER_VIDEO_TILES}
              seeAllHref="/contribute"
            />
            <PromptTileRail
              eyebrow="More angles"
              title="Every detail renters wish they'd checked"
              subtitle="Noise, pests, parking, pets, packages, laundry, deposits — the stuff tours skip."
              tiles={RENTER_MORE_TILES}
            />
          </div>
        </>
      )}
    </div>
  );
};

const LocalVideoStart = ({ locationLabel, category }: { locationLabel: string; category: string }) => (
  <main className="container px-4 py-6 md:py-8 pb-24 space-y-8 md:space-y-10">
    <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr] md:items-stretch">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.08] via-background to-secondary/[0.08]">
        <CardContent className="p-5 md:p-7 flex flex-col justify-between min-h-[280px]">
          <div>
            <Badge variant="secondary" className="mb-3">{locationLabel}</Badge>
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-balance">
              Bring Apartment Reviews to Life in {locationLabel}.
            </h1>
            <p className="text-muted-foreground mt-3 md:text-lg max-w-2xl">
              Be the first to post the kind of apartment video renters actually want before they tour: pricing, maintenance, management, property condition, and neighborhood feel.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 mt-6">
            <Button variant="hero" size="lg" asChild>
              <Link to="/contribute?topic=record-review"><Video className="w-4 h-4" /> Upload a video review</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/browse"><Search className="w-4 h-4" /> Browse properties</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-5 md:p-6 h-full flex flex-col justify-between gap-6">
          <div>
            <Badge variant="outline" className="mb-3">Property managers</Badge>
            <h2 className="text-2xl font-bold leading-tight">Claim your property and record the leasing tour.</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Add official videos, upload interiors and amenities, show the area, invite renters to share their story, and turn on alerts for new apartment video reviews.
            </p>
          </div>
          <Button variant="secondary" className="w-full" asChild>
            <Link to="/manager"><Building2 className="w-4 h-4" /> Claim or create property</Link>
          </Button>
        </CardContent>
      </Card>
    </section>

    {category !== 'All' && (
      <p className="text-sm text-muted-foreground">
        Showing ideas for “{category}” because this location does not have that video category yet.
      </p>
    )}

    <PromptTileRail
      eyebrow="For renters"
      title="Record the review you wish you had before signing"
      subtitle="Pick one angle and keep it real — video helps the next renter understand the building fast."
      tiles={RENTER_VIDEO_TILES}
    />

    <PromptTileRail
      eyebrow="More renter angles"
      title="Every detail renters wish they'd checked"
      subtitle="Noise, pests, parking, pets, packages, laundry, deposits — the stuff tours skip."
      tiles={RENTER_MORE_TILES}
    />

    <PromptTileRail
      eyebrow="For apartment staff"
      title="What to add after claiming your property"
      subtitle="Start with the leasing tour, then add interiors, amenities, neighborhood clips, resident invitations, and alerts."
      tiles={MANAGER_VIDEO_TILES}
    />

    <PromptTileRail
      eyebrow="More for apartment staff"
      title="Fill out your property's full video library"
      subtitle="Floorplans, model units, team intros, testimonials, specials, and safety — the videos prospects rewatch."
      tiles={MANAGER_MORE_TILES}
    />
  </main>
);

const FeedCard = ({ item }: { item: FeedItem }) => {
  const { toast } = useToast();
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const isCuratedVideo = item.source === 'imported' && item.propertyId.startsWith('watch/');
  const itemPath = isCuratedVideo ? `/${item.propertyId}` : `/property/${item.propertyId}`;

  const play = async () => {
    if (item.embedUrl) { setPlaying(true); return; }
    if (item.thumbnailUrl && !item.playbackUrl) return;
    const p = await getVideoProvider().getPlayback(item.playbackUrl ?? item.id);
    setSrc(p.hlsUrl);
    setPlaying(true);
  };

  const share = async () => {
    const url = `${window.location.origin}${itemPath}`;
    try {
      if (navigator.share) await navigator.share({ title: item.propertyName, text: item.title, url });
      else { await navigator.clipboard.writeText(url); toast({ title: 'Link copied' }); }
    } catch { /* cancelled */ }
  };

  return (
    <section className="snap-start h-[calc(100dvh-8rem)] md:h-[calc(100dvh-9rem)] w-full flex items-center justify-center bg-black relative overflow-hidden">
      <div className="relative w-full h-full mx-auto sm:max-w-sm">
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
          {isCuratedVideo
            ? <Badge variant="secondary" className="gap-1"><Play className="w-3 h-3" /> YouTube</Badge>
            : item.source === 'official'
            ? <Badge variant="secondary" className="gap-1"><Building2 className="w-3 h-3" /> Official</Badge>
            : <Badge variant="success" className="gap-1"><ShieldCheck className="w-3 h-3" /> {item.verified ? 'Verified resident' : 'Resident'}</Badge>}
          {item.category && <Badge variant="outline" className="bg-black/40 text-white border-white/30">{item.category}</Badge>}
        </div>

        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4 space-y-2">
          <p className="text-white font-semibold">{item.title}</p>
          <Link to={itemPath} className="flex items-center gap-1 text-white/80 text-sm hover:text-white">
            <MapPin className="w-4 h-4" /> {item.propertyName}{item.location ? ` · ${item.location}` : ''}
          </Link>
          {item.creatorId && item.creatorName && (
            <Link to={`/creator/${item.creatorId}`} className="text-white/70 text-xs hover:text-white">
              by {item.creatorName}
            </Link>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={share}><Share2 className="w-4 h-4 mr-1" /> Share</Button>
            <Button size="sm" variant="hero" asChild>
              <Link to={isCuratedVideo ? '/contribute' : `/contribute/${item.propertyId}`}>
                <PenLine className="w-4 h-4 mr-1" /> {isCuratedVideo ? 'Add yours' : 'Add a review'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feed;
