import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Play, TrendingDown, TrendingUp, MapPin, PenLine } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getPropertyProvider } from "@/data/propertyProvider";
import { computeTruthScore, scoreColorVar, scoreLabel } from "@/domain/truthScore";
import { FEED_CATEGORIES, type FeedItem, type PropertyView } from "@/domain/property";

// The homepage answers one question in <10s: "What's the most interesting thing
// happening in apartment living right now?" Content-hook-first (TikTok + Zillow +
// Consumer Reports + Reddit). Discover by using, not by reading.

type Hook =
  | { kind: "clip"; id: string; item: FeedItem }
  | { kind: "score"; id: string; property: PropertyView; score: number; verdict: string }
  | { kind: "drama"; id: string; propertyId: string; propertyName: string; label: string; delta: number };

const Index = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const { data: feed = [] } = useQuery({ queryKey: ["home-feed"], queryFn: () => getPropertyProvider().feed() });
  const { data: properties = [] } = useQuery({ queryKey: ["home-props"], queryFn: () => getPropertyProvider().listSummaries() });

  const hooks = useMemo<Hook[]>(() => {
    const scoreHooks: Hook[] = properties
      .map((p) => ({ p, r: computeTruthScore(p.reviews) }))
      .filter((x) => x.r.score != null)
      .map((x) => ({ kind: "score" as const, id: `s-${x.p.id}`, property: x.p, score: x.r.score!, verdict: scoreLabel(x.r) }));

    const dramaHooks: Hook[] = properties.flatMap((p) =>
      (p.timeline ?? [])
        .filter((e) => e.kind === "score_change" && typeof e.delta === "number")
        .map((e) => ({ kind: "drama" as const, id: `d-${e.id}`, propertyId: p.id, propertyName: p.name, label: e.label, delta: e.delta! })),
    );

    const clipHooks: Hook[] = feed.map((item) => ({ kind: "clip" as const, id: `c-${item.id}`, item }));

    // Interleave for a varied, scrollable wall.
    const out: Hook[] = [];
    const max = Math.max(scoreHooks.length, dramaHooks.length, clipHooks.length);
    for (let i = 0; i < max; i++) {
      if (clipHooks[i]) out.push(clipHooks[i]);
      if (scoreHooks[i]) out.push(scoreHooks[i]);
      if (dramaHooks[i]) out.push(dramaHooks[i]);
    }
    return out;
  }, [feed, properties]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <Header />

      {/* Slim utility bar — search only, no explanation */}
      <div className="border-b border-border/40 bg-background/95">
        <div className="container mx-auto px-4 py-3">
          <form onSubmit={runSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Look up any apartment…" className="pl-9 h-11" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Button type="submit" variant="hero">Search</Button>
          </form>
        </div>
      </div>

      {/* Category chips — jump into the interesting stuff */}
      <div className="container mx-auto px-4 pt-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FEED_CATEGORIES.filter((c) => c !== "All").map((c) => (
            <Button key={c} size="sm" variant="outline" className="whitespace-nowrap" asChild>
              <Link to="/feed">{c}</Link>
            </Button>
          ))}
        </div>
      </div>

      {/* The wall — content is the hero */}
      <main className="container mx-auto px-4 py-6">
        {hooks.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="mb-4">Loading what's happening…</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
            {hooks.map((h) => (
              <div key={h.id} className="mb-4 break-inside-avoid">
                <HookCard hook={h} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* One small nudge — no manifesto */}
      <div className="fixed bottom-4 inset-x-0 z-30 flex justify-center pointer-events-none">
        <Button variant="hero" className="pointer-events-auto shadow-lg" asChild>
          <Link to="/contribute"><PenLine className="w-4 h-4 mr-2" /> Add your truth</Link>
        </Button>
      </div>
    </div>
  );
};

const HookCard = ({ hook }: { hook: Hook }) => {
  if (hook.kind === "clip") {
    const { item } = hook;
    return (
      <Link to={`/property/${item.propertyId}`}>
        <Card className="overflow-hidden group hover:shadow-xl transition-all">
          <div className="relative aspect-[4/5] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Play className="w-12 h-12 text-foreground/70 group-hover:scale-110 transition-transform" />
            {item.category && <Badge className="absolute top-2 left-2 bg-black/50 text-white border-0 text-[11px]">{item.category}</Badge>}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 to-transparent p-3">
              <p className="text-white font-semibold leading-snug line-clamp-3">{item.title}</p>
              <p className="text-white/70 text-xs mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.propertyName}</p>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  if (hook.kind === "score") {
    const color = scoreColorVar(hook.score);
    return (
      <Link to={`/property/${hook.property.id}`}>
        <Card className="hover:shadow-xl transition-all" style={{ borderColor: color }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-5xl font-extrabold tabular-nums" style={{ color }}>{hook.score}</span>
              <div>
                <p className="text-xs text-muted-foreground font-semibold tracking-wide">TRUTH SCORE</p>
                <p className="font-medium leading-tight">{hook.verdict}</p>
              </div>
            </div>
            <p className="font-semibold truncate">{hook.property.name}</p>
            <p className="text-sm text-muted-foreground truncate">{[hook.property.city, hook.property.state].filter(Boolean).join(", ")}</p>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // drama
  const down = hook.delta < 0;
  return (
    <Link to={`/property/${hook.propertyId}`}>
      <Card className="hover:shadow-xl transition-all bg-gradient-to-br from-card to-muted/40">
        <CardContent className="p-5 space-y-2">
          <Badge variant={down ? "destructive" : "success"} className="gap-1">
            {down ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {hook.delta > 0 ? `+${hook.delta}` : hook.delta} Truth Score
          </Badge>
          <p className="font-semibold leading-snug">{hook.label}</p>
          <p className="text-sm text-muted-foreground truncate">{hook.propertyName}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default Index;
