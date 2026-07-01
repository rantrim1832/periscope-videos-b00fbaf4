import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, TrendingUp, Users, ThumbsUp, MessageSquare } from "lucide-react";

const Community = () => {
  const polls = [
    {
      id: 1,
      question: "What's the most important factor when choosing an apartment?",
      options: [
        { text: "Location", votes: 234, percentage: 45 },
        { text: "Price", votes: 156, percentage: 30 },
        { text: "Building Maintenance", votes: 89, percentage: 17 },
        { text: "Amenities", votes: 42, percentage: 8 },
      ],
      totalVotes: 521,
      verified: true,
    },
    {
      id: 2,
      question: "Have you experienced pest problems in your current rental?",
      options: [
        { text: "Yes, frequently", votes: 89, percentage: 35 },
        { text: "Yes, occasionally", votes: 102, percentage: 40 },
        { text: "Rarely", votes: 38, percentage: 15 },
        { text: "Never", votes: 25, percentage: 10 },
      ],
      totalVotes: 254,
      verified: false,
    },
  ];

  const discussions = [
    {
      id: 1,
      title: "How to spot red flags during apartment tours?",
      author: "Sarah M.",
      authorBadge: "Veteran Renter",
      replies: 45,
      likes: 123,
      timeAgo: "2 hours ago",
    },
    {
      id: 2,
      title: "Best ways to negotiate rent with landlords",
      author: "Mike D.",
      authorBadge: "Verified Resident",
      replies: 32,
      likes: 89,
      timeAgo: "5 hours ago",
    },
    {
      id: 3,
      title: "Moving checklist - what am I missing?",
      author: "Emma L.",
      authorBadge: "New Member",
      replies: 28,
      likes: 67,
      timeAgo: "1 day ago",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-primary/10 border-b border-primary/20 text-center py-2 text-sm text-muted-foreground">
        Preview — Community is illustrative in this demo; live discussions &amp; polls are coming soon.
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-2">
              <Users className="w-10 h-10 text-primary" />
              Community Forum
            </h1>
            <p className="text-lg text-muted-foreground">
              Connect with renters, share experiences, and get advice
            </p>
          </div>

          {/* Ask Residents Section */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-primary" />
                Ask Residents
              </CardTitle>
              <CardDescription>Community polls answered by verified residents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {polls.map((poll) => (
                <Card key={poll.id} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-foreground">{poll.question}</h3>
                      {poll.verified && <Badge variant="success">Verified Only</Badge>}
                    </div>

                    <div className="space-y-3">
                      {poll.options.map((option, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{option.text}</span>
                            <span className="text-muted-foreground">
                              {option.votes} votes ({option.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-300"
                              style={{ width: `${option.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {poll.totalVotes} total votes
                      </span>
                      <Button variant="outline" size="sm">
                        Vote
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="hero" className="w-full">
                Create New Poll
              </Button>
            </CardContent>
          </Card>

          {/* Trending Discussions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-secondary" />
                Trending Discussions
              </CardTitle>
              <CardDescription>Popular topics in the renter community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {discussions.map((discussion) => (
                <Card
                  key={discussion.id}
                  className="border-border/50 hover:shadow-lg transition-all cursor-pointer"
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-2">{discussion.title}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{discussion.author}</span>
                        <Badge variant="muted" className="text-xs">
                          {discussion.authorBadge}
                        </Badge>
                        <span>•</span>
                        <span>{discussion.timeAgo}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {discussion.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {discussion.replies}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full">
                View All Discussions
              </Button>
            </CardContent>
          </Card>

          {/* Start Discussion CTA */}
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Have a question?</h3>
              <p className="text-muted-foreground">
                Start a discussion and get answers from experienced renters
              </p>
              <Button variant="hero" size="lg">
                Start New Discussion
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Community;
