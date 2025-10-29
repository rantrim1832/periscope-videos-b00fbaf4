import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, MapPin, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

const MAJOR_CA_CITIES = [
  "Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", 
  "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim",
  "Santa Ana", "Riverside", "Stockton", "Irvine", "Chula Vista",
  "Fremont", "San Bernardino", "Modesto", "Fontana", "Oxnard",
  "Moreno Valley", "Huntington Beach", "Glendale", "Santa Clarita", "Garden Grove",
  "Pasadena", "Pomona", "Torrance", "Escondido", "Sunnyvale"
];

interface CityEstimate {
  city: string;
  totalUnits: number;
  estimatedBuildings: number;
  error?: string;
}

const PropertyScraper = () => {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cityEstimates, setCityEstimates] = useState<CityEstimate[]>([]);
  const [isEstimating, setIsEstimating] = useState(false);
  const { toast } = useToast();

  const handleEstimateCities = async () => {
    if (state !== "CA") {
      toast({
        title: "Not Available",
        description: "City estimation is currently only available for California",
        variant: "destructive",
      });
      return;
    }

    setIsEstimating(true);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-scrape', {
        body: { cities: MAJOR_CA_CITIES, state: "CA" }
      });

      if (error) throw error;
      
      setCityEstimates(data.estimates.sort((a: CityEstimate, b: CityEstimate) => b.totalUnits - a.totalUnits));
      toast({
        title: "Estimation Complete",
        description: `Fetched estimates for ${MAJOR_CA_CITIES.length} cities`,
      });
    } catch (error) {
      console.error('Error estimating cities:', error);
      toast({
        title: "Estimation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEstimating(false);
    }
  };

  const handleDeleteState = async () => {
    if (!state) {
      toast({
        title: "No State Selected",
        description: "Please select a state first",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      `⚠️ WARNING: This will permanently delete ALL properties from ${state}.\n\nAre you absolutely sure?`
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-properties', {
        body: { state }
      });

      if (error) throw error;

      toast({
        title: "Deletion Complete",
        description: data.message,
      });
    } catch (error) {
      console.error('Error deleting properties:', error);
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCitySelection = (cityName: string) => {
    setSelectedCities(prev =>
      prev.includes(cityName)
        ? prev.filter(c => c !== cityName)
        : [...prev, cityName]
    );
  };

  const getSelectedTotal = () => {
    return cityEstimates
      .filter(est => selectedCities.includes(est.city))
      .reduce((sum, est) => sum + est.totalUnits, 0);
  };

  const handleScrapeSelected = async () => {
    if (selectedCities.length === 0) {
      toast({
        title: "No Cities Selected",
        description: "Please select at least one city to scrape",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setBatchProgress({ current: 0, total: selectedCities.length });
    
    let totalInserted = 0;
    let totalSkipped = 0;
    const allErrors: any[] = [];

    try {
      for (let i = 0; i < selectedCities.length; i++) {
        const city = selectedCities[i];
        setBatchProgress({ current: i + 1, total: selectedCities.length });
        
        try {
          const { data, error } = await supabase.functions.invoke('scrape-properties', {
            body: { city, state: "CA", limit: 500, minUnits: 50 }
          });

          if (error) throw error;
          
          totalInserted += data.inserted || 0;
          totalSkipped += data.skipped || 0;
          if (data.errors) allErrors.push(...data.errors);

          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error scraping ${city}:`, error);
          allErrors.push({ address: city, error: error.message });
        }
      }

      setResult({
        totalUnits: 'N/A',
        totalBuildings: 'N/A',
        qualifiedBuildings: 'N/A',
        inserted: totalInserted,
        skipped: totalSkipped,
        errors: allErrors.slice(0, 20),
      });

      toast({
        title: "Scraping Complete",
        description: `Scraped ${selectedCities.length} cities, inserted ${totalInserted} buildings`,
      });
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: "Scraping Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setBatchProgress(null);
    }
  };

  const handleScrape = async () => {
    if (!state) {
      toast({
        title: "Missing Information",
        description: "Please select a state",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-properties', {
        body: { city: city || undefined, state, limit: 500, minUnits: 50 }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Scraping Complete",
        description: `Successfully scraped ${data.inserted} buildings with 50+ units`,
      });
    } catch (error) {
      console.error('Error scraping properties:', error);
      toast({
        title: "Scraping Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchScrape = async () => {
    if (state !== "CA") {
      toast({
        title: "Not Available",
        description: "Batch scraping is currently only available for California",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setBatchProgress({ current: 0, total: MAJOR_CA_CITIES.length });
    
    let totalInserted = 0;
    let totalSkipped = 0;
    const allErrors: any[] = [];

    try {
      for (let i = 0; i < MAJOR_CA_CITIES.length; i++) {
        const city = MAJOR_CA_CITIES[i];
        setBatchProgress({ current: i + 1, total: MAJOR_CA_CITIES.length });
        
        try {
          const { data, error } = await supabase.functions.invoke('scrape-properties', {
            body: { city, state: "CA", limit: 500, minUnits: 50 }
          });

          if (error) throw error;
          
          totalInserted += data.inserted || 0;
          totalSkipped += data.skipped || 0;
          if (data.errors) allErrors.push(...data.errors);

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error scraping ${city}:`, error);
          allErrors.push({ address: city, error: error.message });
        }
      }

      setResult({
        totalUnits: 'N/A',
        totalBuildings: 'N/A',
        qualifiedBuildings: 'N/A',
        inserted: totalInserted,
        skipped: totalSkipped,
        errors: allErrors.slice(0, 20),
      });

      toast({
        title: "Batch Scraping Complete",
        description: `Scraped ${MAJOR_CA_CITIES.length} cities, inserted ${totalInserted} buildings`,
      });
    } catch (error) {
      console.error('Batch scraping error:', error);
      toast({
        title: "Batch Scraping Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setBatchProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Property Data Scraper</h1>
            <p className="text-muted-foreground">
              Scrape apartment data from RentCast and populate the database
            </p>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City (Optional)</label>
                  <Input
                    placeholder="e.g., Austin (leave empty for entire state)"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">State *</label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleScrape} 
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading && !batchProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Scrape Single Location
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handleDeleteState}
                  disabled={isLoading || !state}
                  variant="destructive"
                  size="lg"
                >
                  Delete All {state || "State"} Properties
                </Button>
              </div>

              {state === "CA" && (
                <Button 
                  onClick={handleBatchScrape} 
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                  variant="secondary"
                >
                  {batchProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scraping {batchProgress.current}/{batchProgress.total} cities...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Batch Scrape All Major CA Cities ({MAJOR_CA_CITIES.length} cities)
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>

          {state === "CA" && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Smart City Selection</h2>
                  <Button 
                    onClick={handleEstimateCities}
                    disabled={isEstimating || isLoading}
                    variant="outline"
                  >
                    {isEstimating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Estimating...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-4 w-4" />
                        Estimate All Cities
                      </>
                    )}
                  </Button>
                </div>

                {cityEstimates.length > 0 && (
                  <>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{selectedCities.length}</div>
                          <div className="text-sm text-muted-foreground">Cities Selected</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{getSelectedTotal()}</div>
                          <div className="text-sm text-muted-foreground">Est. Total Units</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round(getSelectedTotal() / 50)}
                          </div>
                          <div className="text-sm text-muted-foreground">Est. Buildings</div>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
                        {cityEstimates.map((estimate) => (
                          <div 
                            key={estimate.city}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                            onClick={() => toggleCitySelection(estimate.city)}
                          >
                            <Checkbox 
                              checked={selectedCities.includes(estimate.city)}
                              onCheckedChange={() => toggleCitySelection(estimate.city)}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{estimate.city}</div>
                              <div className="text-sm text-muted-foreground">
                                ~{estimate.totalUnits} units ({estimate.estimatedBuildings} buildings)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={handleScrapeSelected}
                      disabled={isLoading || selectedCities.length === 0}
                      className="w-full"
                      size="lg"
                    >
                      {batchProgress ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scraping {batchProgress.current}/{batchProgress.total} cities...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Scrape Selected Cities ({selectedCities.length})
                        </>
                      )}
                    </Button>
                  </>
                )}

                {cityEstimates.length === 0 && !isEstimating && (
                  <div className="text-center py-8 text-muted-foreground">
                    Click "Estimate All Cities" to see available data for each city
                  </div>
                )}
              </div>
            </Card>
          )}

          {result && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Scraping Results</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {result.totalUnits !== 'N/A' && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-primary">{result.totalUnits}</div>
                    <div className="text-sm text-muted-foreground">Total Units</div>
                  </div>
                )}
                {result.totalBuildings !== 'N/A' && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{result.totalBuildings}</div>
                    <div className="text-sm text-muted-foreground">Buildings Found</div>
                  </div>
                )}
                {result.qualifiedBuildings !== 'N/A' && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{result.qualifiedBuildings}</div>
                    <div className="text-sm text-muted-foreground">50+ Units</div>
                  </div>
                )}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{result.inserted}</div>
                  <div className="text-sm text-muted-foreground">Inserted</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">{result.skipped}</div>
                  <div className="text-sm text-muted-foreground">Skipped (Duplicates)</div>
                </div>
              </div>
              
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-destructive mb-2">Errors ({result.errors.length})</h3>
                  <div className="bg-destructive/10 p-4 rounded-lg text-sm space-y-1">
                    {result.errors.map((err: any, i: number) => (
                      <div key={i}>
                        <span className="font-medium">{err.address}:</span> {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card className="p-6 bg-muted/50">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold">Quick Start Guide</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Only scrapes apartment buildings with 50+ units</li>
                  <li>• Individual units are aggregated into buildings</li>
                  <li>• Select a state and optionally a city, or use batch mode for California</li>
                  <li>• The API fetches up to 500 units per request, then aggregates by building</li>
                  <li>• Duplicate buildings are automatically skipped</li>
                  <li>• Batch mode scrapes all major CA cities automatically</li>
                  <li>• All properties are automatically approved and ready for reviews</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PropertyScraper;