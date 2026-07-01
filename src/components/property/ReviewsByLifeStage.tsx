import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Video, Play } from 'lucide-react';
import type { PropertyView, ReviewView, LifeStage } from '@/domain/property';
import { LIFE_STAGE_LABELS } from '@/domain/property';
import type { ResidentTrustTier } from '@/domain/types';

const TRUST_BADGE: Record<ResidentTrustTier, { label: string; variant: 'success' | 'secondary' | 'outline' }> = {
  verified_resident: { label: 'Verified resident', variant: 'success' },
  likely_resident: { label: 'Likely resident', variant: 'secondary' },
  unverified: { label: 'Unverified', variant: 'outline' },
};

const STAGES: (LifeStage | 'all')[] = ['all', 'moveIn', 'living', 'maintenance', 'moveOut', 'deposit'];

const ReviewRow = ({ review }: { review: ReviewView }) => {
  const trust = TRUST_BADGE[review.trustTier];
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold">{review.title}</h3>
          {review.hasVideo && (
            <Badge variant="outline" className="gap-1 shrink-0"><Play className="w-3 h-3" /> Video</Badge>
          )}
        </div>
        {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Badge variant={trust.variant} className="gap-1"><ShieldCheck className="w-3 h-3" /> {trust.label}</Badge>
          {review.tenureLabel && <span className="text-muted-foreground">{review.tenureLabel}</span>}
          <Badge variant="muted">{LIFE_STAGE_LABELS[review.lifeStage]}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export const ReviewsByLifeStage = ({ property, onContribute }: { property: PropertyView; onContribute?: () => void }) => {
  const [stage, setStage] = useState<LifeStage | 'all'>('all');
  const reviews = stage === 'all' ? property.reviews : property.reviews.filter((r) => r.lifeStage === stage);

  return (
    <section id="reviews" className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-2xl font-bold">What residents say</h2>
        <Button variant="outline" size="sm" onClick={onContribute}>
          <Video className="w-4 h-4 mr-2" /> Add your experience
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3">
        {STAGES.map((s) => (
          <Button
            key={s}
            variant={stage === s ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap"
            onClick={() => setStage(s)}
          >
            {s === 'all' ? 'All' : LIFE_STAGE_LABELS[s]}
          </Button>
        ))}
      </div>

      {property.reviews.length === 0 ? (
        <Card className="p-8 text-center bg-muted/30 border-dashed mt-4">
          <p className="text-muted-foreground mb-4">
            No reviews yet. Lived here? Your honest take could save someone from a costly mistake.
          </p>
          <Button variant="hero" onClick={onContribute}>Be the first to review</Button>
        </Card>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">No reviews for this stage yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {reviews.map((r) => <ReviewRow key={r.id} review={r} />)}
        </div>
      )}
    </section>
  );
};
