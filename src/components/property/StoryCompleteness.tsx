import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PropertyView } from '@/domain/property';
import { computeStory } from '@/domain/story';

// "Help complete this property's story" — collaborative framing, not "leave a review".
export const StoryCompleteness = ({ property }: { property: PropertyView }) => {
  const navigate = useNavigate();
  const story = computeStory(property);
  const filledBars = Math.round((story.pct / 100) * 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Property story</span>
          <span className="text-sm font-normal text-muted-foreground tabular-nums">{story.pct}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="font-mono text-primary text-lg tracking-tight" aria-hidden>
          {'█'.repeat(filledBars)}{'░'.repeat(10 - filledBars)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {story.slots.map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-sm">
              {s.filled
                ? <Check className="w-4 h-4 text-success shrink-0" />
                : <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
              <span className={s.filled ? '' : 'text-muted-foreground'}>{s.label}</span>
            </div>
          ))}
        </div>
        <Button variant="hero" size="sm" className="w-full" onClick={() => navigate(`/contribute/${property.id}`)}>
          Help complete this property's story
        </Button>
      </CardContent>
    </Card>
  );
};
