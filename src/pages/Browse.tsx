import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, ChevronRight, Search, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPropertyProvider, type LocationCount } from "@/data/propertyProvider";
import { getStoredLocalState } from "@/lib/localDiscovery";

// Full state names for a professional directory feel — abbreviations look
// like a spreadsheet dump.
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};
const stateName = (code: string) => STATE_NAMES[code?.toUpperCase()] ?? code;

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
                  className="w-full text-left group relative overflow-hidden rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                >
                  <div className="p-5 md:p-6 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">
                        <MapPin className="h-3 w-3" /> Your state
                      </span>
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight text-foreground">
                        {stateName(localStateRow.state!)}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {localStateRow.count.toLocaleString()} propert{localStateRow.count === 1 ? 'y' : 'ies'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-primary group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {orderedStates.map((s) => {
                  const isLocal = s.state === localState;
                  return (
                    <button
                      key={s.state}
                      onClick={() => handleStateClick(s.state!)}
                      className={`group text-left rounded-lg border bg-card hover:border-primary/50 hover:shadow-card transition-all p-4 ${isLocal ? 'border-primary/40' : 'border-border/60'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base leading-tight truncate">{stateName(s.state!)}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {s.count.toLocaleString()} propert{s.count === 1 ? 'y' : 'ies'}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
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
