import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Video, DollarSign, Wrench, Trees, MessageSquareWarning, ClipboardCheck, Home, Sparkles } from 'lucide-react';
import { getPropertyProvider } from '@/data/propertyProvider';
import { ContributeFlow } from '@/components/contribute/ContributeFlow';
import { PromptTileRail, type PromptTile } from '@/components/PromptTileRail';

const RENTER_TILES: PromptTile[] = [
  {
    key: 'video-review',
    title: 'Record a video review of your apartment',
    hint: 'A 60-second walkthrough is worth a thousand words. Show what daily life is really like.',
    icon: Sparkles,
    cover: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
    to: '/browse',
    featured: true,
    badge: 'Start here',
  },
  {
    key: 'pricing',
    title: 'Share pricing surprises',
    hint: 'Hidden fees, renewal hikes, deposit charges — what future renters need to know.',
    icon: DollarSign,
    cover: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop',
    to: '/browse',
  },
  {
    key: 'management',
    title: 'Rate the management team',
    hint: 'Responsiveness, transparency, how issues actually got handled.',
    icon: MessageSquareWarning,
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop',
    to: '/browse',
  },
  {
    key: 'maintenance',
    title: 'Flag maintenance issues',
    hint: 'What broke, how fast it was fixed, what still isn\'t.',
    icon: Wrench,
    cover: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&auto=format&fit=crop',
    to: '/browse',
  },
  {
    key: 'property-issues',
    title: 'Show property condition issues',
    hint: 'Common areas, elevators, hallways, parking — the stuff photos hide.',
    icon: Home,
    cover: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
    to: '/browse',
  },
  {
    key: 'vibe',
    title: 'Capture the local vibe',
    hint: 'Walk score, coffee, transit, noise, safety at night.',
    icon: Trees,
    cover: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop',
    to: '/browse',
  },
  {
    key: 'application',
    title: 'Share your application experience',
    hint: 'Screening, fees, timelines, and what nearly went wrong.',
    icon: ClipboardCheck,
    cover: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop',
    to: '/browse',
  },
  {
    key: 'tour',
    title: 'Record a full property tour',
    hint: 'Unit + amenities + halls, unfiltered — the honest version of the leasing video.',
    icon: Video,
    cover: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop',
    to: '/browse',
  },
];

const Contribute = () => {
  const { propertyId } = useParams();

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
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Find your apartment to review it</h1>
              <p className="text-muted-foreground mb-6">
                Pick your building, then choose what to share. Not listed yet? You can add it.
              </p>
              <Button variant="hero" asChild><Link to="/browse">Browse properties</Link></Button>
            </Card>

            <PromptTileRail
              eyebrow="Ideas for renters"
              title="What renters like you are sharing"
              subtitle="Pick a story you can tell in under a minute — every one helps the next renter."
              tiles={RENTER_TILES}
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
              <h1 className="text-3xl font-bold">Write a review</h1>
              <p className="text-muted-foreground">Reviewing <span className="font-medium text-foreground">{property.name}</span></p>
            </div>
            <ContributeFlow propertyId={property.id} propertyName={property.name} />
          </>
        )}
      </div>
    </div>
  );
};

export default Contribute;
