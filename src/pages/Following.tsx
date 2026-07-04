import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Play } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { getFollowingActivity } from '@/services/watchService';
import { isDemoMode } from '@/lib/demo';
import { formatDistanceToNow } from 'date-fns';

// "What's new" from everything you follow — the personalized return surface.
const Following = () => {
  const { data, isLoading } = useQuery({ queryKey: ['following'], queryFn: getFollowingActivity, enabled: !isDemoMode() });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Bell className="w-7 h-7" /> What's new</h1>

        {isDemoMode() ? (
          <EmptyState icon={Bell} title="Follow properties to get updates" description="On the live app, follow buildings and cities to see new reviews and score changes here." primary={{ label: 'Explore the feed', to: '/feed' }} />
        ) : isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !data || data.watchedProperties.length === 0 ? (
          <EmptyState icon={Bell} title="You're not following anything yet" description="Tap Follow on any property or city to get notified about new reviews, videos, and Truth Score changes." primary={{ label: 'Browse properties', to: '/browse' }} secondary={{ label: 'Discover rankings', to: '/discover' }} />
        ) : data.activity.length === 0 ? (
          <EmptyState icon={Bell} title="No new activity yet" description={`You're following ${data.watchedProperties.length} propert${data.watchedProperties.length === 1 ? 'y' : 'ies'}. New reviews and score changes will appear here.`} primary={{ label: 'Add a review', to: '/contribute' }} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Recent activity from {data.watchedProperties.length} propert{data.watchedProperties.length === 1 ? 'y' : 'ies'} you follow</p>
            {data.activity.map((a) => (
              <Link key={a.reviewId} to={`/property/${a.propertyId}`} className="block">
                <Card className="hover:border-primary transition-colors">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.propertyName} · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</p>
                    </div>
                    {a.hasVideo && <Badge variant="outline" className="gap-1 shrink-0"><Play className="w-3 h-3" /> Video</Badge>}
                  </CardContent>
                </Card>
              </Link>
            ))}
            <div className="pt-2"><Button variant="outline" asChild><Link to="/browse">Follow more properties</Link></Button></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Following;
