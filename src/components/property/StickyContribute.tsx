import { Button } from '@/components/ui/button';
import { PenLine } from 'lucide-react';

// Every property page is a contribution funnel — the CTA is always reachable.
export const StickyContribute = ({ onContribute }: { onContribute?: () => void }) => (
  <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur md:hidden">
    <div className="container mx-auto px-4 py-3">
      <Button variant="hero" className="w-full" onClick={onContribute}>
        <PenLine className="w-4 h-4 mr-2" /> Add a review
      </Button>
    </div>
  </div>
);
