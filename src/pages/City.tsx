import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Trophy, TrendingDown, Play, PenLine, Share2 } from 'lucide-react';
import { getPropertyProvider } from '@/data/propertyProvider';
import { computeTruthScore, scoreColorVar } from '@/domain/truthScore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { shareContent } from '@/lib/share';
import { useToast } from '@/hooks/use-toast';
import { WatchButton } from '@/components/property/WatchButton';
import { PropertyCard } from '@/components/PropertyCard';
import type { PropertyView } from '@/domain/property';

const cardImage = (p: PropertyView) =>
  p.officialChannels?.find((c) => c.kind === 'gallery' && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(c.url))?.url;

const visualCount = (p: PropertyView) =>
  p.officialChannels?.filter((c) => ['gallery', 'matterport', 'instagram', 'tiktok', 'youtube'].includes(c.kind)).length ?? 0;

// City landing page — an indexable, shareable local hub tying together the
  // City's properties, scored resident context, and local official/public content.
const City = () => {
  const { state = '', city = '' } = useParams();
  const cityName = decodeURIComponent(city);
  const stateName = decodeURIComponent(state);
  useDocumentTitle(
    `Apartments in ${cityName}, ${stateName} — Reviews & Truth Scores | Periscope`,
    `Verified resident reviews, video proof, and Truth Scores for apartments in ${cityName}, ${stateName}.`,
  );

  const { toast } = useToast();
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['city', stateName, cityName],
    queryFn: () => getPropertyProvider().listByLocation(stateName, cityName),
  });
  const { data: feed = [] } = useQuery({ queryKey: ['city-feed', cityName], queryFn: () => getPropertyProvider().feed() });

  const scored = useMemo(
    () => properties.map((p) => ({ p, r: computeTruthScore(p.reviews) })).filter((x) => x.r.score != null)
      .sort((a, b) => (b.r.score ?? 0) - (a.r.score ?? 0)),
    [properties],
  );
  const best = scored.slice(0, 3);
  const worst = [...scored].reverse().slice(0, 3);
  const localFeed = feed.filter((f) => f.location?.toLowerCase().includes(cityName.toLowerCase())).slice(0, 8);

  return (
    <div className="min-h-screen bg-background pb-16">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link to="/browse" className="hover:text-primary">Browse</Link> /
          <span>{stateName}</span> /
          <span className="text-foreground font-medium">{cityName}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-4xl font-bold flex items-center gap-2"><MapPin className="w-8 h-8 text-primary" /> Apartments in {cityName}, {stateName}</h1>
          <div className="flex gap-2 shrink-0 mt-1">
            <WatchButton type="city" id={`${stateName}|${cityName}`} label={`${cityName}, ${stateName}`} size="sm" />
            <Button variant="outline" size="sm" onClick={async () => {
              const res = await shareContent({ title: `Apartments in ${cityName}`, text: `Apartment context for ${cityName}, ${stateName} on Periscope` });
              if (res === 'copied') toast({ title: 'Link copied' });
            }}><Share2 className="w-4 h-4 mr-2" /> Share</Button>
          </div>
        </div>
        <p className="text-muted-foreground mt-2 mb-8">{properties.length} communities · official sources, resident experiences, and visual context.</p>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-10">
            {best.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Trophy className="w-6 h-6 text-warning" /> Highest rated in {cityName}</h2>
                <RankRow rows={best} />
              </section>
            )}
            {worst.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><TrendingDown className="w-6 h-6 text-destructive" /> Residents warn about</h2>
                <RankRow rows={worst} />
              </section>
            )}
            {localFeed.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Local reality</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {localFeed.map((f) => (
                    <Link key={f.id} to={`/property/${f.propertyId}`} className="shrink-0 w-40">
                      <Card className="overflow-hidden group hover:shadow-lg transition-all">
                        <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          {f.thumbnailUrl ? <img src={f.thumbnailUrl} alt={f.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" /> : <Play className="w-8 h-8 text-foreground/70" />}
                          <div className="absolute inset-0 bg-black/20" />
                          {f.category && <Badge className="absolute top-2 left-2 bg-black/50 text-white border-0 text-[10px]">{f.category}</Badge>}
                        </div>
                        <CardContent className="p-2"><p className="text-xs font-medium line-clamp-2">{f.title}</p></CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {properties.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">All communities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties.map((p) => (
                    <PropertyCard
                      key={p.id}
                      name={p.name}
                      address={p.addressLine1 ?? ''}
                      city={p.city ?? ''}
                      state={p.state ?? ''}
                      rating={0}
                      reviewCount={0}
                      videoCount={visualCount(p)}
                      imageUrl={cardImage(p)}
                      propertyId={p.id}
                  units={p.unitsCount}
                  to={`/property/${p.id}`}
                    />
                  ))}
                </div>
              </section>
            )}

            {properties.length === 0 && (
              <Card className="p-10 text-center bg-muted/30 border-dashed">
                <p className="text-muted-foreground mb-4">No communities listed in {cityName} yet.</p>
                <Button variant="hero" asChild><Link to="/contribute">Add the first one</Link></Button>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-4 inset-x-0 z-30 flex justify-center pointer-events-none">
        <Button variant="hero" className="pointer-events-auto shadow-lg" asChild>
          <Link to="/contribute"><PenLine className="w-4 h-4 mr-2" /> Add a review</Link>
        </Button>
      </div>
    </div>
  );
};

const RankRow = ({ rows }: { rows: { p: { id: string; name: string; city: string | null; state: string | null }; r: ReturnType<typeof computeTruthScore> }[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {rows.map(({ p, r }) => (
      <Link key={p.id} to={`/property/${p.id}`}>
        <Card className="hover:shadow-lg transition-all h-full">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ border: `3px solid ${scoreColorVar(r.score)}`, color: scoreColorVar(r.score) }}>{r.score}</div>
            <div className="min-w-0"><p className="font-semibold truncate">{p.name}</p><p className="text-xs text-muted-foreground">{r.verifiedResidentCount} verified · {r.reviewCount} reviews</p></div>
          </CardContent>
        </Card>
      </Link>
    ))}
  </div>
);

export default City;
