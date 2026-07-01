import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value?: number;
  onChange: (v: number) => void;
  label: string;
}

export const StarRating = ({ value, onChange, label }: Props) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || value || 0) >= n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(n)}
              className="p-0.5"
            >
              <Star className={cn('w-6 h-6 transition-colors', active ? 'fill-warning text-warning' : 'text-muted-foreground/40')} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
