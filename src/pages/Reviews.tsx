import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { SeededVideoCard } from "@/components/SeededVideoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, SlidersHorizontal, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Reviews = () => {
  const [seededVideos, setSeededVideos] = useState<any[]>([]);
  const [positiveOnly, setPositiveOnly] = useState(false);
  
  useEffect(() => {
    const fetchSeededVideos = async () => {
      let query = supabase
        .from('seeded_videos')
        .select('*')
        .eq('moderation_status', 'approved');
      
      if (positiveOnly) {
        query = query.eq('is_positive', true);
      }
      
      const { data } = await query
        .order('is_positive', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (data) {
        setSeededVideos(data);
      }
    };
    
    fetchSeededVideos();
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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search reviews by address, property, or tags..."
                className="pl-10 h-12 bg-card"
              />
            </div>
            <Button variant="outline" size="lg" className="sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="lg" className="sm:w-auto">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Sort
            </Button>
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
            <h1 className="text-3xl font-bold text-foreground">Video Reviews</h1>
            <p className="text-muted-foreground mt-1">
              Discover honest apartment experiences from real renters
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

        {/* Seeded Videos Section */}
        {seededVideos.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Community Sample Reviews
            </h2>
            <p className="text-muted-foreground mb-6">
              Featured videos from the community to inspire your own reviews
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {seededVideos.map((video) => (
                <SeededVideoCard key={video.id} {...video} />
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
