import { useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GitCompareArrows, TrendingDown, TrendingUp, History } from 'lucide-react';
import { getPropertyProvider } from '@/data/propertyProvider';
import { computeTruthScore } from '@/domain/truthScore';
import { setPropertyMeta } from '@/lib/meta';
import { VerdictHero } from '@/components/property/VerdictHero';
import { ReportCard } from '@/components/property/ReportCard';
import { EvidenceFeed } from '@/components/property/EvidenceFeed';
import { ReviewsByLifeStage } from '@/components/property/ReviewsByLifeStage';
import { StickyContribute } from '@/components/property/StickyContribute';
import { LocationSection } from '@/components/property/LocationSection';
import { StoryCompleteness } from '@/components/property/StoryCompleteness';
import { HealthIndicator } from '@/components/property/HealthIndicator';
import { DepositIntelligence } from '@/components/property/DepositIntelligence';
import { ContentSuggestions } from '@/components/property/ContentSuggestions';
import { NearbyProperties } from '@/components/property/NearbyProperties';
import { OfficialContent } from '@/components/property/OfficialContent';
import { PropertyQA } from '@/components/property/PropertyQA';
import type { TimelineEvent } from '@/domain/property';

const Timeline = ({ events }: { events: TimelineEvent[] }) => {
  if (events.length === 0) return null;
  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-1 flex items-center gap-2"><History className="w-6 h-6" /> Property timeline</h2>
      <p className="text-muted-foreground mb-6">What changed, and when — the story a snapshot can't tell.</p>
      <div className="relative border-l-2 border-border/60 pl-6 space-y-6">
        {events.map((e) => (
          <div key={e.id} className="relative">
            <span className="absolute -left-[1.9rem] top-1 w-3 h-3 rounded-full bg-primary" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{e.date}</span>
              {e.delta != null && (
                <Badge variant={e.delta < 0 ? 'destructive' : 'success'} className="gap-1">
                  {e.delta < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {e.delta > 0 ? `+${e.delta}` : e.delta}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{e.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const Property = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const evidenceRef = useRef<HTMLDivElement>(null);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => getPropertyProvider().getProperty(id),
  });

  const result = useMemo(
    () => computeTruthScore(property?.reviews ?? []),
    [property],
  );

  useEffect(() => {
    if (property) {
      setPropertyMeta({
        propertyId: property.id,
        name: property.name,
        location: [property.city, property.state].filter(Boolean).join(', '),
        score: result.score,
      });
    }
  }, [property, result.score]);

  const contribute = () => navigate(`/contribute/${id}`);
  const watch = () => evidenceRef.current?.scrollIntoView({ behavior: 'smooth' });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Property not found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find that property — but you can add it.</p>
          <Button variant="hero" onClick={contribute}>Add this property</Button>
        </div>
      </div>
    );
  }

  const location = [property.city, property.state].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />

      <VerdictHero property={property} result={result} onWatch={watch} onContribute={contribute} />

      <DepositIntelligence result={result} />

      <div className="container mx-auto px-4 py-10 max-w-3xl grid gap-6 md:grid-cols-2">
        <ReportCard propertyName={property.name} location={location} result={result} />
        <div className="space-y-6">
          <HealthIndicator property={property} />
          <StoryCompleteness property={property} />
        </div>
      </div>

      <div ref={evidenceRef}>
        <EvidenceFeed property={property} />
      </div>

      <OfficialContent property={property} />

      <ContentSuggestions property={property} />

      <ReviewsByLifeStage property={property} onContribute={contribute} />

      <LocationSection property={property} />

      <Timeline events={property.timeline} />

      <PropertyQA propertyId={property.id} />

      <NearbyProperties property={property} />

      {/* Keep going — never a dead end */}
      <section className="container mx-auto px-4 py-10">
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompareArrows className="w-5 h-5" /> Deciding between places?
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="hero" asChild><Link to="/compare">Compare properties</Link></Button>
            <Button variant="outline" asChild><Link to="/browse">Browse more in {property.state}</Link></Button>
            <Button variant="ghost" asChild>
              <Link to={`/report?target_type=property&target_id=${encodeURIComponent(property.id)}&url=${encodeURIComponent(window.location.href)}`}>
                Report issue
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <StickyContribute onContribute={contribute} />
    </div>
  );
};

export default Property;
