import { Link } from 'react-router-dom';
import { ChevronRight, type LucideIcon } from 'lucide-react';

// Netflix-style horizontal poster rail of "content prompts" — each tile
// nudges the viewer toward a specific action (record a tour, flag a
// maintenance issue, claim a property, etc.). Cover art uses curated
// Unsplash photos with a strong gradient wash so titles stay legible.

export interface PromptTile {
  key: string;
  title: string;
  hint?: string;
  icon: LucideIcon;
  cover: string;      // Unsplash CDN URL
  to: string;
  featured?: boolean; // Highlighted "must do" tile
  badge?: string;
}

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tiles: PromptTile[];
  seeAllHref?: string;
  seeAllLabel?: string;
}

export const PromptTileRail = ({ eyebrow, title, subtitle, tiles, seeAllHref, seeAllLabel = 'See all' }: Props) => {
  return (
    <section>
      <div className="mb-3 md:mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/90">
              {eyebrow}
            </span>
          )}
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {seeAllHref && (
          <Link to={seeAllHref} className="text-sm font-medium text-primary hover:underline flex items-center gap-0.5 shrink-0">
            {seeAllLabel} <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4">
        {tiles.map((tile) => (
          <PromptTileCard key={tile.key} tile={tile} />
        ))}
      </div>
    </section>
  );
};

const PromptTileCard = ({ tile }: { tile: PromptTile }) => {
  const Icon = tile.icon;
  return (
    <Link
      to={tile.to}
      className={
        'group relative shrink-0 w-44 md:w-56 aspect-[3/4] rounded-xl overflow-hidden bg-muted shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ' +
        (tile.featured ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '')
      }
    >
      <img
        src={tile.cover}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
      />
      {/* Brand wash: keeps type legible and unifies stock photography */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/30 to-secondary/60 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      {(tile.featured || tile.badge) && (
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/95 text-foreground text-[10px] font-semibold uppercase tracking-wider px-2 py-1 backdrop-blur">
          {tile.badge ?? 'Recommended'}
        </span>
      )}

      <div className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-primary backdrop-blur">
        <Icon className="w-4 h-4" />
      </div>

      <div className="absolute bottom-0 inset-x-0 p-3">
        <p className="text-white font-semibold text-sm md:text-base leading-tight line-clamp-2">
          {tile.title}
        </p>
        {tile.hint && (
          <p className="text-white/80 text-[11px] md:text-xs mt-1 line-clamp-2">{tile.hint}</p>
        )}
      </div>
    </Link>
  );
};