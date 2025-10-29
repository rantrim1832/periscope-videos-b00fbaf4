import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ShortCard } from "@/components/ShortCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Shorts = () => {
  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShorts = async () => {
      const { data } = await supabase
        .from('shorts')
        .select('*')
        .eq('moderation_status', 'approved')
        .order('likes', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (data) {
        setShorts(data);
      }
      setLoading(false);
    };
    
    fetchShorts();
  }, []);

  const popularTags = [
    "#ApartmentShorts",
    "#RoachFail", 
    "#MoveInWin",
    "#GreatApartment",
    "#ApartmentTour",
    "#PestProblems",
    "#PositiveRental",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search apartment shorts..."
                className="pl-10 h-12 bg-card"
              />
            </div>
            <Button variant="outline" size="lg" className="sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="lg" className="sm:w-auto">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </Button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Popular:</span>
            {popularTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Apartment Shorts</h1>
            <p className="text-muted-foreground mt-1">
              Viral apartment content under 60 seconds
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading shorts...</p>
          </div>
        ) : shorts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {shorts.map((short) => (
              <ShortCard key={short.id} {...short} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No shorts available yet. Check back soon!</p>
          </div>
        )}

        <div className="flex justify-center mt-12">
          <Button variant="outline" size="lg">
            Load More Shorts
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Shorts;
