import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Video, Shield, Building2, PlayCircle, MessageSquare, Eye, Lock,
  MapPin, Users, Play, Star, Quote,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const AUTH_RENTER = '/auth?returnTo=%2Ffeed';
const AUTH_MANAGER = '/auth?returnTo=%2Fmanager';

/**
 * Streaming-style teaser cards. Each thumbnail is a distinct apartment scene
 * (interior, exterior, tour, rooftop, etc.) so no image ever repeats across
 * the landing page. All cards link to the auth flow — this is a tease, not a
 * player.
 */
type Teaser = {
  id: string;
  title: string;
  property: string;
  location: string;
  photo: string;      // unsplash photo id
  duration: string;   // "2:14"
  views: string;      // "12K views"
  badge?: string;     // "Live", "New", "Verified"
};

// Build a full Unsplash URL for a vertical poster.
const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=520&h=780&q=70`;

const TEASERS: Teaser[] = [
  // Row 1 — Property tours
  { id: 't1',  title: 'Inside the corner unit at Hudson Yards',       property: 'The Hudson',        location: 'New York, NY',    photo: '1560448204-e02f11c3d0e2', duration: '3:42', views: '18K views', badge: 'Verified' },
  { id: 't2',  title: 'Full 2BR walkthrough — nothing staged',        property: 'Marlowe Lofts',     location: 'Chicago, IL',     photo: '1502672260266-1c1ef2d93688', duration: '4:11', views: '9.2K views' },
  { id: 't3',  title: 'The rooftop pool on a Sunday at 4pm',          property: 'Skyline 88',        location: 'Miami, FL',       photo: '1519643381401-22c77e60520e', duration: '1:58', views: '24K views', badge: 'New' },
  { id: 't4',  title: 'What the model unit hides',                    property: 'Ashford Park',      location: 'Atlanta, GA',     photo: '1512918728675-ed5a9ecdebfd', duration: '2:33', views: '6.4K views' },
  { id: 't5',  title: 'Studio at 850 sq ft — real footage',           property: 'The Ellison',       location: 'Austin, TX',      photo: '1493809842364-78817add7ffb', duration: '2:07', views: '11K views' },
  { id: 't6',  title: 'Golden hour on the 22nd floor',                property: 'Beacon West',       location: 'Seattle, WA',     photo: '1600585154340-be6161a56a0c', duration: '1:42', views: '15K views', badge: 'Live' },
  { id: 't7',  title: 'The lobby you saw vs. the lobby at 11pm',      property: 'Vermilion',         location: 'Denver, CO',      photo: '1600607687939-ce8a6c25118c', duration: '3:05', views: '7.8K views' },

  // Row 2 — Resident warnings + maintenance
  { id: 't8',  title: 'What they don\'t tell you about the walls',    property: 'Parkline 12',       location: 'Boston, MA',      photo: '1600566753190-17f0baa2a6c3', duration: '2:44', views: '31K views', badge: 'Verified' },
  { id: 't9',  title: 'Maintenance took 14 days — here\'s why',       property: 'The Kingsley',      location: 'Dallas, TX',      photo: '1560185007-cde436f6a4d0', duration: '4:22', views: '5.1K views' },
  { id: 't10', title: 'Do not sign until you see this closet',        property: 'Coastal 60',        location: 'San Diego, CA',   photo: '1600585154526-990dced4db0d', duration: '1:29', views: '19K views' },
  { id: 't11', title: 'Elevator status: honest tour',                 property: 'Nine Ten',          location: 'Philadelphia, PA',photo: '1449844908441-8829872d2607', duration: '2:18', views: '4.7K views' },
  { id: 't12', title: 'The gym at 6pm on a Tuesday',                  property: 'Ridgeview',         location: 'Portland, OR',    photo: '1554995207-c18c203602cb', duration: '1:11', views: '22K views', badge: 'New' },
  { id: 't13', title: 'Package room reality check',                   property: 'Union & Pine',      location: 'Nashville, TN',   photo: '1484154218962-a197022b5858', duration: '2:56', views: '8.3K views' },
  { id: 't14', title: 'Trash chute floor — you\'ve been warned',      property: 'Halcyon Grove',    location: 'Phoenix, AZ',     photo: '1522156373667-4c7234bbd804', duration: '1:47', views: '13K views' },

  // Row 3 — Manager official / amenities
  { id: 't15', title: 'Official tour: pool, gym, coworking',          property: 'The Meridian',      location: 'Los Angeles, CA', photo: '1568605114967-8130f3a36994', duration: '5:12', views: '27K views', badge: 'Official' },
  { id: 't16', title: 'Meet the resident concierge team',             property: 'Bayfront 33',       location: 'San Francisco, CA', photo: '1600880292203-757bb62b4baf', duration: '3:34', views: '10K views' },
  { id: 't17', title: 'Model 1BR walkthrough with staging notes',     property: 'The Ivy',           location: 'Washington, DC',  photo: '1521791136064-7986c2920216', duration: '4:48', views: '6.9K views' },
  { id: 't18', title: 'Pet spa, dog run, and puppy hours',            property: 'Cedar & 5th',       location: 'Minneapolis, MN', photo: '1502005229762-cf1b2da7c5d6', duration: '2:21', views: '12K views', badge: 'Official' },
  { id: 't19', title: 'Rooftop cinema every Friday night',            property: 'Alto Twelve',       location: 'Las Vegas, NV',   photo: '1560448076-b1e2bf6b7ee1', duration: '1:38', views: '17K views' },
  { id: 't20', title: 'Sunset lounge — first-look preview',           property: 'The Selby',         location: 'Charlotte, NC',   photo: '1560184611-ff3e53f00e8f', duration: '2:02', views: '9.6K views' },
  { id: 't21', title: 'Coworking on 4 — real speeds tested',          property: 'Northline Flats',   location: 'Salt Lake City, UT', photo: '1512917774080-9991f1c4c750', duration: '3:16', views: '5.5K views' },

  // Row 4 — Deposit + move-out stories
  { id: 't22', title: 'The $1,400 deposit fight — full timeline',     property: 'Grove & Vine',      location: 'Raleigh, NC',     photo: '1600566753086-00f18fb6b3ea', duration: '6:04', views: '41K views', badge: 'Verified' },
  { id: 't23', title: 'Move-out inspection — what they mark',         property: 'The Rowan',         location: 'Orlando, FL',     photo: '1600607687920-4e2a09cf159d', duration: '3:29', views: '14K views' },
  { id: 't24', title: 'Rent renewal — negotiation on camera',         property: 'Astoria Point',     location: 'Queens, NY',      photo: '1600585154340-be6161a56a0c', duration: '4:57', views: '8.8K views' },
  { id: 't25', title: 'First 24 hours — moving in unboxed',           property: 'The Cascade',       location: 'Sacramento, CA',  photo: '1560448204-603b3fc33ddc', duration: '2:41', views: '11K views', badge: 'New' },
  { id: 't26', title: 'Why I broke my lease — full story',            property: 'Sable Court',       location: 'Kansas City, MO', photo: '1493809842364-78817add7ffb', duration: '7:18', views: '33K views' },
  { id: 't27', title: 'Roommate walk-through, no filter',             property: 'Highline 27',       location: 'Brooklyn, NY',    photo: '1522708323590-d24dbb6b0267', duration: '3:52', views: '6.2K views' },
  { id: 't28', title: 'Parking garage tour — spot #147',              property: 'The Fenwick',       location: 'Cleveland, OH',   photo: '1600607687644-c7171b4249f3', duration: '1:24', views: '4.1K views' },
];

// Slice teasers into four rails of different lengths so each shelf feels
// distinct. Each rail also gets its own direction + speed downstream.
const RAILS: Array<{ title: string; hint: string; items: Teaser[]; direction: 'left' | 'right'; duration: string }> = [
  { title: 'Featured resident tours',    hint: 'Verified walkthroughs',     items: TEASERS.slice(0, 7),   direction: 'left',  duration: '65s' },
  { title: 'Warnings & maintenance',     hint: 'What managers won\'t say',  items: TEASERS.slice(7, 14),  direction: 'right', duration: '80s' },
  { title: 'Official from managers',     hint: 'Amenities & first looks',   items: TEASERS.slice(14, 21), direction: 'left',  duration: '95s' },
  { title: 'Deposits, move-outs, real talk', hint: 'The stuff nobody films', items: TEASERS.slice(21, 28), direction: 'right', duration: '75s' },
];

const TESTIMONIALS = [
  {
    name: 'Andrea W.',
    role: 'Renter · Chicago',
    quote: 'Finally, a site where I can see what\'s really going on at my property.',
    initial: 'A',
  },
  {
    name: 'Dan C.',
    role: 'Property manager · Austin',
    quote: 'I love being able to showcase my property and show renters how amazing this place really is in real life.',
    initial: 'D',
  },
  {
    name: 'Priya S.',
    role: 'Renter · Seattle',
    quote: 'The video tours saved me from signing at a building with a broken elevator for six months.',
    initial: 'P',
  },
];

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

      {/* Streaming-style auto-scrolling rails. Each rail scrolls a different
          direction at a different speed. Everything routes to /auth. */}
      <section className="border-y border-border/40 bg-muted/20">
        <div className="py-14 md:py-20">
          <div className="container flex items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Now streaming
              </span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Real videos from real residents</h2>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">Every clip is behind a free account. Create one to press play.</p>
            </div>
            <Button variant="hero" size="sm" asChild className="hidden md:inline-flex">
              <Link to={AUTH_RENTER}>
                <PlayCircle className="h-4 w-4" /> Watch free
              </Link>
            </Button>
          </div>

          <div className="space-y-8 md:space-y-12">
            {RAILS.map((rail) => (
              <MarqueeRail key={rail.title} {...rail} />
            ))}
          </div>

          <div className="container text-center mt-12">
            <Button variant="hero" size="lg" asChild>
              <Link to={AUTH_RENTER}>
                <PlayCircle className="h-4 w-4" /> Create free account to watch
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              <Lock className="inline h-3 w-3 mr-1 -mt-0.5" />
              Every video, every review, every Truth Score — free with an account.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Loved by both sides</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Renters and managers agree</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="relative rounded-2xl border border-border/60 bg-card p-6 md:p-7 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <Quote className="absolute right-5 top-5 h-8 w-8 text-primary/15" aria-hidden />
              <div className="flex items-center gap-1 text-primary mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="text-base md:text-lg text-foreground leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center font-bold">
                  {t.initial}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Value props */}
      <section className="container pb-16 md:pb-24">
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
 * A streaming-style auto-scrolling rail. The track holds two copies of the
 * cards so translating -50% loops seamlessly. Direction and duration are
 * configurable per rail so shelves feel alive but not chaotic.
 */
function MarqueeRail({
  title,
  hint,
  items,
  direction,
  duration,
}: {
  title: string;
  hint: string;
  items: Teaser[];
  direction: 'left' | 'right';
  duration: string;
}) {
  // Duplicate the list so the marquee loop is seamless.
  const loop = [...items, ...items];
  return (
    <div>
      <div className="container flex items-baseline justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg md:text-xl font-bold tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <Link
          to={AUTH_RENTER}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline whitespace-nowrap"
        >
          <Lock className="h-3 w-3" /> Unlock all
        </Link>
      </div>

      <div
        className="marquee-pause relative overflow-hidden"
        style={{ ['--marquee-duration' as any]: duration }}
      >
        {/* Edge fades so cards dissolve into the section background */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 md:w-24 bg-gradient-to-r from-muted/70 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 md:w-24 bg-gradient-to-l from-muted/70 to-transparent" />

        <div
          className={`marquee-track gap-3 md:gap-4 py-2 ${direction === 'right' ? 'marquee-track-reverse' : ''}`}
        >
          {loop.map((t, idx) => (
            <TeaserCard key={`${t.id}-${idx}`} teaser={t} kenBurnsDelay={(idx % 5) * -2.4} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * A single vertical poster card. Ken-Burns zoom on the image makes still
 * thumbnails feel like ambient video. Clicking anywhere routes to auth.
 */
function TeaserCard({ teaser, kenBurnsDelay }: { teaser: Teaser; kenBurnsDelay: number }) {
  return (
    <Link
      to={AUTH_RENTER}
      className="group relative block shrink-0 w-[46vw] max-w-[220px] md:w-[220px] aspect-[9/16] overflow-hidden rounded-xl border border-border/60 bg-card shadow-card hover:shadow-card-hover transition-shadow"
      aria-label={`${teaser.title} — sign up to watch`}
    >
      <img
        src={u(teaser.photo)}
        alt=""
        loading="lazy"
        className="ken-burns absolute inset-0 h-full w-full object-cover"
        style={{ animationDelay: `${kenBurnsDelay}s` }}
      />

      {/* Cinematic gradient wash for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/30 to-transparent" />

      {/* Top-left badge (Live / Verified / New / Official) */}
      {teaser.badge && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground backdrop-blur">
          {teaser.badge === 'Live' && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
            </span>
          )}
          {teaser.badge !== 'Live' && <Lock className="h-2.5 w-2.5" />}
          {teaser.badge}
        </div>
      )}

      {/* Bottom-right duration pill */}
      <div className="absolute right-2 top-2 rounded-md bg-foreground/70 px-1.5 py-0.5 text-[10px] font-semibold text-background backdrop-blur">
        {teaser.duration}
      </div>

      {/* Center play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/90 text-primary shadow-lg backdrop-blur transition-transform group-hover:scale-110">
          <Play className="h-5 w-5 translate-x-[1px] fill-current" />
        </div>
      </div>

      {/* Bottom text block */}
      <div className="absolute inset-x-0 bottom-0 p-3 space-y-1">
        <p className="line-clamp-2 text-sm font-semibold text-background leading-tight">
          {teaser.title}
        </p>
        <div className="flex items-center justify-between gap-2 text-[11px] text-background/85">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{teaser.property} · {teaser.location}</span>
          </div>
        </div>
        <div className="text-[10px] text-background/70">{teaser.views}</div>
      </div>
    </Link>
  );
}