import { useEffect, useState } from 'react';
import type { TruthScoreResult } from '@/domain/truthScore';
import { scoreColorVar, scoreLabel } from '@/domain/truthScore';
import { cn } from '@/lib/utils';

interface Props {
  result: TruthScoreResult;
  size?: number;
  className?: string;
}

// The signature object of the product: an animated, color-coded, confidence-
// honest verdict. Never conveys meaning by color alone (number + label present).
export const TruthScoreGauge = ({ result, size = 176, className }: Props) => {
  const target = result.score ?? 0;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (result.score == null) return;
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, result.score]);

  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = result.score == null ? 0 : result.score / 100;
  const color = scoreColorVar(result.score);
  const hasScore = result.score != null;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
          {hasScore && (
            <circle
              cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
              strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - pct * (display / (target || 1)))}
              style={{ transition: 'stroke-dashoffset 60ms linear' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hasScore ? (
            <>
              <span className="text-5xl font-bold tabular-nums" style={{ color }}>{display}</span>
              <span className="text-xs text-muted-foreground font-medium tracking-wide">TRUTH SCORE</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold text-muted-foreground">—</span>
              <span className="text-[11px] text-muted-foreground text-center px-4 mt-1">
                Not enough data yet
              </span>
            </>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-center max-w-[16rem]">{scoreLabel(result)}</p>
    </div>
  );
};
