import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Shield, Building2, PlayCircle, MessageSquare, Eye, Lock, MapPin, Users, ChevronRight, Play } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getPropertyProvider } from '@/data/propertyProvider';
import { FEED_CATEGORIES } from '@/domain/property';
import type { FeedItem } from '@/domain/property';

const AUTH_RENTER = '/auth?returnTo=%2Ffeed';
const AUTH_MANAGER = '/auth?returnTo=%2Fmanager';

/**
 * Public marketing landing page shown to unauthenticated visitors at `/`.
 * Signed-in users are routed straight to Feed / Index by the router.
 */
const Landing = () => {
  useDocumentTitle(
    'Periscope — Real apartment reviews & resident video tours',
    'See what living in a large apartment building is really like. Real resident reviews, video tours, and honest ratings — before you sign the lease.'
  );

  const { data: feedItems = [] } = useQuery({
    queryKey: ['landing-feed'],
    queryFn: () => getPropertyProvider().feed(),
    staleTime: 5 * 60 * 1000,
  });

  // YouTube-style rails: one horizontally-scrolling row per real category.
  // "All" is a synthetic filter, not a shelf — skip it.
  const rails = useMemo(() => {
    const realCategories = FEED_CATEGORIES.filter((c) => c !== 'All');
    return realCategories
      .map((cat) => {
        const items = feedItems.filter((i) => i.category === cat).slice(0, 12);
        return { category: cat, items };
      })
      .filter((r) => r.items.length > 0);
  }, [feedItems]);

  // Skeleton rails while feed loads so the section never renders empty.
  const skeletonRails = FEED_CATEGORIES.filter((c) => c !== 'All').slice(0, 4);

  return (
    <div className="min-h-dvh bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
              <Video className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none text-primary">Periscope</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Apartment reviews</div>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth?returnTo=%2Fbrowse">Create free account</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/[0.08] via-background to-background">
        <div className="container py-16 md:py-28 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Eye className="h-3 w-3" /> See it before you sign
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance leading-[1.05]">
              Apartment <span className="text-primary">video reviews</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              See real video reviews from real residents before you sign the lease. The 6&nbsp;PM gym, the deposit fight, the walls you can hear through — not the brochure.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="hero" size="lg" asChild>
                <Link to={AUTH_RENTER}>Create free account</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/auth">I already have one</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Free forever for renters. No credit card. By continuing you agree to our{' '}
              <Link to="/terms" className="underline">Terms</Link> and{' '}
              <Link to="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent p-8 shadow-elevated">
              <div className="h-full rounded-2xl bg-card/60 backdrop-blur border border-border/40 flex flex-col justify-between p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Truth Score</div>
                    <div className="text-5xl font-bold text-primary mt-1">82</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" /> Verified residents
                  </div>
                </div>
                <div className="space-y-2">
                  {['Maintenance response', 'Noise transmission', 'Deposit return'].map((label) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${60 + Math.random() * 30}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-primary">
                  <PlayCircle className="h-4 w-4" /> 14 resident videos
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join paths: Renters vs Property managers */}
      <section className="container py-14 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Join Periscope</h2>
          <p className="text-muted-foreground mt-3">Two ways in — pick the one that fits you. Free either way.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-8 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Renters — join free</h3>
            <p className="text-muted-foreground mb-6 flex-1">
              Watch real video reviews. Post your own. Compare buildings side by side. See the Truth Score before you tour.
            </p>
            <Button variant="hero" size="lg" asChild className="w-full">
              <Link to={AUTH_RENTER}>Sign up as a renter</Link>
            </Button>
          </div>
          <div className="rounded-2xl border-2 border-secondary/40 bg-gradient-to-br from-secondary/10 via-background to-background p-8 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Property managers — join free</h3>
            <p className="text-muted-foreground mb-6 flex-1">
              Claim your building. Upload official tours. Respond to residents. Get alerts the moment a new review is posted.
            </p>
            <Button variant="outline" size="lg" asChild className="w-full">
              <Link to={AUTH_MANAGER}>Sign up as a manager</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* YouTube-style locked feed — one horizontal rail per category */}
      <section className="border-y border-border/40 bg-muted/20">
        <div className="container py-14 md:py-20">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">The feed</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Real videos from real residents</h2>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">Scroll each row. Create a free account to watch any of it.</p>
            </div>
            <Button variant="hero" size="sm" asChild className="hidden md:inline-flex">
              <Link to={AUTH_RENTER}>
                <PlayCircle className="h-4 w-4" /> Watch free
              </Link>
            </Button>
          </div>

          <div className="space-y-10">
            {(rails.length > 0 ? rails : skeletonRails.map((c) => ({ category: c, items: [] as FeedItem[] }))).map((rail) => (
              <FeedRail key={rail.category} category={rail.category} items={rail.items} authHref={AUTH_RENTER} />
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="hero" size="lg" asChild>
              <Link to={AUTH_RENTER}>
                <PlayCircle className="h-4 w-4" /> Create free account to watch
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="container py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What you get with a free account</h2>
          <p className="text-muted-foreground mt-3">Real reviews, resident video tours, honest ratings, and side-by-side comparisons — all in one place.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: PlayCircle, title: 'Resident video tours', body: 'The real unit at 3 pm on a Tuesday. Not staged, not staged-lit.' },
            { icon: Shield, title: 'Truth Score', body: 'Trust-weighted, recency-decayed ratings across 11 categories that matter.' },
            { icon: MessageSquare, title: 'Honest reviews', body: 'From verified residents who lived there. Managers can respond, never delete.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Manager CTA */}
      <section className="border-y border-border/40 bg-muted/30">
        <div className="container py-14 md:py-20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">For property managers</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-1">Claim your building. Respond to residents. Get alerts.</h2>
            <p className="text-muted-foreground mt-2">Managers claim pages for free, add official photos and videos, and get notified the moment a new review is posted.</p>
          </div>
          <Button variant="outline" size="lg" asChild>
            <Link to="/auth?returnTo=%2Fmanager">
              <Building2 className="h-4 w-4" /> Manager tools
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-10 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Periscope Reviews</div>
          <nav className="flex flex-wrap gap-4">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/dmca" className="hover:text-foreground">DMCA</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

/**
 * A YouTube-style horizontal shelf of locked video cards for one category.
 * All cards link to the auth flow — this is a tease, not a player.
 */
function FeedRail({
  category,
  items,
  authHref,
}: {
  category: string;
  items: FeedItem[];
  authHref: string;
}) {
  const loading = items.length === 0;
  // Pad short rails with skeletons so every shelf reads as "there's more".
  const cards = loading
    ? Array.from({ length: 6 }).map((_, i) => ({ skeleton: true, key: `s-${i}` }))
    : items.map((i) => ({ skeleton: false, key: i.id, item: i }));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-3 px-1">
        <h3 className="text-lg md:text-xl font-bold tracking-tight">{category}</h3>
        <Link
          to={authHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Watch all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="relative -mx-4 md:-mx-6">
        {/* Right-edge fade hint — signals horizontal scroll */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-16 bg-gradient-to-l from-muted/40 to-transparent z-10 hidden md:block" />

        <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 md:scroll-px-6 px-4 md:px-6 pb-3">
          {cards.map((c) =>
            c.skeleton ? (
              <div
                key={c.key}
                className="shrink-0 w-[46vw] max-w-[220px] md:w-[220px] aspect-[9/16] rounded-xl bg-muted animate-pulse snap-start"
              />
            ) : (
              <Link
                key={c.key}
                to={authHref}
                className="group relative shrink-0 w-[46vw] max-w-[220px] md:w-[220px] aspect-[9/16] overflow-hidden rounded-xl border border-border/60 bg-card shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5 snap-start"
              >
                {c.item!.thumbnailUrl ? (
                  <img
                    src={c.item!.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-secondary/25" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/40 to-transparent" />

                {/* Center play button, YouTube-shorts style */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/90 text-primary shadow-lg backdrop-blur transition-transform group-hover:scale-110">
                    <Play className="h-5 w-5 translate-x-[1px] fill-current" />
                  </div>
                </div>

                {/* Lock chip — reveals gate on hover */}
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur">
                  <Lock className="h-3 w-3" /> Sign up
                </div>

                <div className="absolute inset-x-0 bottom-0 p-3 space-y-1">
                  <p className="line-clamp-2 text-sm font-semibold text-background leading-tight">
                    {c.item!.title}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-background/85">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{c.item!.propertyName}</span>
                  </div>
                </div>
              </Link>
            )
          )}

          {/* Trailing "see all" card */}
          {!loading && (
            <Link
              to={authHref}
              className="shrink-0 w-[46vw] max-w-[220px] md:w-[220px] aspect-[9/16] rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-3 text-primary hover:bg-primary/10 transition-colors snap-start"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                <Lock className="h-5 w-5" />
              </div>
              <div className="text-center px-4">
                <div className="font-semibold text-sm">Sign up free</div>
                <div className="text-[11px] text-muted-foreground mt-1">Unlock every video</div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}