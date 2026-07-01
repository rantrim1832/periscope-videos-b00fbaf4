import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, ShieldCheck, Building2, MapPin } from 'lucide-react';
import type { MediaItem, PropertyView } from '@/domain/property';
import { EvidenceViewer } from './EvidenceViewer';

// Two truths, always labeled, never merged: Resident Reality vs Official.
const MediaCard = ({ item, onPlay }: { item: MediaItem; onPlay: (m: MediaItem) => void }) => (
  <Card onClick={() => onPlay(item)} className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all border-border/50">
    <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
      <Play className="w-10 h-10 text-foreground/70 group-hover:scale-110 transition-transform" />
      <div className="absolute top-2 left-2 flex gap-1">
        {item.source === 'official'
          ? <Badge variant="secondary" className="gap-1"><Building2 className="w-3 h-3" /> Official</Badge>
          : <Badge variant="success" className="gap-1"><ShieldCheck className="w-3 h-3" /> Resident</Badge>}
      </div>
      {item.isPositive === false && (
        <div className="absolute top-2 right-2"><Badge variant="destructive">⚠</Badge></div>
      )}
    </div>
    <CardContent className="p-3 space-y-1">
      <p className="text-sm font-medium line-clamp-2">{item.title}</p>
      {item.city && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" /> {item.city}</p>
      )}
    </CardContent>
  </Card>
);

export const EvidenceFeed = ({ property }: { property: PropertyView }) => {
  const resident = property.media.filter((m) => m.source !== 'official');
  const official = property.media.filter((m) => m.source === 'official');
  const [active, setActive] = useState<MediaItem | null>(null);

  if (property.media.length === 0) {
    return (
      <section id="evidence" className="container mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-2">The evidence</h2>
        <Card className="p-8 text-center bg-muted/30 border-dashed">
          <p className="text-muted-foreground">
            No videos yet. A single clip is worth a thousand reviews — post the first one.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section id="evidence" className="container mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-1">The evidence</h2>
      <p className="text-muted-foreground mb-6">What residents show vs. what the property shows.</p>
      <Tabs defaultValue="resident">
        <TabsList className="mb-6">
          <TabsTrigger value="resident">Resident Reality ({resident.length})</TabsTrigger>
          <TabsTrigger value="official">Official ({official.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="resident">
          <Grid items={resident} empty="No resident videos yet — be the first." onPlay={setActive} />
        </TabsContent>
        <TabsContent value="official">
          <Grid items={official} empty="This property hasn't posted official content. Own it? Claim to respond." onPlay={setActive} />
        </TabsContent>
      </Tabs>
      <EvidenceViewer item={active} open={active != null} onOpenChange={(o) => !o && setActive(null)} />
    </section>
  );
};

const Grid = ({ items, empty, onPlay }: { items: MediaItem[]; empty: string; onPlay: (m: MediaItem) => void }) =>
  items.length === 0 ? (
    <p className="text-sm text-muted-foreground py-6">{empty}</p>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((m) => <MediaCard key={m.id} item={m} onPlay={onPlay} />)}
    </div>
  );
