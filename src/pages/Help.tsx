import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Shield, Video, AlertCircle, CheckCircle } from "lucide-react";

const Help = () => {
  const guides = [
    {
      id: 1,
      title: "How to Spot Hidden Pest Problems",
      description: "Learn the signs of pest infestations that landlords try to hide",
      icon: AlertCircle,
      category: "Safety",
      readTime: "5 min",
    },
    {
      id: 2,
      title: "Recording Your Apartment Review Safely",
      description: "Best practices for filming your apartment without violating privacy",
      icon: Video,
      category: "Posting",
      readTime: "3 min",
    },
    {
      id: 3,
      title: "Understanding Your Rights as a Renter",
      description: "Know your legal protections and what landlords can and cannot do",
      icon: Shield,
      category: "Legal",
      readTime: "8 min",
    },
    {
      id: 4,
      title: "Getting Your Review Verified",
      description: "Step-by-step guide to earning your verified resident badge",
      icon: CheckCircle,
      category: "Verification",
      readTime: "2 min",
    },
  ];

  const faqs = [
    {
      question: "Do I need to show my face in video reviews?",
      answer:
        "No, you can post anonymously. Many users film their apartments without showing their face to maintain privacy while still helping others.",
    },
    {
      question: "Can landlords remove negative reviews?",
      answer:
        "No. We protect honest reviews. Landlords can only claim their profile and respond to reviews, not remove them. We verify all removal requests.",
    },
    {
      question: "How does the verification process work?",
      answer:
        "Upload a document showing your address (lease, utility bill). Our AI instantly verifies the address matches and deletes your document. Takes under 1 minute.",
    },
    {
      question: "What should I include in my video review?",
      answer:
        "Show key areas: kitchen, bathroom, common spaces. Point out both positives and negatives. Mention management responsiveness, maintenance quality, and any issues.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-2">
              <BookOpen className="w-10 h-10 text-primary" />
              Help Center
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about Pariscope Reviews
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search for help articles..."
                  className="pl-10 h-12 bg-card"
                />
              </div>
            </div>
          </div>

          {/* Guides */}
          <Card>
            <CardHeader>
              <CardTitle>Helpful Guides</CardTitle>
              <CardDescription>Learn how to make the most of Pariscope Reviews</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {guides.map((guide) => {
                const Icon = guide.icon;
                return (
                  <Card
                    key={guide.id}
                    className="border-border/50 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{guide.title}</h3>
                            <Badge variant="muted" className="text-xs">
                              {guide.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{guide.description}</p>
                          <span className="text-xs text-muted-foreground">{guide.readTime} read</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="pb-4 border-b border-border/50 last:border-0">
                  <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Still need help?</h3>
              <p className="text-muted-foreground">
                Our support team is here to assist you with any questions
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="mailto:support@pariscope.com"
                  className="text-primary hover:underline font-medium"
                >
                  support@pariscope.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;
