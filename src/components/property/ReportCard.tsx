import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Users, Video, MessageSquare } from 'lucide-react';
import type { TruthScoreResult } from '@/domain/truthScore';
import {
  CATEGORY_ORDER, CATEGORY_LABELS, categoryPct, scoreColorVar,
} from '@/domain/truthScore';
import { useToast } from '@/hooks/use-toast';

interface Props {
  propertyName: string;
  location: string;
  result: TruthScoreResult;
  onShare?: () => void;
}

// The shareable artifact — the primary viral loop. Designed to be
// screenshot-beautiful and one-tap shareable.
export const ReportCard = ({ propertyName, location, result, onShare }: Props) => {
  const { toast } = useToast();

  const handleShare = async () => {
    onShare?.();
    const text = result.score != null
      ? `${propertyName} — Truth Score ${result.score}/100 on Periscope`
      : `${propertyName} — be the first to review it on Periscope`;
    try {
      if (navigator.share) {
        await navigator.share({ title: propertyName, text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        toast({ title: 'Link copied', description: 'Report Card link copied to clipboard' });
      }
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl">Apartment Report Card</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{propertyName} · {location}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleShare} className="shrink-0">
          <Share2 className="w-4 h-4 mr-2" /> Share
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {result.verifiedResidentCount} verified</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {result.reviewCount} reviews</span>
          <span className="flex items-center gap-1"><Video className="w-4 h-4" /> {result.videoCount} videos</span>
        </div>

        <div className="space-y-2.5">
          {CATEGORY_ORDER.map((key) => {
            const cat = result.categories[key];
            const pct = categoryPct(cat.score);
            const color = cat.score == null ? 'hsl(var(--muted-foreground))' : scoreColorVar(cat.score * 20);
            return (
              <div key={key} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-3">
                <span className="text-sm">{CATEGORY_LABELS[key]}</span>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  {cat.score != null && (
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  )}
                </div>
                <span className="text-sm text-right tabular-nums text-muted-foreground">
                  {cat.score != null ? cat.score.toFixed(1) : '—'}
                </span>
              </div>
            );
          })}
        </div>

        {result.confidence !== 'established' && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            {result.confidence === 'insufficient'
              ? 'Not enough verified data yet — scores appear once more residents contribute.'
              : 'Early signal — based on a small number of contributions so far.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
