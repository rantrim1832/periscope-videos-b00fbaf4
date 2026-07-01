import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { isDemoMode } from '@/lib/demo';

// Site-wide, honest label for demo/mock content. Shown whenever the app runs on
// mock providers so founders/customers know all scores, reviews, residents, and
// videos are illustrative sample data — never fabricated real data.
export const DemoBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  if (!isDemoMode() || dismissed) return null;

  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200">
      <div className="container mx-auto px-4 py-2 flex items-center gap-2 text-sm">
        <Info className="w-4 h-4 shrink-0" />
        <span className="flex-1">
          <strong>Demo mode</strong> — all scores, reviews, residents, and videos shown are
          illustrative <strong>sample data</strong>, not real content.
        </span>
        <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="shrink-0 opacity-70 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
