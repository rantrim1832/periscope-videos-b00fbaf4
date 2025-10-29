import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, ChevronRight, Search, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface LocationCount {
  state?: string;
  city?: string;
  count: number;
}

const Browse = () => {
  const [view, setView] = useState<"states" | "cities" | "properties">("states");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [states, setStates] = useState<LocationCount[]>([]);
  const [cities, setCities] = useState<LocationCount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('state');

      if (error) throw error;

      // Count properties per state
      const stateCounts = data.reduce((acc: { [key: string]: number }, prop) => {
        if (prop.state) {
          acc[prop.state] = (acc[prop.state] || 0) + 1;
        }
        return acc;
      }, {});

      const statesList = Object.entries(stateCounts)
        .map(([state, count]) => ({ state, count: count as number }))
        .sort((a, b) => b.count - a.count);

      setStates(statesList);
    } catch (error) {
      console.error('Error loading states:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCities = async (state: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('city')
        .eq('state', state);

      if (error) throw error;

      // Count properties per city
      const cityCounts = data.reduce((acc: { [key: string]: number }, prop) => {
        if (prop.city) {
          acc[prop.city] = (acc[prop.city] || 0) + 1;
        }
        return acc;
      }, {});

      const citiesList = Object.entries(cityCounts)
        .map(([city, count]) => ({ city, count: count as number }))
        .sort((a, b) => b.count - a.count);

      setCities(citiesList);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateClick = (state: string) => {
    setSelectedState(state);
    setView("cities");
    loadCities(state);
  };

  const handleCityClick = (city: string) => {
    setSelectedCity(city);
    setView("properties");
  };

  const handleBack = () => {
    if (view === "cities") {
      setView("states");
      setSelectedState("");
      setCities([]);
    } else if (view === "properties") {
      setView("cities");
      setSelectedCity("");
    }
  };

  const filteredStates = states.filter(s => 
    s.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCities = cities.filter(c => 
    c.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => {
                setView("states");
                setSelectedState("");
                setSelectedCity("");
              }}
              className="hover:text-primary transition-colors"
            >
              All States
            </button>
            {selectedState && (
              <>
                <ChevronRight className="h-4 w-4" />
                <button
                  onClick={() => {
                    setView("cities");
                    setSelectedCity("");
                  }}
                  className="hover:text-primary transition-colors"
                >
                  {selectedState}
                </button>
              </>
            )}
            {selectedCity && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium">{selectedCity}</span>
              </>
            )}
          </div>

          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold">
                  {view === "states" && "Browse Properties by Location"}
                  {view === "cities" && `Cities in ${selectedState}`}
                  {view === "properties" && `Properties in ${selectedCity}, ${selectedState}`}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {view === "states" && "Select a state to explore apartment buildings"}
                  {view === "cities" && "Select a city to view properties"}
                  {view === "properties" && "Browse apartment buildings and reviews"}
                </p>
              </div>
              {view !== "states" && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={
                  view === "states" 
                    ? "Search states..." 
                    : view === "cities"
                    ? "Search cities..."
                    : "Search properties..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* States View */}
          {view === "states" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredStates.map((stateData) => (
                <Card
                  key={stateData.state}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleStateClick(stateData.state!)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{stateData.state}</h3>
                        <p className="text-sm text-muted-foreground">
                          {stateData.count} properties
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Cities View */}
          {view === "cities" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredCities.map((cityData) => (
                <Card
                  key={cityData.city}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleCityClick(cityData.city!)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary/10 p-2 rounded-lg group-hover:bg-secondary/20 transition-colors">
                        <Building2 className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{cityData.city}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cityData.count} properties
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Properties View */}
          {view === "properties" && (
            <Card className="p-8 text-center">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">
                Properties in {selectedCity}, {selectedState}
              </h3>
              <p className="text-muted-foreground mb-6">
                Property listings coming soon. This will show all apartment buildings with reviews.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleBack}>
                  Back to Cities
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/reviews">
                    View Reviews
                  </Link>
                </Button>
              </div>
            </Card>
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
