import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PropertyView } from '@/domain/property';
import { computeDensity } from '@/domain/density';

// The Property Density Score: perceived density across the layered model,
// reframing gaps as an invitation to help — never an abandoned page.
export const CompletenessPanel = ({ property }: { property: PropertyView }) => {
  const navigate = useNavigate();
  const density = computeDensity(property);
  const filled = Math.round((density.pct / 100) * 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Density</span>
          <span className="text-sm font-normal text-muted-foreground tabular-nums">{density.pct}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="font-mono text-primary text-lg tracking-tight" aria-hidden>
          {'█'.repeat(filled)}{'░'.repeat(10 - filled)}
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {density.items.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-sm">
              {item.present
                ? <Check className="w-4 h-4 text-success shrink-0" />
                : <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
              <span className={item.present ? '' : 'text-muted-foreground'}>{item.label}</span>
            </div>
          ))}
        </div>

        {!density.items.find((i) => i.key === 'resident_truth')?.present && (
          <Button variant="hero" size="sm" className="w-full" onClick={() => navigate(`/contribute/${property.id}`)}>
            Add the first review
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Resident reviews and official property data.
        </p>
      </CardContent>
    </Card>
  );
};
