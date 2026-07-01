import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, ShieldCheck, Play } from 'lucide-react';
import { getCreator, toggleFollow } from '@/services/creatorService';
import { useToast } from '@/hooks/use-toast';

const CREATOR_TYPE_LABEL: Record<string, string> = {
  tour: 'Tour Creator', investigator: 'Apartment Investigator',
  neighborhood: 'Neighborhood Creator', reviewer: 'Review Creator',
};

const Creator = () => {
  const { id = '' } = useParams();
  const { toast } = useToast();
  const [followBusy, setFollowBusy] = useState(false);

  const { data: creator, isLoading, refetch } = useQuery({
    queryKey: ['creator', id],
    queryFn: () => getCreator(id),
  });

  const onFollow = async () => {
    if (!creator) return;
    setFollowBusy(true);
    try {
      await toggleFollow(creator.id, !creator.isFollowing);
      await refetch();
    } catch (e) {
      toast({ title: 'Sign in to follow', description: (e as Error).message });
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !creator ? (
          <Card className="p-10 text-center bg-muted/30 border-dashed">
            <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h1 className="text-xl font-bold mb-2">Creator profiles</h1>
            <p className="text-muted-foreground">Creator &amp; investigator profiles appear here with live data. Explore the <Link to="/feed" className="underline">feed</Link>.</p>
          </Card>
        ) : (
          <>
            <div className="flex items-start gap-4 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-primary-foreground">
                {(creator.displayName ?? creator.pseudonym ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{creator.displayName ?? creator.pseudonym ?? 'Creator'}</h1>
                  {creator.creatorType && <Badge variant="secondary" className="gap-1"><Sparkles className="w-3 h-3" /> {CREATOR_TYPE_LABEL[creator.creatorType] ?? 'Creator'}</Badge>}
                  {creator.trustTier === 'verified_resident' && <Badge variant="success" className="gap-1"><ShieldCheck className="w-3 h-3" /> Verified</Badge>}
                </div>
                {creator.bio && <p className="text-muted-foreground mt-1">{creator.bio}</p>}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {creator.followerCount} followers</span>
                  <span>{creator.contributorReputation} reputation</span>
                </div>
              </div>
              <Button variant={creator.isFollowing ? 'secondary' : 'hero'} onClick={onFollow} disabled={followBusy}>
                {creator.isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>

            {creator.expertise.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {creator.expertise.map((e, i) => (
                  <Badge key={i} variant="outline">{e.domain}{e.scope ? ` · ${e.scope}` : ''}</Badge>
                ))}
              </div>
            )}

            <h2 className="text-xl font-bold mb-4">Content</h2>
            {creator.content.length === 0 ? (
              <p className="text-muted-foreground">No published content yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {creator.content.map((c) => (
                  <Link key={c.id} to={`/property/${c.propertyId}`}>
                    <Card className="group overflow-hidden hover:shadow-lg transition-all">
                      <div className="aspect-[9/16] bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                        <Play className="w-8 h-8 text-foreground/60" />
                      </div>
                      <CardContent className="p-2">
                        <p className="text-xs font-medium line-clamp-2">{c.title}</p>
                        <p className="text-[11px] text-muted-foreground">{c.propertyName}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Creator;
