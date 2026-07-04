import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyCard } from "@/components/PropertyCard";
import { MapPin, ChevronRight, Search, Building2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { getPropertyProvider, type LocationCount } from "@/data/propertyProvider";
import type { PropertyView } from "@/domain/property";

const cardImage = (p: PropertyView) =>
  p.officialChannels?.find((c) => c.kind === 'gallery' && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(c.url))?.url;

const visualCount = (p: PropertyView) =>
  p.officialChannels?.filter((c) => ['gallery', 'matterport', 'instagram', 'tiktok', 'youtube'].includes(c.kind)).length ?? 0;

const Browse = () => {
  const [view, setView] = useState<"states" | "cities" | "properties">("states");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [states, setStates] = useState<LocationCount[]>([]);
  const [cities, setCities] = useState<LocationCount[]>([]);
  const [properties, setProperties] = useState<PropertyView[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleCityClick = async (city: string) => {
    setSelectedCity(city);
    setView("properties");
    setSearchQuery("");
    setIsLoading(true);
    setProperties(await getPropertyProvider().listByLocation(selectedState, city));
    setIsLoading(false);
  };

  const handleBack = () => {
    if (view === "cities") { setView("states"); setSelectedState(""); setCities([]); }
    else if (view === "properties") { setView("cities"); setSelectedCity(""); setProperties([]); }
  };

  const filteredStates = states.filter((s) => s.state?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCities = cities.filter((c) => c.city?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 md:py-10">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <button onClick={() => { setView("states"); setSelectedState(""); setSelectedCity(""); }} className="hover:text-primary transition-colors">All states</button>
            {selectedState && (<><ChevronRight className="h-4 w-4" /><button onClick={() => { setView("cities"); setSelectedCity(""); }} className="hover:text-primary transition-colors">{selectedState}</button></>)}
            {selectedCity && (<><ChevronRight className="h-4 w-4" /><span className="text-foreground font-medium">{selectedCity}</span></>)}
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-balance">
                  {view === "states" && "Browse properties by location"}
                  {view === "cities" && `Cities in ${selectedState}`}
                  {view === "properties" && `Properties in ${selectedCity}, ${selectedState}`}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1.5">
                  {view === "states" && "Choose a state to explore apartment communities."}
                  {view === "cities" && "Choose a city to view properties."}
                  {view === "properties" && "Open a property to see its Truth Score."}
                </p>
              </div>
              {view !== "states" && <Button variant="outline" size="sm" onClick={handleBack}>Back</Button>}
            </div>

            {view !== "properties" && (
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder={view === "states" ? "Filter states…" : "Filter cities…"} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11" />
              </div>
            )}
          </div>

          {view === "states" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredStates.map((s) => (
                <Card key={s.state} className="p-5 shadow-card hover:shadow-card-hover hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer group border-border/60" onClick={() => handleStateClick(s.state!)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-lg group-hover:bg-primary/15 transition-colors"><MapPin className="h-5 w-5 text-primary" /></div>
                      <div>
                        <h3 className="font-semibold text-base">{s.state}</h3>
                        <p className="text-xs text-muted-foreground">{s.count.toLocaleString()} propert{s.count === 1 ? 'y' : 'ies'}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Card>
              ))}
            </div>
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

          {view === "properties" && (
            <div className="mb-4">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/city/${encodeURIComponent(selectedState)}/${encodeURIComponent(selectedCity)}`}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Open {selectedCity} city page
                </Link>
              </Button>
            </div>
          )}
          {view === "properties" && (
            properties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    to={`/property/${p.id}`}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No properties listed here yet</h3>
                <p className="text-muted-foreground">Try another city, or add a property to be the first to review it.</p>
              </Card>
            )
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
