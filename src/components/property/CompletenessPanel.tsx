import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Circle, Link2, Building2, Users, Sparkles, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PropertyView } from '@/domain/property';

// "Perceived density before perfect density": show the layered content model as
// a completeness picture, reframing gaps as an invitation to help — never as an
// abandoned page.
export const CompletenessPanel = ({ property }: { property: PropertyView }) => {
  const navigate = useNavigate();
  const hasImported = property.media.some((m) => m.source === 'imported' || m.embedUrl);
  const hasOfficial = property.media.some((m) => m.source === 'official') || (property.officialChannels?.length ?? 0) > 0;
  const hasResident = property.reviews.length > 0 || property.media.some((m) => m.source === 'resident');
  const hasCreator = property.media.some((m) => m.platform && m.source === 'imported'); // creator-attributed embeds

  const layers = [
    { icon: MapPin, label: 'Basics, map & metadata', present: true, action: null as null | (() => void), cta: '' },
    { icon: Link2, label: 'Public social evidence', present: hasImported, action: () => navigate(`/contribute/${property.id}`), cta: 'Import a post' },
    { icon: Building2, label: 'Official property content', present: hasOfficial, action: () => navigate(`/contribute/${property.id}`), cta: 'Add official content' },
    { icon: Users, label: 'Resident truth', present: hasResident, action: () => navigate(`/contribute/${property.id}`), cta: 'Add your truth' },
    { icon: Sparkles, label: 'Creator & investigations', present: hasCreator, action: () => navigate(`/contribute/${property.id}`), cta: 'Contribute' },
  ];
  const done = layers.filter((l) => l.present).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>The full picture</span>
          <span className="text-sm font-normal text-muted-foreground">{done} of {layers.length} layers</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(done / layers.length) * 100}%` }} />
        </div>
        {layers.map((l) => {
          const Icon = l.icon;
          return (
            <div key={l.label} className="flex items-center gap-3">
              {l.present
                ? <Check className="w-5 h-5 text-success shrink-0" />
                : <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />}
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className={`flex-1 text-sm ${l.present ? '' : 'text-muted-foreground'}`}>{l.label}</span>
              {!l.present && l.action && (
                <Button variant="ghost" size="sm" onClick={l.action}>{l.cta}</Button>
              )}
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground pt-1">
          Resident truth + official context = the complete picture. Help fill it in.
        </p>
      </CardContent>
    </Card>
  );
};
