import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PropertyCard } from '@/components/PropertyCard';
import { Search as SearchIcon, MapPin } from 'lucide-react';
import { getPropertyProvider } from '@/data/propertyProvider';
import type { PropertyView } from '@/domain/property';
import { getStoredLocalCity, SEEDED_CITIES } from '@/lib/localDiscovery';

const cardImage = (p: PropertyView) =>
  p.officialChannels?.find((c) => c.kind === 'gallery' && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(c.url))?.url;

const visualCount = (p: PropertyView) =>
  p.officialChannels?.filter((c) => ['gallery', 'matterport', 'instagram', 'tiktok', 'youtube'].includes(c.kind)).length ?? 0;

const Search = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const stored = getStoredLocalCity();
  // Prefill: URL query > stored local city > empty
  const [input, setInput] = useState(q || (stored ? stored.label : ''));

  useEffect(() => {
    // Keep the input in sync when navigating between /search?q=… states.
    if (q) setInput(q);
  }, [q]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => getPropertyProvider().search(q),
    enabled: q.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(input.trim() ? { q: input.trim() } : {});
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Search</h1>
          <p className="text-sm text-muted-foreground mt-1">Look up any apartment, address, or city.</p>
        </div>
        <form onSubmit={submit} className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              autoFocus
              placeholder="Property name, address, or city…"
              className="pl-10 h-12"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="hero" size="lg">Search</Button>
        </form>

        {!q ? (
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <SearchIcon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Search for a property</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Search by property name, address, or city.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SEEDED_CITIES.slice(0, 8).map((c) => (
                <Button
                  key={c.label}
                  variant="outline"
                  size="sm"
                  onClick={() => { setInput(c.label); setParams({ q: c.label }); }}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            <span className="text-sm">Searching…</span>
          </div>
        ) : results.length === 0 ? (
          <Card className="p-10 text-center bg-muted/30 border-dashed">
            <MapPin className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h2 className="text-xl font-semibold mb-2">No match for &ldquo;{q}&rdquo;</h2>
            <p className="text-muted-foreground mb-4">
              This property isn't in our database. You can add it.
            </p>
            <Button variant="hero" asChild><a href="/contribute">Add this property</a></Button>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-medium text-foreground">{results.length}</span> result{results.length === 1 ? '' : 's'} for &ldquo;{q}&rdquo;
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((p) => (
                <PropertyCard
                  key={p.id}
                  name={p.name}
                  address={p.addressLine1 ?? ''}
                  city={p.city ?? ''}
                  state={p.state ?? ''}
                  bedrooms={undefined}
                  bathrooms={undefined}
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
          </>
        )}
      </div>
    </div>
  );
};

export default Search;
