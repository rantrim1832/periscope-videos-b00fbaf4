import { memo } from 'react';
import { stateImageUrl } from '@/data/stateArt';

export interface StateTileProps {
  code: string;
  name: string;
  count: number;
  /** Bento tile size class */
  span?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
  onClick?: () => void;
}

const SPAN_CLASSES: Record<NonNullable<StateTileProps['span']>, string> = {
  sm: 'col-span-1 row-span-1',
  md: 'col-span-2 row-span-1',
  lg: 'col-span-2 row-span-2',
};

/**
 * Themed stock-photo tile for a US state (California → beach, Colorado →
 * mountains, etc.). Photos come from a small curated pool served by the
 * Unsplash CDN; see `src/data/stateArt.ts`.
 */
export const StateTile = memo(function StateTile({
  code,
  name,
  count,
  span = 'sm',
  highlighted,
  onClick,
}: StateTileProps) {
  const content = (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all cursor-pointer h-full min-h-[9rem] md:min-h-[10.5rem] bg-muted ${
        highlighted
          ? 'border-primary shadow-elevated ring-2 ring-primary/30'
          : 'border-border/60 hover:border-primary/60 hover:shadow-card-hover hover:-translate-y-0.5'
      }`}
    >
      {/* Themed stock photo */}
      <img
        src={stateImageUrl(code)}
        alt=""
        loading="lazy"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Dark gradient wash for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/45 to-foreground/15" />

      <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-5 text-background">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-background/90 text-primary px-1.5 py-0.5 rounded">
            {code}
          </span>
          {highlighted && (
            <span className="text-[9px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              Your state
            </span>
          )}
        </div>
        <div>
          <h3 className="font-bold text-lg md:text-xl leading-tight text-background drop-shadow-md">
            {name}
          </h3>
          <p className="text-xs md:text-sm text-background/85 mt-1">
            {count.toLocaleString()} propert{count === 1 ? 'y' : 'ies'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <button
      onClick={onClick}
      className={`${SPAN_CLASSES[span]} text-left`}
      aria-label={`Browse ${count.toLocaleString()} properties in ${name}`}
    >
      {content}
    </button>
  );
});