import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function AdminProperties() {
  const [search, setSearch] = useState("");

  const { data: properties, isLoading } = useQuery({
    queryKey: ["admin-properties", search],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`address.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,name.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Properties Database</CardTitle>
            <Input
              placeholder="Search by address, city, state, or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md mt-4"
            />
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
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Beds</TableHead>
                      <TableHead className="text-right">Baths</TableHead>
                      <TableHead className="text-right">Rent</TableHead>
                      <TableHead>Verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties?.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">
                          {property.name}
                        </TableCell>
                        <TableCell>{property.address}</TableCell>
                        <TableCell>{property.city}</TableCell>
                        <TableCell>{property.state}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              property.status === "approved"
                                ? "default"
                                : property.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {property.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {property.beds || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {property.baths || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {property.rent ? `$${property.rent}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={property.is_verified ? "default" : "outline"}>
                            {property.is_verified ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
