import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, MessageSquare, UserPlus, CheckCircle, Flame, Trophy, Share2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { shareContent } from '@/lib/share';
import { useToast } from '@/hooks/use-toast';

const ICON: Record<string, typeof Bell> = {
  response: MessageSquare, follow: UserPlus, published: CheckCircle, moderation: Bell,
  watch_activity: Bell, milestone: Flame, levelup: Trophy,
};

// Notifications people would send to a friend / screenshot.
const SHAREABLE = new Set(['watch_activity', 'milestone', 'published', 'levelup', 'response']);

const Notifications = () => {
  const { items, loading, markAllRead, unread } = useNotifications();
  const { toast } = useToast();
  useEffect(() => { if (unread > 0) markAllRead(); }, [unread, markAllRead]);

  const share = async (message: string, propertyId: string | null, type: string) => {
    const origin = window.location.origin;
    const url = propertyId ? `${origin}/property/${propertyId}` : type === 'levelup' ? `${origin}/leaderboard` : origin;
    const res = await shareContent({ title: 'Pariscope', text: message, url });
    if (res === 'copied') toast({ title: 'Copied — send it to a friend' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Bell className="w-7 h-7" /> Notifications</h1>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center bg-muted/30 border-dashed">
            <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No notifications yet. Post a review or follow a creator to start getting updates.</p>
            <Button variant="hero" className="mt-4" asChild><Link to="/feed">Explore the feed</Link></Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((n) => {
              const Icon = ICON[n.type] ?? Bell;
              const shareBtn = SHAREABLE.has(n.type) ? (
                <Button
                  variant="ghost" size="icon" className="shrink-0 h-8 w-8"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); share(n.message, n.property_id, n.type); }}
                  aria-label="Share"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              ) : null;
              const inner = (
                <Card className={n.is_read ? '' : 'border-primary/40 bg-primary/5'}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary shrink-0" />
                    <span className="flex-1 text-sm">{n.message}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                    {shareBtn}
                  </CardContent>
                </Card>
              );
              return n.property_id
                ? <Link key={n.id} to={`/property/${n.property_id}`} className="block">{inner}</Link>
                : <div key={n.id}>{inner}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
