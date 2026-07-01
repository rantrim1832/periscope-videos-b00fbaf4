import { useEffect, useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/lib/demo';
import { cn } from '@/lib/utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const ReviewHelpful = ({ reviewId }: { reviewId: string }) => {
  const [count, setCount] = useState(0);
  const [mine, setMine] = useState(false);

  useEffect(() => {
    if (isDemoMode()) return;
    (async () => {
      const { count: c } = await (supabase as any).from('review_helpful').select('*', { count: 'exact', head: true }).eq('review_id', reviewId);
      setCount(c ?? 0);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await (supabase as any).from('review_helpful').select('id').eq('review_id', reviewId).eq('user_id', user.id).maybeSingle();
        setMine(!!data);
      }
    })();
  }, [reviewId]);

  const toggle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (mine) {
      await (supabase as any).from('review_helpful').delete().eq('review_id', reviewId).eq('user_id', user.id);
      setMine(false); setCount((c) => Math.max(0, c - 1));
    } else {
      await (supabase as any).from('review_helpful').insert({ review_id: reviewId, user_id: user.id });
      setMine(true); setCount((c) => c + 1);
    }
  };

  if (isDemoMode()) return null;

  return (
    <button onClick={toggle} className={cn('flex items-center gap-1 text-xs hover:text-primary transition-colors', mine ? 'text-primary' : 'text-muted-foreground')}>
      <ThumbsUp className="w-3.5 h-3.5" /> Helpful{count > 0 ? ` (${count})` : ''}
    </button>
  );
};
