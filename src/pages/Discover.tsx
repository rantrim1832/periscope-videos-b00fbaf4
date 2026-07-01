import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, TrendingDown, MapPin } from 'lucide-react';
import { getPropertyProvider } from '@/data/propertyProvider';
import { computeTruthScore, CATEGORY_LABELS, CATEGORY_ORDER, scoreColorVar, categoryPct, type CategoryKey } from '@/domain/truthScore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// Discovery (Mode 2): "show me the best/worst apartments." Curated rankings by
// category + location — decision support that's inherently shareable and SEO-rich.
type Metric = 'overall' | CategoryKey;

const Discover = () => {
  useDocumentTitle('Discover the best & worst apartments | Pariscope', 'Ranked by trust-weighted resident experience — best and worst apartments by category and location.');
  const [metric, setMetric] = useState<Metric>('overall');
  const [order, setOrder] = useState<'best' | 'worst'>('best');
  const [state, setState] = useState<string>('all');

  const { data: properties = [] } = useQuery({ queryKey: ['discover-props'], queryFn: () => getPropertyProvider().listSummaries() });

  const states = useMemo(
    () => [...new Set(properties.map((p) => p.state).filter(Boolean))].sort() as string[],
    [properties],
  );

  const ranked = useMemo(() => {
    const rows = properties
      .filter((p) => state === 'all' || p.state === state)
      .map((p) => ({ p, r: computeTruthScore(p.reviews) }))
      .map((x) => ({
        ...x,
        value: metric === 'overall' ? x.r.score : (x.r.categories[metric]?.score ?? null),
      }))
      .filter((x) => x.value != null) as { p: typeof properties[number]; r: ReturnType<typeof computeTruthScore>; value: number }[];
    rows.sort((a, b) => (order === 'best' ? b.value - a.value : a.value - b.value));
    return rows.slice(0, 25);
  }, [properties, metric, order, state]);

  const metricLabel = metric === 'overall' ? 'Truth Score' : CATEGORY_LABELS[metric];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
          {order === 'best' ? <Trophy className="w-7 h-7 text-warning" /> : <TrendingDown className="w-7 h-7 text-destructive" />}
          {order === 'best' ? 'Best' : 'Worst'} for {metricLabel}
          {state !== 'all' ? ` in ${state}` : ''}
        </h1>
        <p className="text-muted-foreground mb-6">Ranked by trust-weighted resident experience.</p>

        <div className="flex flex-wrap gap-2 mb-6">
          <Select value={metric} onValueChange={(v) => setMetric(v as Metric)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall Truth Score</SelectItem>
              {CATEGORY_ORDER.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All states" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button size="sm" variant={order === 'best' ? 'default' : 'outline'} onClick={() => setOrder('best')}>Best</Button>
            <Button size="sm" variant={order === 'worst' ? 'default' : 'outline'} onClick={() => setOrder('worst')}>Worst</Button>
          </div>
        </div>

        {ranked.length === 0 ? (
          <Card className="p-10 text-center bg-muted/30 border-dashed">
            <MapPin className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Not enough scored properties yet for this ranking.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {ranked.map((row, i) => {
              const isOverall = metric === 'overall';
              const displayVal = isOverall ? row.value : row.value.toFixed(1);
              const color = scoreColorVar(isOverall ? row.value : row.value * 20);
              return (
                <Link key={row.p.id} to={`/property/${row.p.id}`} className="block">
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <span className="text-lg font-bold text-muted-foreground w-8 text-center">{i + 1}</span>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0" style={{ border: `3px solid ${color}`, color }}>
                        {displayVal}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{row.p.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{[row.p.city, row.p.state].filter(Boolean).join(', ')}</p>
                      </div>
                      {!isOverall && (
                        <div className="hidden sm:block w-28">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${categoryPct(row.value)}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      )}
                      <Badge variant="outline" className="shrink-0">{row.r.verifiedResidentCount} verified</Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
