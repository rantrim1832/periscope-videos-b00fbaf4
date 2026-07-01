import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Video, PenLine, Play, MapPin, TrendingUp, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getPropertyProvider } from "@/data/propertyProvider";
import { computeTruthScore, scoreColorVar } from "@/domain/truthScore";
import type { PropertyView } from "@/domain/property";

const Index = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const { data: feed = [] } = useQuery({ queryKey: ["home-feed"], queryFn: () => getPropertyProvider().feed() });
  const { data: properties = [] } = useQuery({ queryKey: ["home-props"], queryFn: () => getPropertyProvider().listSummaries() });

  const scored = properties
    .map((p) => ({ p, r: computeTruthScore(p.reviews) }))
    .filter((x) => x.r.score != null)
    .sort((a, b) => (a.r.score ?? 0) - (b.r.score ?? 0)); // worst first — the "gap" is the hook

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero: search + what you can do */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              The truth about any apartment,{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">with video proof</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Look up your building. Watch what residents really experienced. Add your own truth in 2 minutes.
            </p>
            <form onSubmit={runSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input placeholder="Search any apartment by name, address, or city…" className="pl-10 h-12 bg-card/90 backdrop-blur-sm" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <Button type="submit" variant="hero" size="lg">Look it up</Button>
            </form>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Button variant="outline" asChild><Link to="/feed"><Play className="w-4 h-4 mr-2" /> Watch the feed</Link></Button>
              <Button variant="outline" asChild><Link to="/browse"><MapPin className="w-4 h-4 mr-2" /> Browse by location</Link></Button>
              <Button variant="outline" asChild><Link to="/contribute"><PenLine className="w-4 h-4 mr-2" /> Add your truth</Link></Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-success" /> Verified resident reviews</span>
              <span className="flex items-center gap-1"><Video className="w-4 h-4 text-primary" /> Video proof, not just ratings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live feed preview — reveal the entertainment magic immediately */}
      {feed.length > 0 && (
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6 text-primary" /> Apartment reality, right now</h2>
              <Button variant="outline" asChild><Link to="/feed">Open the feed</Link></Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x">
              {feed.slice(0, 10).map((item) => (
                <Link key={item.id} to={`/property/${item.propertyId}`} className="snap-start shrink-0 w-40">
                  <Card className="overflow-hidden group hover:shadow-lg transition-all">
                    <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Play className="w-9 h-9 text-foreground/70 group-hover:scale-110 transition-transform" />
                      {item.category && <Badge variant="outline" className="absolute top-2 left-2 bg-black/40 text-white border-white/30 text-[10px]">{item.category}</Badge>}
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs font-medium line-clamp-2">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{item.propertyName}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Real Truth Scores — reveal the utility magic */}
      {scored.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6 text-primary" /> See the gap: marketing vs reality</h2>
              <Button variant="outline" asChild><Link to="/browse">Explore all</Link></Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {scored.slice(0, 6).map(({ p, r }) => (
                <Link key={p.id} to={`/property/${p.id}`}>
                  <Card className="hover:shadow-lg transition-all h-full">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                        style={{ border: `4px solid ${scoreColorVar(r.score)}`, color: scoreColorVar(r.score) }}>
                        {r.score}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{p.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{[p.city, p.state].filter(Boolean).join(", ")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{r.verifiedResidentCount} verified · {r.reviewCount} reviews</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contribute CTA */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-y border-border/40">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Lived somewhere? Help the next renter.</h2>
            <p className="text-lg text-muted-foreground">Your honest review — or a 15-second video — could save someone from a costly mistake.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild><Link to="/contribute"><Video className="w-5 h-5 mr-2" /> Add your truth</Link></Button>
              <Button variant="outline" size="lg" asChild><Link to="/help">How it works</Link></Button>
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
                <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg"><Video className="h-5 w-5 text-primary-foreground" /></div>
                <span className="font-bold text-lg">Pariscope</span>
              </div>
              <p className="text-sm text-muted-foreground">The trust layer for renting — verified resident truth, with video proof.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Explore</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/feed" className="hover:text-primary transition-colors">Feed</Link></li>
                <li><Link to="/browse" className="hover:text-primary transition-colors">Browse properties</Link></li>
                <li><Link to="/search" className="hover:text-primary transition-colors">Search</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contribute</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/contribute" className="hover:text-primary transition-colors">Add your truth</Link></li>
                <li><Link to="/welcome" className="hover:text-primary transition-colors">Get started</Link></li>
                <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="opacity-50 cursor-default">Privacy Policy (coming soon)</span></li>
                <li><span className="opacity-50 cursor-default">Terms of Service (coming soon)</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">© 2026 Pariscope. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
