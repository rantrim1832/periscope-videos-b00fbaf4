import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminScrapeLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["scrape-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scrape_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

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
            <CardTitle>Scrape Activity Logs</CardTitle>
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
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Inserted</TableHead>
                      <TableHead className="text-right">Skipped</TableHead>
                      <TableHead className="text-right">Errors</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          {log.city ? `${log.city}, ${log.state}` : log.state}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.status === "success"
                                ? "default"
                                : log.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {log.total_properties}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {log.inserted_count}
                        </TableCell>
                        <TableCell className="text-right text-yellow-600">
                          {log.skipped_count}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {log.error_count}
                        </TableCell>
                        <TableCell className="text-right">
                          {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(2)}s` : "-"}
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
