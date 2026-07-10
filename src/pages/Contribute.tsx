import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Video, DollarSign, Wrench, Trees, MessageSquareWarning, ClipboardCheck, Home, Sparkles, Upload, FileText, Check, Volume2, Shield, Bug, Thermometer, Wifi, Car, PawPrint, Package, WashingMachine, Truck, KeyRound, TrendingDown, AlertTriangle, Coffee, Users, Briefcase, Accessibility, Star, Sofa, MessageCircle } from 'lucide-react';
import { getPropertyProvider } from '@/data/propertyProvider';
import { supabase } from '@/integrations/supabase/client';
import { ContributeFlow } from '@/components/contribute/ContributeFlow';
import { PromptTileRail, type PromptTile } from '@/components/PromptTileRail';
import { InspirationRails } from '@/components/contribute/InspirationRails';
import { getContributionTopic } from '@/domain/contributionTopics';
import { CreatePropertyDialog } from '@/components/CreatePropertyDialog';

/* eslint-disable @typescript-eslint/no-explicit-any */

type LiteHit = { id: string; name: string; addressLine1: string | null; city: string | null; state: string | null };

// Lightweight, snappy search for the contribute picker: single ilike query,
// no channel enrichment, tiny row cap. Fires on debounce as the user types.
async function fastSearch(q: string): Promise<LiteHit[]> {
  const term = `%${q}%`;
  const { data } = await (supabase as any)
    .from('canonical_property')
    .select('id, name, address_line1, city, state')
    .eq('status', 'active')
    .or(`name.ilike.${term},address_line1.ilike.${term},city.ilike.${term}`)
    .limit(8);
  return (data ?? []).map((r: any) => ({
    id: r.id, name: r.name ?? 'Unnamed property',
    addressLine1: r.address_line1 ?? null, city: r.city ?? null, state: r.state ?? null,
  }));
}

const RENTER_TILES: PromptTile[] = [
  {
    key: 'video-review',
    title: 'Record a video review of your apartment',
    hint: 'Great or bad — a 60-second walkthrough is worth a thousand words.',
    icon: Sparkles,
    cover: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
    to: '/contribute?topic=record-review',
    featured: true,
    badge: 'Start here',
  },
  {
    key: 'loved-it',
    title: 'Share what you love about living here',
    hint: 'What would make you re-sign? The team, the layout, the neighbors, the price.',
    icon: Sparkles,
    cover: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
    to: '/contribute?topic=loved-it',
  },
  {
    key: 'pricing',
    title: 'Share pricing surprises',
    hint: 'Hidden fees, renewal hikes, deposit charges — what future renters need to know.',
    icon: DollarSign,
    cover: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop',
    to: '/contribute?topic=pricing',
  },
  {
    key: 'management',
    title: 'Rate the management team',
    hint: 'Responsiveness, transparency, how issues actually got handled.',
    icon: MessageSquareWarning,
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop',
    to: '/contribute?topic=management',
  },
  {
    key: 'maintenance',
    title: 'Flag maintenance issues',
    hint: 'What broke, how fast it was fixed, what still isn\'t.',
    icon: Wrench,
    cover: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&auto=format&fit=crop',
    to: '/contribute?topic=maintenance',
  },
  {
    key: 'property-issues',
    title: 'Show property condition issues',
    hint: 'Common areas, elevators, hallways, parking — the stuff photos hide.',
    icon: Home,
    cover: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
    to: '/contribute?topic=property-condition',
  },
  {
    key: 'vibe',
    title: 'Capture the local vibe',
    hint: 'Walk score, coffee, transit, noise, safety at night.',
    icon: Trees,
    cover: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop',
    to: '/contribute?topic=local-vibe',
  },
  {
    key: 'application',
    title: 'Share your application experience',
    hint: 'Screening, fees, timelines, and what nearly went wrong.',
    icon: ClipboardCheck,
    cover: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop',
    to: '/contribute?topic=application',
  },
  {
    key: 'tour',
    title: 'Record a full property tour',
    hint: 'Unit + amenities + halls, unfiltered — the honest version of the leasing video.',
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
  { key: 'wifi-signal', title: 'Wifi & cell signal', hint: 'Which provider actually works here.', icon: Wifi,
    cover: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop', to: '/contribute?topic=wifi-signal' },
  { key: 'parking', title: 'Parking & garage', hint: 'Cost, guest rules, EV charging.', icon: Car,
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
  { key: 'commute', title: 'Commute & transit', hint: 'Door to desk — how long it really takes.', icon: Truck,
    cover: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop', to: '/contribute?topic=commute' },
  { key: 'families-schools', title: 'Families & schools', hint: 'Living here with kids — the honest take.', icon: Users,
    cover: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&auto=format&fit=crop', to: '/contribute?topic=families-schools' },
  { key: 'wfh-setup', title: 'Work-from-home', hint: 'Home office, coworking, wifi, quiet.', icon: Briefcase,
    cover: 'https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?w=800&auto=format&fit=crop', to: '/contribute?topic=wfh-setup' },
  { key: 'accessibility', title: 'Accessibility', hint: 'Elevators, ramps, doorways, ADA units.', icon: Accessibility,
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&auto=format&fit=crop', to: '/contribute?topic=accessibility' },
  { key: 'staff-shoutout', title: 'Staff shoutout', hint: 'The team member who saved your week.', icon: MessageCircle,
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop', to: '/contribute?topic=staff-shoutout' },
];

const Contribute = () => {
  const { propertyId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topicKey = searchParams.get('topic');
  const activeTopic = getContributionTopic(topicKey);
  const topicQS = topicKey ? `?topic=${encodeURIComponent(topicKey)}` : '';

  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  // Debounce typing so we don't fire a query per keystroke.
  useEffect(() => {
    const h = setTimeout(() => setQuery(input.trim()), 250);
    return () => clearTimeout(h);
  }, [input]);
  const { data: results = [], isLoading: searching } = useQuery({
    queryKey: ['contribute-property-search-lite', query],
    queryFn: () => fastSearch(query),
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
  const onSearch = (e: FormEvent) => { e.preventDefault(); setQuery(input.trim()); };

  // Tiles hardcode their own `?topic=...` so we just pass them through as-is.
  const tiles = RENTER_TILES;

  const { data: property, isLoading } = useQuery({
    queryKey: ['contribute-property', propertyId],
    queryFn: () => (propertyId ? getPropertyProvider().getProperty(propertyId) : Promise.resolve(null)),
    enabled: !!propertyId,
  });

  return (
    <div className="min-h-screen bg-background pb-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {!propertyId ? (
          <div className="space-y-10">
            <div className="max-w-2xl mx-auto">
              <UploadWizardHeader step={1} topicLabel={activeTopic?.label} />
            </div>
            <Card className="max-w-2xl mx-auto p-6 md:p-8">
              <div className="text-center mb-5">
                <h1 className="text-2xl md:text-3xl font-bold mb-1.5">
                  {activeTopic ? `Upload your ${activeTopic.label.toLowerCase()}` : 'Upload your review'}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Step 1 of 3 — pick which building this is about. You'll upload the video on the next screen.
                </p>
              </div>
              <form onSubmit={onSearch} className="flex gap-2 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input autoFocus className="pl-9 h-11" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Property name or address" />
                </div>
                <Button type="submit" variant="hero">Search</Button>
              </form>
              {query && (
                <div className="mt-5 text-left space-y-2">
                  {searching ? (
                    <p className="text-sm text-muted-foreground">Searching…</p>
                  ) : results.length === 0 ? (
                    <div className="text-sm text-muted-foreground space-y-3">
                      <p>
                        No match. <Link to="/browse" className="underline">Browse all properties</Link> — or add it below so you can leave a review.
                      </p>
                      <CreatePropertyDialog
                        onPropertyCreated={(id) => navigate(`/contribute/${id}${topicQS}`)}
                        trigger={
                          <Button type="button" variant="hero" size="sm">
                            Add this property
                          </Button>
                        }
                      />
                      <p className="text-xs">
                        You're adding this as a renter — no claim required. Managers can claim it later.
                      </p>
                    </div>
                  ) : (
                    results.slice(0, 6).map((p) => (
                      <button key={p.id} onClick={() => navigate(`/contribute/${p.id}${topicQS}`)}
                        className="w-full text-left rounded-lg border p-3 hover:border-primary transition-colors">
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{[p.addressLine1, p.city, p.state].filter(Boolean).join(', ')}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </Card>

            <PromptTileRail
              eyebrow="Ideas for renters"
              title="What renters like you are sharing"
              subtitle="Pick a story you can tell in under a minute — every one helps the next renter."
              tiles={tiles}
            />

            <PromptTileRail
              eyebrow="More renter angles"
              title="Every detail renters wish they'd checked"
              subtitle="Noise, pests, parking, pets, packages, laundry, deposits — the stuff tours skip."
              tiles={RENTER_MORE_TILES}
            />

            <InspirationRails />
          </div>
        ) : isLoading ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !property ? (
          <Card className="max-w-xl mx-auto p-10 text-center">
            <h1 className="text-2xl font-bold mb-2">Property not found</h1>
            <p className="text-muted-foreground mb-6">We couldn't find that property — but you can add it.</p>
            <Button variant="hero" asChild><Link to="/browse">Browse properties</Link></Button>
          </Card>
        ) : (
          <>
            <div className="max-w-2xl mx-auto mb-6">
              <UploadWizardHeader step={2} topicLabel={activeTopic?.label} />
              <h1 className="text-2xl md:text-3xl font-bold mt-4">
                {activeTopic ? `Upload your ${activeTopic.label.toLowerCase()}` : 'Upload your review'}
              </h1>
              <p className="text-muted-foreground">for <span className="font-medium text-foreground">{property.name}</span></p>
            </div>
            <ContributeFlow propertyId={property.id} propertyName={property.name} topic={topicKey} />
          </>
        )}
      </div>
    </div>
  );
};

// Compact 3-step wizard header so users always see where they are in the upload.
const UploadWizardHeader = ({ step, topicLabel }: { step: 1 | 2 | 3; topicLabel?: string }) => {
  const steps = [
    { n: 1, label: 'Property', icon: Search },
    { n: 2, label: 'Upload video', icon: Upload },
    { n: 3, label: 'Details & post', icon: FileText },
  ];
  return (
    <div>
      {topicLabel && <Badge variant="secondary" className="mb-2">Topic: {topicLabel}</Badge>}
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => {
          const done = step > s.n;
          const current = step === s.n;
          const Icon = done ? Check : s.icon;
          return (
            <li key={s.n} className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={
                  'flex items-center justify-center w-8 h-8 rounded-full shrink-0 ' +
                  (current
                    ? 'bg-primary text-primary-foreground'
                    : done
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground')
                }
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className={'text-xs md:text-sm truncate ' + (current ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {s.label}
              </span>
              {i < steps.length - 1 && <span className={'flex-1 h-px ' + (done ? 'bg-success' : 'bg-border')} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Contribute;
