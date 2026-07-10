import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ExternalReview {
  id: string;
  author_name: string | null;
  author_url: string | null;
  rating: number | null;
  text: string | null;
  published_at: string | null;
  source_url: string | null;
}

export const GoogleReviews = ({ propertyId }: { propertyId: string }) => {
  const [reviews, setReviews] = useState<ExternalReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('property_external_reviews')
        .select('id, author_name, author_url, rating, text, published_at, source_url')
        .eq('property_id', propertyId)
        .eq('source', 'google_places')
        .order('published_at', { ascending: false })
        .limit(10);
      if (!cancelled) {
        setReviews((data as ExternalReview[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [propertyId]);

  if (loading || reviews.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Google reviews
            <Badge variant="secondary" className="ml-1">{reviews.length}</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">Powered by Google — reviews sourced from Google Places.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-border/60 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {r.author_url ? (
                    <a href={r.author_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                      {r.author_name ?? 'Google reviewer'}
                    </a>
                  ) : (
                    <span className="font-medium">{r.author_name ?? 'Google reviewer'}</span>
                  )}
                  {r.published_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.published_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {r.rating != null && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">{r.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              {r.text && <p className="text-sm text-muted-foreground whitespace-pre-line">{r.text}</p>}
              {r.source_url && (
                <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-2 inline-block">
                  View on Google Maps
                </a>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
};