import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, Video, MessageCircle, Trophy, Star } from "lucide-react";

const Profile = () => {
  const userStats = {
    name: "Sarah M.",
    username: "@sarah_reviews",
    level: 5,
    points: 1250,
    nextLevelPoints: 1500,
    videosPosted: 12,
    commentsPosted: 45,
    likesReceived: 890,
    verified: true,
  };

  const badges = [
    { name: "Pest Patrol", icon: "🐛", description: "Posted 3+ videos about pest issues", earned: true },
    { name: "Move-In Hero", icon: "🏠", description: "Shared positive moving experience", earned: true },
    { name: "Community Helper", icon: "💬", description: "50+ helpful comments", earned: true },
    { name: "Verified Resident", icon: "✓", description: "Verified residency proof", earned: true },
    { name: "Video Pro", icon: "🎥", description: "Posted 10+ video reviews", earned: true },
    { name: "Trendsetter", icon: "🔥", description: "Video reached 1K views", earned: false },
  ];

  const recentVideos = [
    {
      id: "1",
      thumbnailUrl: "/placeholder.svg",
      title: "Roach infestation in kitchen - avoid at all costs!",
      propertyName: "Sunset Apartments",
      propertyAddress: "123 Main St, Brooklyn, NY",
      tags: ["Pests", "Kitchen", "Warning"],
      likes: 234,
      comments: 45,
      views: 1200,
      verified: true,
    },
    {
      id: "2",
      thumbnailUrl: "/placeholder.svg",
      title: "Water damage issues - management not responsive",
      propertyName: "Harbor View Towers",
      propertyAddress: "789 Beach Blvd, Miami, FL",
      tags: ["Water", "Maintenance", "Warning"],
      likes: 156,
      comments: 28,
      views: 750,
      verified: true,
    },
  ];

  const progressToNextLevel = ((userStats.points % 500) / 500) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-primary/10 border-b border-primary/20 text-center py-2 text-sm text-muted-foreground">
        Preview — profile shown with sample data; live contributor profiles are coming soon.
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-primary-foreground">
                  {userStats.name.charAt(0)}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-foreground">{userStats.name}</h1>
                    {userStats.verified && <Badge variant="success">✓ Verified</Badge>}
                  </div>
                  <p className="text-muted-foreground">{userStats.username}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-warning" />
                      <span className="font-semibold text-foreground">Level {userStats.level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      <span className="text-foreground">{userStats.points} points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-secondary" />
                      <span className="text-foreground">{userStats.videosPosted} videos</span>
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Level {userStats.level}</span>
                      <span className="text-muted-foreground">
                        {userStats.points % 500}/{500} to Level {userStats.level + 1}
                      </span>
                    </div>
                    <Progress value={progressToNextLevel} className="h-2" />
                  </div>
                </div>

                <Button variant="outline">Edit Profile</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Stats & Badges */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Video className="w-4 h-4" />
                      <span>Videos</span>
                    </div>
                    <span className="font-semibold text-foreground">{userStats.videosPosted}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                      <span>Comments</span>
                    </div>
                    <span className="font-semibold text-foreground">{userStats.commentsPosted}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="w-4 h-4" />
                      <span>Total Likes</span>
                    </div>
                    <span className="font-semibold text-foreground">{userStats.likesReceived}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Badges Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-secondary" />
                    Badges ({badges.filter((b) => b.earned).length}/{badges.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {badges.map((badge) => (
                      <div
                        key={badge.name}
                        className={`p-3 rounded-lg border text-center space-y-1 transition-all ${
                          badge.earned
                            ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20"
                            : "bg-muted/30 border-border/50 opacity-50"
                        }`}
                      >
                        <div className="text-2xl">{badge.icon}</div>
                        <p className="text-xs font-semibold text-foreground">{badge.name}</p>
                        <p className="text-[10px] text-muted-foreground">{badge.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Videos */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    Your Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recentVideos.map((video) => (
                      <VideoCard key={video.id} {...video} />
                    ))}
                  </div>
                  <div className="mt-6">
                    <Button variant="outline" className="w-full">
                      View All Reviews
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
