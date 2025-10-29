import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminScrapingStats() {
  const { data: cityStats, isLoading } = useQuery({
    queryKey: ["scraping-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("city, state, units_count")
        .eq("state", "CA");

      if (error) throw error;

      // Aggregate by city
      const cityMap = new Map<string, { buildings: number; units: number }>();
      
      data.forEach((prop) => {
        const key = prop.city;
        if (!cityMap.has(key)) {
          cityMap.set(key, { buildings: 0, units: 0 });
        }
        const stats = cityMap.get(key)!;
        stats.buildings++;
        stats.units += prop.units_count || 1;
      });

      return Array.from(cityMap.entries())
        .map(([city, stats]) => ({ city, ...stats }))
        .sort((a, b) => b.buildings - a.buildings);
    },
  });

  const totalBuildings = cityStats?.reduce((sum, city) => sum + city.buildings, 0) || 0;
  const totalUnits = cityStats?.reduce((sum, city) => sum + city.units, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Buildings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalBuildings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Units</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalUnits}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Cities Covered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{cityStats?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>California Coverage by City</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>City</TableHead>
                        <TableHead className="text-right">Buildings (50+ units)</TableHead>
                        <TableHead className="text-right">Total Units</TableHead>
                        <TableHead className="text-right">Avg Units/Building</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cityStats?.map((city) => (
                        <TableRow key={city.city}>
                          <TableCell className="font-medium">{city.city}</TableCell>
                          <TableCell className="text-right">{city.buildings}</TableCell>
                          <TableCell className="text-right">{city.units}</TableCell>
                          <TableCell className="text-right">
                            {Math.round(city.units / city.buildings)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Understanding the Data</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Buildings:</strong> Apartment complexes with 50+ units each</li>
                <li>• <strong>Units:</strong> Individual apartments within buildings</li>
                <li>• <strong>API Limitation:</strong> Each scrape fetches 500 individual units, then aggregates into buildings</li>
                <li>• <strong>Strategy:</strong> Use batch scraping to cover all major CA cities systematically</li>
                <li>• <strong>Coverage Gap:</strong> Cities not listed haven't been scraped yet</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
