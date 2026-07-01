import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Play, PenLine, ShieldCheck } from 'lucide-react';
import type { PropertyView } from '@/domain/property';
import type { TruthScoreResult } from '@/domain/truthScore';
import { TruthScoreGauge } from './TruthScoreGauge';
import { AddToCompareButton } from './AddToCompareButton';

interface Props {
  property: PropertyView;
  result: TruthScoreResult;
  onWatch?: () => void;
  onContribute?: () => void;
}

export const VerdictHero = ({ property, result, onWatch, onContribute }: Props) => {
  const location = [property.city, property.state].filter(Boolean).join(', ');
  const isEmpty = result.score == null;

  return (
    <section className="relative border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {property.claimedByManager && (
                <Badge variant="outline" className="gap-1"><ShieldCheck className="w-3 h-3" /> Manager responds</Badge>
              )}
              <Badge variant="muted" className="capitalize">{property.propertyClass.replace('_', ' ')}</Badge>
              {property.unitsCount ? <Badge variant="muted">{property.unitsCount} units</Badge> : null}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{property.name}</h1>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {property.addressLine1 ? `${property.addressLine1}, ` : ''}{location}
            </p>

            <p className="text-muted-foreground max-w-xl">
              {isEmpty
                ? 'No one has shared the truth about this place yet. Be the first to expose or defend it.'
                : `Based on ${result.verifiedResidentCount} verified residents, ${result.reviewCount} reviews, and ${result.videoCount} videos.`}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {!isEmpty && (
                <Button variant="hero" size="lg" onClick={onWatch}>
                  <Play className="w-5 h-5 mr-2" /> Watch the evidence
                </Button>
              )}
              <Button variant={isEmpty ? 'hero' : 'outline'} size="lg" onClick={onContribute}>
                <PenLine className="w-5 h-5 mr-2" /> {isEmpty ? 'Be the first to add your truth' : 'Add your truth'}
              </Button>
              <AddToCompareButton property={property} score={result.score} />
            </div>
          </div>

          <div className="shrink-0 self-center">
            <TruthScoreGauge result={result} />
          </div>
        </div>
      </div>
    </section>
  );
};
