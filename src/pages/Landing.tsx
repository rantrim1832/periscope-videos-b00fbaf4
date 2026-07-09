import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Video, Shield, Building2, PlayCircle, MessageSquare, Eye } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Public marketing landing page shown to unauthenticated visitors at `/`.
 * Signed-in users are routed straight to Feed / Index by the router.
 */
const Landing = () => {
  useDocumentTitle(
    'Periscope — Real apartment reviews & resident video tours',
    'See what living in a large apartment building is really like. Real resident reviews, video tours, and honest ratings — before you sign the lease.'
  );

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
              The trust layer for <span className="text-primary">apartment living</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              Real resident reviews and video tours of large apartment buildings. Not the brochure — the 6&nbsp;PM gym, the deposit fight, the walls you can hear through.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth?returnTo=%2Fbrowse">Create free account</Link>
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

      {/* Value props */}
      <section className="container py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What renters actually get to see</h2>
          <p className="text-muted-foreground mt-3">A signup unlocks the entire resident-truth graph — reviews, tours, evidence, comparisons.</p>
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