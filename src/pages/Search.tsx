import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PropertyCard } from '@/components/PropertyCard';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search as SearchIcon, MapPin, Building2, X } from 'lucide-react';
import { getPropertyProvider, type LocationCount } from '@/data/propertyProvider';
import type { PropertyView } from '@/domain/property';
import { getStoredLocalCity } from '@/lib/localDiscovery';
import { TOP_CITIES } from '@/data/topCities';

const cardImage = (p: PropertyView) =>
  p.officialChannels?.find((c) => c.kind === 'gallery' && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(c.url))?.url;

const visualCount = (p: PropertyView) =>
  p.officialChannels?.filter((c) => ['gallery', 'matterport', 'instagram', 'tiktok', 'youtube'].includes(c.kind)).length ?? 0;

// Debounce hook for autofill typing.
function useDebounced<T>(value: T, ms = 150): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const Search = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const initialState = params.get('state') ?? '';
  const initialCity = params.get('city') ?? '';
  const stored = getStoredLocalCity();
  const navigate = useNavigate();
  const [input, setInput] = useState(q || (stored ? stored.label : ''));
  const [stateFilter, setStateFilter] = useState<string>(initialState);
  const [cityFilter, setCityFilter] = useState<string>(initialCity);
  const [focused, setFocused] = useState(false);
  const debouncedInput = useDebounced(input, 150);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (q) setInput(q);
  }, [q]);

  // States + cities for the cascading filters.
  const { data: states = [] } = useQuery({
    queryKey: ['states'],
    queryFn: () => getPropertyProvider().listStates(),
    staleTime: 60 * 60 * 1000,
  });
  const { data: citiesForState = [] } = useQuery({
    queryKey: ['cities', stateFilter],
    queryFn: () => getPropertyProvider().listCities(stateFilter),
    enabled: !!stateFilter,
    staleTime: 60 * 60 * 1000,
  });

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', q, initialState, initialCity],
    queryFn: async () => {
      const all = await getPropertyProvider().search(q);
      return all.filter((p) =>
        (!initialState || p.state === initialState) &&
        (!initialCity || p.city === initialCity),
      );
    },
    enabled: q.trim().length > 0 || !!initialState || !!initialCity,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // Autofill suggestions — property matches (live), city matches, state matches.
  const { data: liveMatches = [] } = useQuery({
    queryKey: ['autofill', debouncedInput, stateFilter, cityFilter],
    queryFn: async () => {
      const all = await getPropertyProvider().search(debouncedInput);
      return all
        .filter((p) =>
          (!stateFilter || p.state === stateFilter) &&
          (!cityFilter || p.city === cityFilter),
        )
        .slice(0, 6);
    },
    enabled: debouncedInput.trim().length >= 2,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const suggestions = useMemo(() => {
    const term = debouncedInput.trim().toLowerCase();
    if (term.length < 2) return { properties: [], cities: [], states: [] as LocationCount[] };
    const cityPool = [
      ...TOP_CITIES.map((c) => ({ city: c.city, state: c.state })),
      ...citiesForState.map((c) => ({ city: c.city!, state: stateFilter })),
    ];
    const seenCity = new Set<string>();
    const cities = cityPool
      .filter((c) => c.city.toLowerCase().includes(term))
      .filter((c) => {
        const k = `${c.state}-${c.city}`;
        if (seenCity.has(k)) return false;
        seenCity.add(k);
        return true;
      })
      .slice(0, 5);
    const stateMatches = states
      .filter((s) => s.state?.toLowerCase().includes(term))
      .slice(0, 3);
    return { properties: liveMatches, cities, states: stateMatches };
  }, [debouncedInput, liveMatches, citiesForState, stateFilter, states]);

  const totalSuggestions = suggestions.properties.length + suggestions.cities.length + suggestions.states.length;
  const showDropdown = focused && debouncedInput.trim().length >= 2 && totalSuggestions > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (input.trim()) next.q = input.trim();
    if (stateFilter) next.state = stateFilter;
    if (cityFilter) next.city = cityFilter;
    setParams(next);
    setFocused(false);
  };

  const clearFilters = () => {
    setStateFilter('');
    setCityFilter('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Search</h1>
          <p className="text-sm text-muted-foreground mt-1">Look up any apartment, address, or city.</p>
        </div>

        <form onSubmit={submit} className="mb-8 space-y-3">
          {/* Cascading state / city filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={stateFilter || 'all'} onValueChange={(v) => { setStateFilter(v === 'all' ? '' : v); setCityFilter(''); }}>
              <SelectTrigger className="w-full sm:w-[180px] h-10"><SelectValue placeholder="All states" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All states</SelectItem>
                {states.map((s) => (
                  <SelectItem key={s.state} value={s.state!}>{s.state} · {s.count.toLocaleString()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cityFilter || 'all'} onValueChange={(v) => setCityFilter(v === 'all' ? '' : v)} disabled={!stateFilter}>
              <SelectTrigger className="w-full sm:w-[220px] h-10"><SelectValue placeholder={stateFilter ? 'All cities' : 'Pick a state first'} /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All cities</SelectItem>
                {citiesForState.map((c) => (
                  <SelectItem key={c.city} value={c.city!}>{c.city} · {c.count.toLocaleString()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(stateFilter || cityFilter) && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>

          {/* Text input with autofill popover */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                ref={inputRef}
                autoFocus
                placeholder="Property name, address, city, or state…"
                className="pl-10 h-12"
                value={input}
                onChange={(e) => { setInput(e.target.value); setFocused(true); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                aria-autocomplete="list"
                aria-expanded={showDropdown}
              />
              {showDropdown && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 rounded-lg border border-border bg-popover shadow-elevated overflow-hidden">
                  {suggestions.properties.length > 0 && (
                    <SuggestGroup label="Properties">
                      {suggestions.properties.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted flex items-start gap-2"
                          onMouseDown={(e) => { e.preventDefault(); navigate(`/property/${p.id}`); }}
                        >
                          <Building2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[p.addressLine1, p.city, p.state].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </SuggestGroup>
                  )}
                  {suggestions.cities.length > 0 && (
                    <SuggestGroup label="Cities">
                      {suggestions.cities.map((c) => (
                        <button
                          key={`${c.state}-${c.city}`}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                          onMouseDown={(e) => { e.preventDefault(); navigate(`/city/${encodeURIComponent(c.state)}/${encodeURIComponent(c.city)}`); }}
                        >
                          <MapPin className="h-4 w-4 text-secondary shrink-0" />
                          <span className="text-sm">{c.city}, <span className="text-muted-foreground">{c.state}</span></span>
                        </button>
                      ))}
                    </SuggestGroup>
                  )}
                  {suggestions.states.length > 0 && (
                    <SuggestGroup label="States">
                      {suggestions.states.map((s) => (
                        <button
                          key={s.state}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                          onMouseDown={(e) => { e.preventDefault(); setStateFilter(s.state!); setCityFilter(''); setInput(''); inputRef.current?.focus(); }}
                        >
                          <MapPin className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm">{s.state} <span className="text-muted-foreground">· {s.count.toLocaleString()} properties</span></span>
                        </button>
                      ))}
                    </SuggestGroup>
                  )}
                </div>
              )}
            </div>
            <Button type="submit" variant="hero" size="lg">Search</Button>
          </div>
        </form>

        {!q && !initialState && !initialCity ? (
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <SearchIcon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Search for a property</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Search by property name, address, city, or state. Or narrow with the filters above.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {TOP_CITIES.slice(0, 10).map((c) => (
                <Button
                  key={`${c.state}-${c.city}`}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/city/${encodeURIComponent(c.state)}/${encodeURIComponent(c.city)}`)}
                >
                  {c.city}, {c.state}
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
            <h2 className="text-xl font-semibold mb-2">
              {q
                ? <>No match for &ldquo;{q}&rdquo;</>
                : <>No properties in {[initialCity, initialState].filter(Boolean).join(', ') || 'that area'}</>}
            </h2>
            <p className="text-muted-foreground mb-4">
              {q
                ? "This property isn't in our database. You can add it."
                : "We don't have any listings here yet. Try broadening the filters or add a property."}
            </p>
            <Button variant="hero" asChild><a href="/contribute">Add this property</a></Button>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-medium text-foreground">{results.length}</span> result{results.length === 1 ? '' : 's'}
              {q ? <> for &ldquo;{q}&rdquo;</> : null}
              {(initialCity || initialState) ? <> in {[initialCity, initialState].filter(Boolean).join(', ')}</> : null}
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

const SuggestGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="border-b border-border/60 last:border-b-0">
    <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
    {children}
  </div>
);

export default Search;
