import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, GitCompareArrows } from 'lucide-react';
import { useCompare } from '@/context/CompareContext';
import { getPropertyProvider } from '@/data/propertyProvider';
import { computeTruthScore, CATEGORY_ORDER, CATEGORY_LABELS, scoreColorVar, categoryPct } from '@/domain/truthScore';
import type { PropertyView } from '@/domain/property';

// Apartment shopping is comparative, not absolute. Side-by-side Truth Scores,
// deposit behavior, management, and category detail — decision support that is
// also inherently shareable.
const Compare = () => {
  const { items, remove, clear } = useCompare();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['compare', items.map((i) => i.id).join(',')],
    queryFn: async () => {
      const provider = getPropertyProvider();
      const loaded = await Promise.all(items.map((i) => provider.getProperty(i.id)));
      return loaded.filter((p): p is PropertyView => p != null);
    },
    enabled: items.length > 0,
  });

  const scored = properties.map((p) => ({ property: p, result: computeTruthScore(p.reviews) }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GitCompareArrows className="w-7 h-7" /> Compare properties
          </h1>
          {items.length > 0 && <Button variant="outline" size="sm" onClick={clear}>Clear all</Button>}
        </div>

        {items.length === 0 ? (
          <Card className="p-10 text-center bg-muted/30 border-dashed">
            <p className="text-muted-foreground mb-4">
              Nothing to compare yet. Add properties with the “Compare” button on any property page.
            </p>
            <Button variant="hero" asChild><Link to="/browse">Browse properties</Link></Button>
          </Card>
        ) : isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid gap-4" style={{ gridTemplateColumns: `10rem repeat(${scored.length}, minmax(12rem, 1fr))` }}>
              {/* Header row: names + scores */}
              <div />
              {scored.map(({ property, result }) => (
                <div key={property.id} className="text-center space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <Link to={`/property/${property.id}`} className="font-semibold hover:text-primary text-left">
                      {property.name}
                    </Link>
                    <button onClick={() => remove(property.id)} aria-label="Remove" className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">{property.city}, {property.state}</p>
                  <div
                    className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{ border: `4px solid ${scoreColorVar(result.score)}`, color: scoreColorVar(result.score) }}
                  >
                    {result.score ?? '—'}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{result.verifiedResidentCount} verified · {result.reviewCount} reviews</p>
                </div>
              ))}

              {/* Category rows */}
              {CATEGORY_ORDER.map((key) => (
                <CompareRow key={key} label={CATEGORY_LABELS[key]} scored={scored} catKey={key} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CompareRow = ({
  label, scored, catKey,
}: {
  label: string;
  catKey: (typeof CATEGORY_ORDER)[number];
  scored: { property: PropertyView; result: ReturnType<typeof computeTruthScore> }[];
}) => {
  const emphasize = catKey === 'depositReturn' || catKey === 'management';
  return (
    <>
      <div className={`text-sm py-2 border-t border-border/40 ${emphasize ? 'font-semibold' : ''}`}>{label}</div>
      {scored.map(({ property, result }) => {
        const cat = result.categories[catKey];
        return (
          <div key={property.id} className="py-2 border-t border-border/40">
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                {cat.score != null && (
                  <div className="h-full rounded-full" style={{ width: `${categoryPct(cat.score)}%`, backgroundColor: scoreColorVar(cat.score * 20) }} />
                )}
              </div>
              <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
                {cat.score != null ? cat.score.toFixed(1) : '—'}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default Compare;
