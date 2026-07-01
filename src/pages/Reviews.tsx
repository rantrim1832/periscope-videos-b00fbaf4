import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { SeededVideoCard } from "@/components/SeededVideoCard";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, SlidersHorizontal, Smile, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPropertyProvider } from "@/data/propertyProvider";
import type { PropertyView } from "@/domain/property";

interface SeededReview {
  id: string; title: string; video_url: string; caption?: string;
  tags?: string[]; city?: string; is_positive?: boolean;
}
interface PropertySummary {
  id: string; name: string; address: string; city: string; state: string;
  beds?: number; baths?: number;
}

const Reviews = () => {
  const [seededReviews, setSeededReviews] = useState<SeededReview[]>([]);
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [positiveOnly, setPositiveOnly] = useState(false);
  const [totalProperties, setTotalProperties] = useState(0);
  
  // Fetch available states via the property provider (canonical or mock).
  useEffect(() => {
    const fetchLocations = async () => {
      const stateCounts = await getPropertyProvider().listStates();
      setStates(stateCounts.map((s) => s.state!).filter(Boolean).sort());
      setTotalProperties(stateCounts.reduce((sum, s) => sum + s.count, 0));
    };
    fetchLocations();
  }, []);

  // Fetch cities when state changes.
  useEffect(() => {
    const fetchCities = async () => {
      if (selectedState === "all") {
        setCities([]);
        setSelectedCity("all");
        return;
      }
      const cityCounts = await getPropertyProvider().listCities(selectedState);
      setCities(cityCounts.map((c) => c.city!).filter(Boolean).sort());
    };
    fetchCities();
  }, [selectedState]);

  // Fetch properties based on filters via the provider (canonical or mock).
  useEffect(() => {
    const fetchProperties = async () => {
      const provider = getPropertyProvider();
      let result: PropertyView[];
      if (searchQuery.trim()) {
        result = await provider.search(searchQuery);
      } else if (selectedState !== "all" && selectedCity !== "all") {
        result = await provider.listByLocation(selectedState, selectedCity);
      } else if (selectedState !== "all") {
        const cityCounts = await provider.listCities(selectedState);
        const lists = await Promise.all(
          cityCounts.slice(0, 5).map((c) => provider.listByLocation(selectedState, c.city!)),
        );
        result = lists.flat();
      } else {
        result = await provider.listSummaries();
      }
      // Map to the shape the PropertyCard section expects.
      setProperties(result.map((p) => ({
        id: p.id, name: p.name, address: p.addressLine1 ?? '', city: p.city ?? '',
        state: p.state ?? '', beds: undefined, baths: undefined,
      })));
    };
    
    fetchProperties();
  }, [selectedState, selectedCity, searchQuery]);

  useEffect(() => {
    const fetchSeededReviews = async () => {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('source', 'seeded')
        .eq('moderation_status', 'approved');
      
      if (positiveOnly) {
        query = query.eq('is_positive', true);
      }
      
      const { data } = await query
        .order('is_positive', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (data) {
        setSeededReviews(data);
      }
    };
    
    fetchSeededReviews();
  }, [positiveOnly]);

  // Mock user-submitted data - would be fetched from API
  const videos = Array.from({ length: 12 }, (_, i) => ({
    id: String(i + 1),
    thumbnailUrl: "/placeholder.svg",
    title: [
      "Roach infestation in kitchen - avoid at all costs!",
      "Amazing spacious unit with great maintenance",
      "Water damage issues - management not responsive",
      "Perfect for students - close to campus",
      "Noisy neighbors every night",
      "Beautiful renovated apartment",
    ][i % 6],
    propertyName: [
      "Sunset Apartments",
      "Green Valley Residences",
      "Harbor View Towers",
      "Campus Heights",
      "Downtown Lofts",
      "The Metropolitan",
    ][i % 6],
    propertyAddress: `${100 + i} Main St, City, State`,
    tags: [["Pests", "Kitchen"], ["Spacious", "Positive"], ["Water", "Warning"], ["Student", "Location"], ["Noise"], ["Renovated"]][i % 6],
    likes: 100 + i * 10,
    comments: 20 + i * 2,
    views: 500 + i * 50,
    verified: i % 3 === 0,
  }));

  const popularTags = [
    "Pests",
    "Maintenance",
    "Noise",
    "Parking",
    "Management",
    "Renovated",
    "Spacious",
    "Location",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col gap-3">
            {/* Location Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="h-12 bg-card sm:w-[200px]">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedCity} 
                onValueChange={setSelectedCity}
                disabled={selectedState === "all"}
              >
                <SelectTrigger className="h-12 bg-card sm:w-[200px]">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{totalProperties} properties available</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search by address or property name..."
                  className="pl-10 h-12 bg-card"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Popular Tags */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Popular:</span>
            {popularTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {selectedState !== "all" ? `${selectedCity !== "all" ? selectedCity + ", " : ""}${selectedState}` : "All Locations"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {properties.length} properties found
            </p>
          </div>
          <Button
            variant={positiveOnly ? "default" : "outline"}
            onClick={() => setPositiveOnly(!positiveOnly)}
            className="gap-2"
          >
            <Smile className="w-4 h-4" />
            Positive Only
          </Button>
        </div>

        {/* Properties Section */}
        {properties.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Available Properties
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  name={property.name}
                  address={property.address}
                  city={property.city}
                  state={property.state}
                  bedrooms={property.beds}
                  bathrooms={property.baths}
                  rating={4.5}
                  reviewCount={0}
                  videoCount={0}
                  imageUrl="/placeholder.svg"
                  to={`/property/${property.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {properties.length === 0 && (
          <div className="text-center py-12 bg-muted/50 rounded-lg mb-12">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search in a different location
            </p>
          </div>
        )}

        {/* Seeded Reviews Section */}
        {seededReviews.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Real Renter Videos
            </h2>
            <p className="text-muted-foreground mb-6">
              Viral from TikTok – Add Your Story!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {seededReviews.map((review) => (
                <SeededVideoCard 
                  key={review.id} 
                  id={review.id}
                  title={review.title}
                  embed_url={review.video_url}
                  caption={review.caption}
                  hashtags={review.tags}
                  city={review.city}
                  is_positive={review.is_positive}
                />
              ))}
            </div>
          </div>
        )}

        {/* User Video Grid with Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="positive" className="gap-2">
              <Smile className="w-4 h-4" />
              Positive Experiences
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="positive">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.filter((v, i) => i % 2 === 1).map((video) => (
                <VideoCard key={video.id} {...video} verified />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Load More */}
        <div className="flex justify-center mt-12">
          <Button variant="outline" size="lg">
            Load More Reviews
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
