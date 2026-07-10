import { Link } from 'react-router-dom';
import { Play, Flame, Lock } from 'lucide-react';
import { useTrendingVideos, formatViews, type TrendingVideo } from '@/hooks/useTrendingVideos';

type Props = {
  /** Where a card should link — `/watch/:id` for logged-in, `/auth?...` for teasers. */
  linkMode: 'watch' | 'auth';
  title?: string;
  eyebrow?: string;
  limit?: number;
  showLock?: boolean;
};

/**
 * Horizontal rail of the top viral / funny / hot-take videos, ordered by
 * YouTube view count. Renders nothing when no viral videos have been
 * approved yet (so early states don't show an empty section).
 */
export function TrendingRail({
  linkMode,
  title = 'Trending now',
  eyebrow = 'Viral apartment videos',
  limit = 12,
  showLock = false,
}: Props) {
  const { videos, loading } = useTrendingVideos({ limit });
  if (loading || videos.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-primary inline-flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5" /> {eyebrow}
          </span>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-0.5">{title}</h2>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory">
        {videos.map((v) => (
          <TrendingCard key={v.id} v={v} linkMode={linkMode} showLock={showLock} />
        ))}
      </div>
    </section>
  );
}

function TrendingCard({ v, linkMode, showLock }: { v: TrendingVideo; linkMode: 'watch' | 'auth'; showLock: boolean }) {
  const href = linkMode === 'watch' ? `/watch/${v.id}` : '/auth?returnTo=%2Ffeed';
  return (
    <Link
      to={href}
      className="group relative flex-shrink-0 w-[220px] md:w-[260px] snap-start rounded-lg overflow-hidden border border-border bg-card hover:border-primary/60 transition-colors"
    >
      <div className="relative aspect-video bg-muted">
        <img src={v.thumbnail} alt={v.title} loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          {showLock ? (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-white/90 p-2.5">
              <Lock className="w-4 h-4 text-black" />
            </div>
          ) : (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-white/90 p-2.5">
              <Play className="w-4 h-4 text-black fill-black" />
            </div>
          )}
        </div>
        {v.views > 0 && (
          <div className="absolute bottom-1.5 right-1.5 text-[10px] font-semibold bg-black/75 text-white rounded px-1.5 py-0.5">
            {formatViews(v.views)}
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-sm font-medium leading-snug line-clamp-2">{v.title}</p>
        <p className="text-[11px] text-muted-foreground truncate mt-1">
          {v.channel}{v.city ? ` · ${v.city}` : ''}
        </p>
      </div>
    </Link>
  );
}