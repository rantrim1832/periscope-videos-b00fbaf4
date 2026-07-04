import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Play, PenLine, ShieldCheck } from 'lucide-react';
import type { PropertyView } from '@/domain/property';
import type { TruthScoreResult } from '@/domain/truthScore';
import { TruthScoreGauge } from './TruthScoreGauge';
import { AddToCompareButton } from './AddToCompareButton';
import { SaveButton } from './SaveButton';
import { WatchButton } from './WatchButton';
import { isDemoMode } from '@/lib/demo';
import { computeStory } from '@/domain/story';

interface Props {
  property: PropertyView;
  result: TruthScoreResult;
  onWatch?: () => void;
  onContribute?: () => void;
}

// Story-first indicator shown when the Truth Score is confidence-gated (the
// nationwide-launch default). A giant empty score gauge under-delivers; showing
// how complete the property's story is — and inviting help — feels intentional.
const StoryProgress = ({ property }: { property: PropertyView }) => {
  const story = computeStory(property);
  const size = 176, stroke = 12;
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - story.pct / 100)} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-primary tabular-nums">{story.pct}%</span>
          <span className="text-[11px] text-muted-foreground tracking-wide">STORY COMPLETE</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-center max-w-[16rem]">Gathering resident data — the Truth Score appears as reviews arrive</p>
    </div>
  );
};

export const VerdictHero = ({ property, result, onWatch, onContribute }: Props) => {
  const location = [property.city, property.state].filter(Boolean).join(', ');
  const isEmpty = result.score == null;
  const heroImage = property.officialChannels?.find((c) => c.kind === 'gallery' && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(c.url))?.url;
  const visualCount = property.officialChannels?.filter((c) => ['gallery', 'matterport', 'instagram', 'tiktok', 'youtube'].includes(c.kind)).length ?? 0;

  return (
    <section className="relative border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {isDemoMode() && (
                <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400">Sample data</Badge>
              )}
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
              <SaveButton property={property} />
              <WatchButton type="property" id={property.id} label={property.name} />
            </div>
          </div>

          <div className="shrink-0 self-center w-full md:w-[22rem]">
            {heroImage ? (
              <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
                <div className="relative aspect-[4/3] bg-muted">
                  <img src={heroImage} alt={`${property.name} official preview`} className="h-full w-full object-cover" loading="eager" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                    <Badge className="bg-black/60 text-white border-white/20">Official · Public</Badge>
                    {visualCount > 0 && <Badge variant="secondary">{visualCount} content</Badge>}
                  </div>
                </div>
                <div className="p-4">
                  {isEmpty ? <StoryProgress property={property} /> : <TruthScoreGauge result={result} />}
                </div>
              </div>
            ) : (
              isEmpty ? <StoryProgress property={property} /> : <TruthScoreGauge result={result} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
