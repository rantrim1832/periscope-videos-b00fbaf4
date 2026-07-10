import { Link } from 'react-router-dom';
import { Play, Loader2 } from 'lucide-react';
import { useCuratedTeasers, type CuratedTeaser } from '@/hooks/useCuratedTeasers';

type Rail = { key: string; eyebrow: string; title: string; subtitle: string; categories: string[] };

const RAILS: Rail[] = [
  {
    key: 'tours',
    eyebrow: 'What good looks like',
    title: 'Apartment tours renters actually watched',
    subtitle: 'Full walkthroughs — a 60-second version of yours would land here.',
    categories: ['tours', 'reviews'],
  },
  {
    key: 'amenities',
    eyebrow: 'Show the real story',
    title: 'Amenities — pool, gym, lounge, rooftop',
    subtitle: "What tours skip. Point your camera and narrate — that's enough.",
    categories: ['amenities', 'design-tips'],
  },
  {
    key: 'viral',
    eyebrow: 'Trending on YouTube',
    title: 'Hot takes, viral tours & renter rants',
    subtitle: "You don't need production value. You need honesty and a phone.",
    categories: ['viral-hits', 'hot-takes', 'funny-fails', 'tiktok-famous'],
  },
];

function pickForRail(all: CuratedTeaser[], categories: string[], take = 10): CuratedTeaser[] {
  const set = new Set(categories);
  const primary = all.filter((v) => set.has(v.category));
  if (primary.length >= take) return primary.slice(0, take);
  const rest = all.filter((v) => !set.has(v.category));
  return [...primary, ...rest].slice(0, take);
}

export const InspirationRails = () => {
  const { teasers, loading } = useCuratedTeasers(80);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        <span className="text-sm">Loading inspiration…</span>
      </div>
    );
  }
  if (teasers.length === 0) return null;

  return (
    <div className="space-y-10">
      {RAILS.map((rail) => {
        const items = pickForRail(teasers, rail.categories, 12);
        if (items.length === 0) return null;
        return (
          <section key={rail.key} aria-labelledby={`rail-${rail.key}`}>
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{rail.eyebrow}</p>
              <h2 id={`rail-${rail.key}`} className="text-xl md:text-2xl font-bold text-foreground">
                {rail.title}
              </h2>
              <p className="text-sm text-muted-foreground">{rail.subtitle}</p>
            </div>
            <div className="-mx-4 px-4 overflow-x-auto">
              <div className="flex gap-4 pb-2 snap-x snap-mandatory">
                {items.map((t) => (
                  <InspirationCard key={t.id} teaser={t} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

const InspirationCard = ({ teaser }: { teaser: CuratedTeaser }) => (
  <Link
    to={`/watch/${teaser.id}`}
    className="group relative flex-shrink-0 w-56 md:w-64 snap-start rounded-lg overflow-hidden border border-border/60 bg-card hover:border-primary transition-colors"
    aria-label={`Watch: ${teaser.title}`}
  >
    <div className="relative aspect-video bg-muted overflow-hidden">
      <img
        src={teaser.thumbnail}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-11 h-11 rounded-full bg-primary/95 flex items-center justify-center shadow-lg">
          <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
        </div>
      </div>
    </div>
    <div className="p-3 space-y-1">
      <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{teaser.title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-1">
        {teaser.channel}{teaser.location ? ` · ${teaser.location}` : ''}
      </p>
    </div>
  </Link>
);