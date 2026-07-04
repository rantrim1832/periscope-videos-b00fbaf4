import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, ChevronRight, Search, Building2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPropertyProvider, type LocationCount } from "@/data/propertyProvider";
import { getStoredLocalState } from "@/lib/localDiscovery";

// Distinct duotone gradient per state so cards don't look like a spreadsheet.
// Deterministic hash keeps the same state on the same tile every visit.
const STATE_GRADIENTS: [string, string][] = [
  ['from-sky-500/80', 'to-indigo-600/80'],
  ['from-amber-500/80', 'to-rose-600/80'],
  ['from-emerald-500/80', 'to-teal-600/80'],
  ['from-fuchsia-500/80', 'to-purple-700/80'],
  ['from-orange-500/80', 'to-red-600/80'],
  ['from-cyan-500/80', 'to-blue-700/80'],
  ['from-lime-500/80', 'to-emerald-700/80'],
  ['from-pink-500/80', 'to-fuchsia-700/80'],
  ['from-yellow-500/80', 'to-orange-600/80'],
  ['from-violet-500/80', 'to-indigo-700/80'],
  ['from-teal-500/80', 'to-cyan-700/80'],
  ['from-rose-500/80', 'to-pink-700/80'],
];
const gradientFor = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return STATE_GRADIENTS[h % STATE_GRADIENTS.length];
};

const Browse = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"states" | "cities">("states");
  const [selectedState, setSelectedState] = useState<string>("");
  const [states, setStates] = useState<LocationCount[]>([]);
  const [cities, setCities] = useState<LocationCount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const localState = getStoredLocalState();

  useEffect(() => {
    setIsLoading(true);
    getPropertyProvider().listStates().then((s) => setStates(s)).finally(() => setIsLoading(false));
  }, []);

  const handleStateClick = async (state: string) => {
    setSelectedState(state);
    setView("cities");
    setSearchQuery("");
    setIsLoading(true);
    setCities(await getPropertyProvider().listCities(state));
    setIsLoading(false);
  };

  const handleCityClick = (city: string) => {
    // Cities own a dedicated indexable landing page — go there directly instead
    // of rendering a redundant inline list.
    navigate(`/city/${encodeURIComponent(selectedState)}/${encodeURIComponent(city)}`);
  };

  const handleBack = () => {
    setView("states");
    setSelectedState("");
    setCities([]);
  };

  const filteredStates = states.filter((s) => s.state?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCities = cities.filter((c) => c.city?.toLowerCase().includes(searchQuery.toLowerCase()));
  // Float the viewer's home state to the top of the state grid.
  const orderedStates = useMemo(() => {
    if (!localState) return filteredStates;
    const local = filteredStates.filter((s) => s.state === localState);
    const rest = filteredStates.filter((s) => s.state !== localState);
    return [...local, ...rest];
  }, [filteredStates, localState]);
  const localStateRow = states.find((s) => s.state === localState);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 md:py-10">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <button onClick={handleBack} className="hover:text-primary transition-colors">All states</button>
            {selectedState && (<><ChevronRight className="h-4 w-4" /><span className="text-foreground font-medium">{selectedState}</span></>)}
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-balance">
                  {view === "states" && "Browse properties by location"}
                  {view === "cities" && `Cities in ${selectedState}`}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1.5">
                  {view === "states" && "Choose a state to explore apartment communities."}
                  {view === "cities" && "Choose a city to view properties."}
                </p>
              </div>
              {view !== "states" && <Button variant="outline" size="sm" onClick={handleBack}>Back</Button>}
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder={view === "states" ? "Filter states…" : "Filter cities…"} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11" />
            </div>
          </div>

          {view === "states" && (
            <>
              {localState && localStateRow && !searchQuery && (
                <button
                  onClick={() => handleStateClick(localState)}
                  className="w-full text-left group relative overflow-hidden rounded-2xl border border-primary/30 shadow-elevated"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientFor(localState).join(' ')}`} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
                  <div className="relative p-6 md:p-8 flex items-center justify-between gap-6 text-white">
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider bg-white/20 backdrop-blur px-2 py-1 rounded-full mb-2">
                        <Sparkles className="h-3 w-3" /> Your area
                      </span>
                      <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none">{localStateRow.state}</h2>
                      <p className="text-white/85 text-sm md:text-base mt-2">
                        {localStateRow.count.toLocaleString()} propert{localStateRow.count === 1 ? 'y' : 'ies'} in your state
                      </p>
                    </div>
                    <ChevronRight className="h-8 w-8 shrink-0 opacity-80 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {orderedStates.map((s) => {
                  const [g1, g2] = gradientFor(s.state!);
                  const isLocal = s.state === localState;
                  return (
                    <button
                      key={s.state}
                      onClick={() => handleStateClick(s.state!)}
                      className="group relative overflow-hidden rounded-xl aspect-[4/3] shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${g1} ${g2}`} />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_55%)]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      {isLocal && (
                        <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wider bg-white/25 backdrop-blur text-white px-1.5 py-0.5 rounded">You</span>
                      )}
                      <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                        <MapPin className="h-4 w-4 opacity-80" />
                        <div>
                          <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-none">{s.state}</h3>
                          <p className="text-xs text-white/85 mt-1">{s.count.toLocaleString()} propert{s.count === 1 ? 'y' : 'ies'}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {view === "cities" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {filteredCities.map((c) => (
                <Card key={c.city} className="p-5 shadow-card hover:shadow-card-hover hover:border-secondary/40 hover:-translate-y-0.5 transition-all cursor-pointer group border-border/60" onClick={() => handleCityClick(c.city!)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary/10 p-2.5 rounded-lg group-hover:bg-secondary/15 transition-colors"><Building2 className="h-5 w-5 text-secondary" /></div>
                      <div>
                        <h3 className="font-semibold text-base">{c.city}</h3>
                        <p className="text-xs text-muted-foreground">{c.count.toLocaleString()} propert{c.count === 1 ? 'y' : 'ies'}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Browse;
