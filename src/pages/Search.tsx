import { useState } from 'react';
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

const cardImage = (p: PropertyView) =>
  p.officialChannels?.find((c) => c.kind === 'gallery' && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(c.url))?.url;

const visualCount = (p: PropertyView) =>
  p.officialChannels?.filter((c) => ['gallery', 'matterport', 'instagram', 'tiktok', 'youtube'].includes(c.kind)).length ?? 0;

const Search = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [input, setInput] = useState(q);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => getPropertyProvider().search(q),
    enabled: q.trim().length > 0,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(input.trim() ? { q: input.trim() } : {});
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <form onSubmit={submit} className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              autoFocus
              placeholder="Search by property name, address, or city…"
              className="pl-10 h-12"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="hero" size="lg">Search</Button>
        </form>

        {!q ? (
          <p className="text-muted-foreground text-center py-16">
            Search any apartment in America to see its Truth Score.
          </p>
        ) : isLoading ? (
          <p className="text-muted-foreground">Searching…</p>
        ) : results.length === 0 ? (
          <Card className="p-10 text-center bg-muted/30 border-dashed">
            <MapPin className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h2 className="text-xl font-semibold mb-2">No match for “{q}”</h2>
            <p className="text-muted-foreground mb-4">
              It may not be in our graph yet — you can add it and be the first to review it.
            </p>
            <Button variant="hero" asChild><a href="/contribute">Add this property</a></Button>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{results.length} result{results.length === 1 ? '' : 's'} for “{q}”</p>
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
