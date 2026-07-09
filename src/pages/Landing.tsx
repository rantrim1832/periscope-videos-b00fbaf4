import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Video, Shield, Building2, PlayCircle, MessageSquare, Eye, Lock,
  MapPin, Users, Play, Star, Quote,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// Landing thumbnails — generated apartment scenes so every card reads as
// a real multifamily interior/exterior/amenity/person, never a random
// stock photo of a house or theatre.
import imgLiving      from '@/assets/landing/apt-living.jpg';
import imgKitchen     from '@/assets/landing/apt-kitchen.jpg';
import imgBedroom     from '@/assets/landing/apt-bedroom.jpg';
import imgBathLeak    from '@/assets/landing/apt-bath-leak.jpg';
import imgHighrise    from '@/assets/landing/apt-exterior-highrise.jpg';
import imgMidrise     from '@/assets/landing/apt-exterior-midrise.jpg';
import imgGym         from '@/assets/landing/apt-gym.jpg';
import imgPool        from '@/assets/landing/apt-pool.jpg';
import imgLobby       from '@/assets/landing/apt-lobby.jpg';
import imgPackages    from '@/assets/landing/apt-packages.jpg';
import imgTourWoman   from '@/assets/landing/apt-tour-woman.jpg';
import imgLease       from '@/assets/landing/apt-lease.jpg';
import imgNeighborhood from '@/assets/landing/apt-neighborhood.jpg';
import imgCoworking   from '@/assets/landing/apt-coworking.jpg';
import imgLaundry     from '@/assets/landing/apt-laundry.jpg';
import imgHallway     from '@/assets/landing/apt-hallway.jpg';

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
  photo: string;      // imported image URL
  duration: string;   // "2:14"
  views: string;      // "12K views"
  badge?: string;     // "Live", "New", "Verified"
};

// 16 teasers — one per generated apartment scene. Each thumbnail appears
// exactly once. Categories are the ones renters care about, not "resident
// tours". 4 rails × 4 cards each.
const TEASERS: Teaser[] = [
  // ---------- Maintenance nightmares (4) ----------
  { id: 'm1', title: 'Leak from the unit above — day 9, still nothing',  property: 'Parkline 12',    location: 'Boston, MA',       photo: imgBathLeak,    duration: '3:41', views: '42K views', badge: 'Verified' },
  { id: 'm2', title: 'Kitchen sink flood — the maintenance recording',   property: 'Grove & Vine',   location: 'Raleigh, NC',      photo: imgKitchen,     duration: '4:12', views: '9.6K views', badge: 'New' },
  { id: 'm3', title: 'Elevator out for 6 weeks — 22nd floor walk-up',    property: 'Nine Ten',       location: 'Philadelphia, PA', photo: imgHallway,     duration: '2:57', views: '18K views' },
  { id: 'm4', title: 'AC broke in July — full 3-week timeline',          property: 'The Ellison',    location: 'Austin, TX',       photo: imgLiving,      duration: '5:04', views: '22K views' },

  // ---------- Application & lease drama (4) ----------
  { id: 'a1', title: 'The $475 in fees they never mentioned',            property: 'The Meridian',   location: 'Los Angeles, CA',  photo: imgLease,       duration: '3:26', views: '54K views', badge: 'Verified' },
  { id: 'a2', title: 'Touring 6 units in one day — what I noticed',      property: 'The Hudson',     location: 'New York, NY',     photo: imgTourWoman,   duration: '4:38', views: '27K views' },
  { id: 'a3', title: 'Denied over a background typo — full story',       property: 'Coastal 60',     location: 'San Diego, CA',    photo: imgBedroom,     duration: '3:52', views: '11K views', badge: 'New' },
  { id: 'a4', title: 'Deposit came back in 87 days — my paper trail',    property: 'The Rowan',      location: 'Orlando, FL',      photo: imgLobby,       duration: '2:44', views: '15K views' },

  // ---------- Local area vibe (4) ----------
  { id: 'v1', title: 'The block at night — walking safety honest take',  property: 'Highline 27',    location: 'Brooklyn, NY',     photo: imgNeighborhood,duration: '4:22', views: '38K views', badge: 'Live' },
  { id: 'v2', title: 'Coffee shops within 4 blocks — ranked',            property: 'Union & Pine',   location: 'Nashville, TN',    photo: imgMidrise,     duration: '5:41', views: '24K views' },
  { id: 'v3', title: 'Rush-hour traffic outside the building',           property: 'Beacon West',    location: 'Seattle, WA',      photo: imgHighrise,    duration: '2:33', views: '12K views' },
  { id: 'v4', title: 'Grocery, gym, coffee — the real 15-min walk',      property: 'Ashford Park',   location: 'Atlanta, GA',      photo: imgHighrise,    duration: '3:07', views: '7.4K views' },

  // ---------- Amenities — the real story (4) ----------
  { id: 'e1', title: 'The gym at 6pm on a Tuesday — packed',             property: 'Ridgeview',      location: 'Portland, OR',     photo: imgGym,         duration: '1:47', views: '33K views', badge: 'Verified' },
  { id: 'e2', title: 'Rooftop pool at 4pm — is it worth it?',            property: 'Skyline 88',     location: 'Miami, FL',        photo: imgPool,        duration: '2:41', views: '48K views', badge: 'New' },
  { id: 'e3', title: 'Coworking lounge — wifi speeds tested live',       property: 'Northline Flats',location: 'Salt Lake City, UT',photo: imgCoworking,   duration: '3:16', views: '9.8K views' },
  { id: 'e4', title: 'Package room + laundry — real hours',              property: 'Cedar & 5th',    location: 'Minneapolis, MN',  photo: imgPackages,    duration: '2:15', views: '14K views' },
];

// Second image for the "grocery walk" so we don't repeat the highrise
// twice within Local area vibe. Swap the 4th card to laundry — reads as a
// building service anyway.
TEASERS[11].photo = imgLaundry;

// Rails renamed to the categories renters actually search for. Each rail
// scrolls a different direction/speed so shelves feel alive but not chaotic.
const RAILS: Array<{ title: string; hint: string; items: Teaser[]; direction: 'left' | 'right'; duration: string }> = [
  { title: 'Maintenance nightmares',       hint: 'What actually got fixed — and what didn\'t',   items: TEASERS.slice(0, 4),   direction: 'left',  duration: '65s' },
  { title: 'Application & lease drama',    hint: 'Fees, denials, and the fine print',            items: TEASERS.slice(4, 8),   direction: 'right', duration: '75s' },
  { title: 'Local area vibe',              hint: 'The block, the walk, the noise',               items: TEASERS.slice(8, 12),  direction: 'left',  duration: '80s' },
  { title: 'Amenities — the real story',   hint: 'Pool, gym, package room — at the worst hour',  items: TEASERS.slice(12, 16), direction: 'right', duration: '70s' },
];

// Featured strip for the hero preview — a single fast-moving rail mixed
// from every category so visitors see the range immediately.
const HERO_STRIP: Teaser[] = [
  TEASERS[12], TEASERS[0], TEASERS[8],  TEASERS[4],
  TEASERS[13], TEASERS[2], TEASERS[10], TEASERS[6],
  TEASERS[15], TEASERS[1], TEASERS[11], TEASERS[7],
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
        <div className="container flex h-14 md:h-16 items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="bg-gradient-to-br from-primary to-secondary p-1.5 md:p-2 rounded-lg shrink-0">
              <Video className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-base md:text-lg leading-none text-primary truncate">Periscope</div>
              <div className="hidden sm:block text-[10px] uppercase tracking-widest text-muted-foreground">Apartment reviews</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 md:gap-2 shrink-0">
            <Button variant="ghost" size="sm" asChild className="px-2 md:px-3">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button variant="hero" size="sm" asChild className="px-3 md:px-4">
              <Link to="/auth?returnTo=%2Fbrowse">
                <span className="sm:hidden">Sign up</span>
                <span className="hidden sm:inline">Create free account</span>
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Compact hero — headline + CTAs, with a live marquee rail laced
          directly beneath it so visitors see the videos immediately. */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/[0.10] via-background to-muted/20">
        <div className="container pt-8 md:pt-14 pb-4 md:pb-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] md:text-xs font-semibold uppercase tracking-wider text-primary">
            <Eye className="h-3 w-3" /> See it before you sign
          </span>
          <h1 className="mt-4 text-[2rem] leading-[1.05] md:text-5xl font-bold tracking-tight text-balance">
            Apartment <span className="text-primary">video reviews</span>.
          </h1>
          <p className="mt-3 text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            The 6&nbsp;PM gym, the maintenance ticket that took 9 days, the fees they forgot to mention. All on video. All from real residents.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row justify-center gap-3">
            <Button variant="hero" size="lg" asChild className="w-full sm:w-auto">
              <Link to={AUTH_RENTER}>Create free account</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link to="/auth">I already have one</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Free for renters. No credit card. Every video is behind a free account.
          </p>
        </div>

        {/* Featured strip — mixed teaser bar right beneath the headline */}
        <div className="pt-2 pb-8 md:pb-12">
          <div className="container flex items-center justify-between gap-4 mb-3">
            <div className="inline-flex items-center gap-2 text-[11px] md:text-xs font-semibold uppercase tracking-wider text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Trending on Periscope
            </div>
            <Link to={AUTH_RENTER} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline whitespace-nowrap">
              <Lock className="h-3 w-3" /> Watch all
            </Link>
          </div>
          <MarqueeRail
            title=""
            hint=""
            items={HERO_STRIP}
            direction="left"
            duration="55s"
            hideHeader
          />
        </div>
      </section>

      {/* Streaming-style auto-scrolling rails. Each rail scrolls a different
          direction at a different speed. Everything routes to /auth. */}
      <section className="border-y border-border/40 bg-muted/20">
        <div className="py-10 md:py-20">
          <div className="container flex items-end justify-between gap-4 mb-6 md:mb-8">
            <div className="min-w-0">
              <span className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-primary inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Now streaming
              </span>
              <h2 className="text-xl md:text-3xl font-bold tracking-tight mt-1">Real videos from real residents</h2>
              <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">Every clip is behind a free account. Create one to press play.</p>
            </div>
            <Button variant="hero" size="sm" asChild className="hidden md:inline-flex">
              <Link to={AUTH_RENTER}>
                <PlayCircle className="h-4 w-4" /> Watch free
              </Link>
            </Button>
          </div>

          <div className="space-y-6 md:space-y-12">
            {RAILS.map((rail) => (
              <MarqueeRail key={rail.title} {...rail} />
            ))}
          </div>

          <div className="container text-center mt-8 md:mt-12">
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

      {/* Join paths: Renters vs Property managers */}
      <section className="container py-10 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-6 md:mb-10">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Join Periscope</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2 md:mt-3">Two ways in — pick the one that fits you. Free either way.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2">Renters — join free</h3>
            <p className="text-sm md:text-base text-muted-foreground mb-5 md:mb-6 flex-1">
              Watch real video reviews. Post your own. Compare buildings side by side. See the Truth Score before you tour.
            </p>
            <Button variant="hero" size="lg" asChild className="w-full">
              <Link to={AUTH_RENTER}>Sign up as a renter</Link>
            </Button>
          </div>
          <div className="rounded-2xl border-2 border-secondary/40 bg-gradient-to-br from-secondary/10 via-background to-background p-6 md:p-8 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2">Property managers — join free</h3>
            <p className="text-sm md:text-base text-muted-foreground mb-5 md:mb-6 flex-1">
              Claim your building. Upload official tours. Respond to residents. Get alerts the moment a new review is posted.
            </p>
            <Button variant="outline" size="lg" asChild className="w-full">
              <Link to={AUTH_MANAGER}>Sign up as a manager</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container py-10 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-6 md:mb-12">
          <span className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-primary">Loved by both sides</span>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mt-2">Renters and managers agree</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="relative rounded-2xl border border-border/60 bg-card p-5 md:p-7 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <Quote className="absolute right-4 top-4 md:right-5 md:top-5 h-7 w-7 md:h-8 md:w-8 text-primary/15" aria-hidden />
              <div className="flex items-center gap-1 text-primary mb-3 md:mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 md:h-4 md:w-4 fill-current" />
                ))}
              </div>
              <blockquote className="text-[15px] md:text-lg text-foreground leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 md:mt-5 flex items-center gap-3">
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
      <section className="container pb-10 md:pb-24">
        <div className="text-center max-w-2xl mx-auto mb-6 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight">What you get with a free account</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2 md:mt-3">Real reviews, resident video tours, honest ratings, and side-by-side comparisons — all in one place.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {[
            { icon: PlayCircle, title: 'Resident video tours', body: 'The real unit at 3 pm on a Tuesday. Not staged, not staged-lit.' },
            { icon: Shield, title: 'Truth Score', body: 'Trust-weighted, recency-decayed ratings across 11 categories that matter.' },
            { icon: MessageSquare, title: 'Honest reviews', body: 'From verified residents who lived there. Managers can respond, never delete.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card p-5 md:p-6 hover:border-primary/40 transition-colors">
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
        <div className="container py-10 md:py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-6">
          <div className="max-w-xl">
            <span className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-secondary">For property managers</span>
            <h2 className="text-xl md:text-3xl font-bold mt-1">Claim your building. Respond to residents. Get alerts.</h2>
            <p className="text-sm md:text-base text-muted-foreground mt-2">Managers claim pages for free, add official photos and videos, and get notified the moment a new review is posted.</p>
          </div>
          <Button variant="outline" size="lg" asChild className="w-full md:w-auto">
            <Link to="/auth?returnTo=%2Fmanager">
              <Building2 className="h-4 w-4" /> Manager tools
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-8 md:py-10 text-xs md:text-sm text-muted-foreground">
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
  hideHeader,
}: {
  title: string;
  hint: string;
  items: Teaser[];
  direction: 'left' | 'right';
  duration: string;
  hideHeader?: boolean;
}) {
  // Duplicate the list so the marquee loop is seamless.
  const loop = [...items, ...items];
  return (
    <div>
      {!hideHeader && (
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
      )}

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
        src={teaser.photo}
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