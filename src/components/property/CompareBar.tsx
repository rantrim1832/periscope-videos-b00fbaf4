import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GitCompareArrows, X } from 'lucide-react';
import { useCompare } from '@/context/CompareContext';

// Floating bar that surfaces the comparison set — the shopper's retention hook.
export const CompareBar = () => {
  const { items, remove, clear } = useCompare();
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 inset-x-0 z-40 pointer-events-none">
      <div className="container mx-auto px-4">
        <div className="pointer-events-auto mx-auto max-w-2xl rounded-xl border border-border/60 bg-background/95 backdrop-blur shadow-lg p-3 flex items-center gap-3">
          <span className="text-sm font-medium hidden sm:inline">Compare</span>
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {items.map((i) => (
              <span key={i.id} className="flex items-center gap-1 whitespace-nowrap rounded-full bg-muted px-3 py-1 text-xs">
                {i.name}
                <button onClick={() => remove(i.id)} aria-label={`Remove ${i.name}`} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={clear} className="shrink-0">Clear</Button>
          <Button variant="hero" size="sm" asChild className="shrink-0">
            <Link to="/compare"><GitCompareArrows className="w-4 h-4 mr-1" /> Compare {items.length}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
