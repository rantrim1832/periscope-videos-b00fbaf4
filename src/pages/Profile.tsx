import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Star, Users, ShieldCheck, Play, Eye, Trophy } from 'lucide-react';
import { getMyProfile } from '@/services/profileService';
import { isDemoMode } from '@/lib/demo';

const BADGE_ICON: Record<string, string> = {
  first_truth: '🎬', video_creator: '🎥', deposit_watch: '🕵️', verified_resident: '✓',
};

const Profile = () => {
  const { data: profile, isLoading } = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile });

  if (isDemoMode() || (!isLoading && !profile)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center max-w-lg">
          <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
          <h1 className="text-2xl font-bold mb-2">Your contributor profile</h1>
          <p className="text-muted-foreground mb-6">
            {isDemoMode()
              ? 'Sign in on the live app to see your points, badges, and contributions.'
              : 'Sign in to view your profile, rewards, and contributions.'}
          </p>
          <Button variant="hero" asChild><Link to="/auth">Sign in</Link></Button>
        </div>
      </div>
    );
  }

  if (isLoading || !profile) {
    return <div className="min-h-screen bg-background"><Header /><div className="container mx-auto px-4 py-16 text-muted-foreground">Loading…</div></div>;
  }

  const name = profile.displayName ?? profile.pseudonym ?? 'You';
  const toNext = 100 - (profile.points % 100);
  const levelProgress = (profile.points % 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        {/* Header */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-primary-foreground">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold">{name}</h1>
                {profile.trustTier === 'verified_resident' && <Badge variant="success" className="gap-1"><ShieldCheck className="w-3 h-3" /> Verified</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-warning" /> Level {profile.level}</span>
                <span className="flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> {profile.points} points</span>
                <span className="flex items-center gap-2"><Users className="w-4 h-4 text-secondary" /> {profile.followerCount} followers</span>
              </div>
              <div className="space-y-1 max-w-md">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Level {profile.level}</span><span>{toNext} pts to level {profile.level + 1}</span>
                </div>
                <Progress value={levelProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Badges */}
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-secondary" /> Badges ({profile.badges.length})</CardTitle></CardHeader>
            <CardContent>
              {profile.badges.length === 0 ? (
                <p className="text-sm text-muted-foreground">Publish your first review to earn a badge.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {profile.badges.map((b) => (
                    <div key={b.key} className="p-3 rounded-lg border bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 text-center">
                      <div className="text-2xl">{BADGE_ICON[b.key] ?? '🏅'}</div>
                      <p className="text-xs font-semibold mt-1">{b.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contributions */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Your contributions</CardTitle></CardHeader>
            <CardContent>
              {profile.contributions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No contributions yet.</p>
                  <Button variant="hero" asChild><Link to="/contribute">Add your first truth</Link></Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.contributions.map((c) => (
                    <Link key={c.id} to={`/property/${c.propertyId}`} className="block">
                      <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 hover:border-primary transition-colors">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{c.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.propertyName}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                          {c.hasVideo && <Badge variant="outline" className="gap-1"><Play className="w-3 h-3" /> Video</Badge>}
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {c.views}</span>
                          <Badge variant={c.status === 'approved' ? 'success' : c.status === 'pending' ? 'secondary' : 'destructive'}>{c.status}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
