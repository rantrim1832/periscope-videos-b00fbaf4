import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import type { PropertyView } from '@/domain/property';
import { computeHealth, healthLabel } from '@/domain/healthIndex';

// Trajectory indicator — complements (does not replace) the Truth Score.
export const HealthIndicator = ({ property }: { property: PropertyView }) => {
  const h = computeHealth(property.reviews);
  if (h.trend === 'insufficient') return null;

  const color = h.trend === 'improving' ? 'text-success' : h.trend === 'declining' ? 'text-destructive' : 'text-muted-foreground';
  const Icon = h.trend === 'improving' ? TrendingUp : h.trend === 'declining' ? TrendingDown : Minus;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-primary" />
          <span className="font-semibold">Trajectory</span>
          <Badge variant="outline" className={`ml-auto gap-1 ${color}`}>
            <Icon className="w-3.5 h-3.5" /> {healthLabel(h.trend)}{h.delta != null ? ` (${h.delta > 0 ? '+' : ''}${h.delta})` : ''}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {h.trend === 'declining' && 'Recent residents rate it lower than earlier ones.'}
          {h.trend === 'improving' && 'Recent residents rate it higher than earlier ones.'}
          {h.trend === 'stable' && 'Recent experience is consistent with the past.'}
          {h.trend === 'new' && 'Only recent reviews so far — trajectory will appear over time.'}
        </p>
        {h.signals.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {h.signals.map((s) => (
              <Badge key={s.label} variant={s.direction === 'up' ? 'success' : 'destructive'} className="gap-1">
                {s.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {s.label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
