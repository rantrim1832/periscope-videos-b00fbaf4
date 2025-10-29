import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, MapPin } from "lucide-react";

interface SeededVideo {
  id: string;
  title: string;
  embed_url: string;
  caption: string;
  hashtags: string[];
  city: string;
  moderation_status: string;
  is_positive: boolean;
  created_at: string;
}

const AdminModeration = () => {
  const [videos, setVideos] = useState<SeededVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('seeded_videos')
      .select('*')
      .eq('moderation_status', filter)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load videos');
      console.error(error);
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, [filter]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('seeded_videos')
      .update({ moderation_status: status })
      .eq('id', id);

    if (error) {
      toast.error(`Failed to ${status} video`);
      console.error(error);
    } else {
      toast.success(`Video ${status}!`);
      fetchVideos();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Video Moderation</h1>
          <p className="text-muted-foreground">Review and approve imported videos from Taggbox</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending ({videos.length})
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

        {/* Videos Grid */}
        {loading ? (
          <p className="text-center text-muted-foreground">Loading videos...</p>
        ) : videos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No {filter} videos found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {video.city || 'Unknown'}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Video Embed Placeholder */}
                  <div className="aspect-[9/16] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Video: {video.embed_url.substring(0, 30)}...</p>
                  </div>

                  {/* Caption */}
                  {video.caption && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{video.caption}</p>
                  )}

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1">
                    {video.hashtags.slice(0, 5).map((tag, idx) => (
                      <Badge key={idx} variant="muted" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {video.is_positive && (
                      <Badge variant="success" className="text-xs">
                        Positive
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  {filter === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => updateStatus(video.id, 'approved')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => updateStatus(video.id, 'rejected')}
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