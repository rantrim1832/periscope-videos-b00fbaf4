import { useMemo, useState, type FormEvent } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Video, DollarSign, Wrench, Trees, MessageSquareWarning, ClipboardCheck, Home, Sparkles } from 'lucide-react';
import { getPropertyProvider } from '@/data/propertyProvider';
import { ContributeFlow } from '@/components/contribute/ContributeFlow';
import { PromptTileRail, type PromptTile } from '@/components/PromptTileRail';
import { getContributionTopic } from '@/domain/contributionTopics';

const RENTER_TILES: PromptTile[] = [
  {
    key: 'video-review',
    title: 'Record a video review of your apartment',
    hint: 'A 60-second walkthrough is worth a thousand words. Show what daily life is really like.',
    icon: Sparkles,
    cover: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
    to: '/contribute?topic=record-review',
    featured: true,
    badge: 'Start here',
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

const Contribute = () => {
  const { propertyId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topicKey = searchParams.get('topic');
  const activeTopic = getContributionTopic(topicKey);
  const topicQS = topicKey ? `?topic=${encodeURIComponent(topicKey)}` : '';

  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const { data: results = [], isLoading: searching } = useQuery({
    queryKey: ['contribute-property-search', query],
    queryFn: () => getPropertyProvider().search(query),
    enabled: query.trim().length > 0,
  });
  const onSearch = (e: FormEvent) => { e.preventDefault(); setQuery(input.trim()); };

  const tiles = useMemo(() => RENTER_TILES.map((t) => ({ ...t, to: `${t.to}${topicQS ? '' : ''}` })), [topicQS]);

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
            <Card className="max-w-2xl mx-auto p-8 text-center">
              <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              {activeTopic ? (
                <>
                  <Badge variant="secondary" className="mb-3">Topic: {activeTopic.label}</Badge>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Which building is this about?</h1>
                  <p className="text-muted-foreground mb-5">
                    Search your property, then you'll jump straight into the upload step for “{activeTopic.label}”.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Find your apartment to review it</h1>
                  <p className="text-muted-foreground mb-5">
                    Pick your building, then choose what to share. Not listed yet? You can add it.
                  </p>
                </>
              )}
              <form onSubmit={onSearch} className="flex gap-2 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input className="pl-9 h-11" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Property name or address" />
                </div>
                <Button type="submit" variant="hero">Search</Button>
              </form>
              {query && (
                <div className="mt-5 text-left space-y-2">
                  {searching ? (
                    <p className="text-sm text-muted-foreground">Searching…</p>
                  ) : results.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No match. <Link to="/browse" className="underline">Browse all properties</Link>.</p>
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
              <h1 className="text-3xl font-bold">{activeTopic ? `Upload: ${activeTopic.label}` : 'Write a review'}</h1>
              <p className="text-muted-foreground">Reviewing <span className="font-medium text-foreground">{property.name}</span></p>
            </div>
            <ContributeFlow propertyId={property.id} propertyName={property.name} topic={topicKey} />
          </>
        )}
      </div>
    </div>
  );
};

export default Contribute;
