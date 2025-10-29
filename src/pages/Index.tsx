import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { PropertyCard } from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Shield, Users, Video, Award, Smile } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

const Index = () => {
  // Mock data for demonstration
  const featuredVideos = [
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
      title: "Amazing spacious unit with great maintenance",
      propertyName: "Green Valley Residences",
      propertyAddress: "456 Oak Ave, Austin, TX",
      tags: ["Spacious", "Maintenance", "Positive"],
      likes: 189,
      comments: 32,
      views: 890,
      verified: false,
    },
    {
      id: "3",
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

  const topProperties = [
    {
      name: "The Metropolitan",
      address: "100 Central Park W",
      city: "New York",
      state: "NY",
      bedrooms: 2,
      bathrooms: 2,
      rating: 4.5,
      reviewCount: 89,
      videoCount: 24,
      verified: true,
    },
    {
      name: "Riverside Lofts",
      address: "2250 River Rd",
      city: "Chicago",
      state: "IL",
      bedrooms: 1,
      bathrooms: 1,
      rating: 3.8,
      reviewCount: 45,
      videoCount: 12,
      verified: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroBanner})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/85 to-background/95" />
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Unfiltered{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Video Reviews
              </span>{" "}
              of Apartments
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Real stories from real renters. See the truth before you sign. No more hidden horrors.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search by address, city, or property name..."
                  className="pl-10 h-12 bg-card/90 backdrop-blur-sm"
                />
              </div>
              <Button variant="hero" size="lg" className="sm:w-auto">
                Search
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Video className="w-4 h-4 text-primary" />
                12,450+ video reviews
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4 text-secondary" />
                8,200+ verified residents
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-success" />
                100% authentic
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Positive Experiences Spotlight */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Smile className="w-8 h-8 text-green-600 dark:text-green-400" />
                <h2 className="text-3xl font-bold text-foreground">Positive Experiences</h2>
              </div>
              <p className="text-muted-foreground">Discover amazing apartments that renters love</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/reviews">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredVideos.slice(0, 1).map((video) => (
              <VideoCard key={video.id} {...{ ...video, verified: true }} />
            ))}
            {featuredVideos.slice(1, 2).map((video) => (
              <VideoCard key={video.id} {...{ ...video, verified: true }} />
            ))}
            {featuredVideos.slice(0, 2).map((video) => (
              <VideoCard key={`pos-${video.id}`} {...{ ...video, verified: true }} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Reviews */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-primary" />
                Trending Reviews
              </h2>
              <p className="text-muted-foreground mt-1">What renters are watching right now</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/reviews">View All</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredVideos.map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
            {/* Duplicate for demo */}
            {featuredVideos.slice(0, 1).map((video) => (
              <VideoCard key={`dup-${video.id}`} {...video} />
            ))}
          </div>
        </div>
      </section>

      {/* Top Properties */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Award className="w-8 h-8 text-secondary" />
                Top Rated Properties
              </h2>
              <p className="text-muted-foreground mt-1">Most reviewed apartments in your area</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/properties">Explore All</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {topProperties.map((property) => (
              <PropertyCard key={property.name} {...property} />
            ))}
            {/* Duplicate for demo */}
            {topProperties.map((property) => (
              <PropertyCard key={`dup-${property.name}`} {...property} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-y border-border/40">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Share Your Experience, Help Others
            </h2>
            <p className="text-lg text-muted-foreground">
              Your honest review could save someone from a nightmare rental. It only takes 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/post">
                  <Video className="w-5 h-5 mr-2" />
                  Post Your Review
                </Link>
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
                  <Video className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">Pariscope Reviews</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering renters with unfiltered video reviews of apartments nationwide.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Explore</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/reviews" className="hover:text-primary transition-colors">
                    Video Reviews
                  </Link>
                </li>
                <li>
                  <Link to="/properties" className="hover:text-primary transition-colors">
                    Properties
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="hover:text-primary transition-colors">
                    Community
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/help" className="hover:text-primary transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Guidelines
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            © 2025 Pariscope Reviews. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
