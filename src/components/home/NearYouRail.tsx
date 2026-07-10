import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useTrendingVideos, formatViews } from '@/hooks/useTrendingVideos';
import { Play } from 'lucide-react';

type Props = { linkMode: 'watch' | 'auth' };

/**
 * Silent IP-geo local video rail. Renders nothing when we can't detect a
 * city or when no videos match — no banner, no permission prompt. Disclosed
 * in the privacy policy.
 */
export function NearYouRail({ linkMode }: Props) {
  const { geo, loading: geoLoading } = useGeoLocation();
  const { videos, loading } = useTrendingVideos({ limit: 8, nearCity: geo?.city ?? null });

  if (geoLoading || loading) return null;
  if (!geo?.city || videos.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <span className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-primary inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> Popular near you
        </span>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-0.5">
          What's trending in {geo.city}
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory">
        {videos.map((v) => {
          const href = linkMode === 'watch' ? `/watch/${v.id}` : '/auth?returnTo=%2Ffeed';
          return (
            <Link
              key={v.id}
              to={href}
              className="group relative flex-shrink-0 w-[220px] md:w-[260px] snap-start rounded-lg overflow-hidden border border-border bg-card hover:border-primary/60 transition-colors"
            >
              <div className="relative aspect-video bg-muted">
                <img src={v.thumbnail} alt={v.title} loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <div className="rounded-full bg-white/90 p-2.5"><Play className="w-4 h-4 text-black fill-black" /></div>
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
        })}
      </div>
    </section>
  );
}