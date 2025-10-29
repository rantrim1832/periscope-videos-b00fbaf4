import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, MapPin } from "lucide-react";

interface SeededReview {
  id: string;
  title: string;
  video_url: string;
  embed_code: string;
  caption: string;
  tags: string[];
  city: string;
  rating: number;
  moderation_status: string;
  is_positive: boolean;
  created_at: string;
}

const AdminModeration = () => {
  const [reviews, setReviews] = useState<SeededReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('source', 'seeded')
      .eq('moderation_status', filter)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load reviews');
      console.error(error);
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('reviews')
      .update({ moderation_status: status })
      .eq('id', id);

    if (error) {
      toast.error(`Failed to ${status} review`);
      console.error(error);
    } else {
      toast.success(`Review ${status}!`);
      fetchReviews();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Review Moderation</h1>
          <p className="text-muted-foreground">Review and approve seeded reviews from Taggbox</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending ({reviews.length})
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approved
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilter('rejected')}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Rejected
          </Button>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <p className="text-center text-muted-foreground">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No {filter} reviews found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{review.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {review.city || 'Unknown'}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">⭐ {review.rating}/5</Badge>
                    {review.is_positive && (
                      <Badge className="bg-green-500">Positive</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Video Embed Placeholder */}
                  <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Video: {review.video_url.substring(0, 30)}...</p>
                  </div>

                  {/* Caption */}
                  {review.caption && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{review.caption}</p>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {review.tags.slice(0, 5).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Actions */}
                  {filter === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => updateStatus(review.id, 'approved')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => updateStatus(review.id, 'rejected')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModeration;