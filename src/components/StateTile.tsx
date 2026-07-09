import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import statesData from '@/data/usStates.json';

type StateEntry = { id: string; name: string; path: string; viewBox: string };
const BY_ID = new Map<string, StateEntry>((statesData as StateEntry[]).map((s) => [s.id, s]));

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
 * Illustrated state tile: brand-gradient background with the state's outline
 * silhouette drawn in the foreground. No image licensing, no network requests.
 */
export const StateTile = memo(function StateTile({
  code,
  name,
  count,
  span = 'sm',
  highlighted,
  onClick,
}: StateTileProps) {
  const entry = useMemo(() => BY_ID.get(code.toUpperCase()), [code]);

  const content = (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all cursor-pointer h-full min-h-[9rem] md:min-h-[10.5rem] ${
        highlighted
          ? 'border-primary/60 bg-gradient-to-br from-primary/25 via-primary/10 to-secondary/15 shadow-elevated'
          : 'border-border/60 bg-gradient-to-br from-primary/10 via-background to-secondary/10 hover:border-primary/40 hover:shadow-card-hover hover:-translate-y-0.5'
      }`}
    >
      {/* Silhouette watermark */}
      {entry && (
        <svg
          viewBox={entry.viewBox}
          className="absolute inset-0 w-full h-full opacity-30 group-hover:opacity-45 transition-opacity"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`grad-${code}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path d={entry.path} fill={`url(#grad-${code})`} />
        </svg>
      )}

      <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-primary/80">
            {code}
          </span>
          {highlighted && (
            <span className="text-[9px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              Your state
            </span>
          )}
        </div>
        <div>
          <h3 className="font-bold text-lg md:text-xl leading-tight text-foreground drop-shadow-sm">
            {name}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
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

export { BY_ID as US_STATE_SHAPES };