import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import type { CreatorChannel } from '@/lib/creatorTypes';

/**
 * Renders featured creators. Silently returns null before the migration lands
 * or when no featured creators exist, so it's safe to drop into any layout.
 */
export function FeaturedCreatorsRail() {
  const [creators, setCreators] = useState<CreatorChannel[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await (supabase as any).from('creator_channels')
          .select('*')
          .eq('status', 'approved')
          .eq('featured', true)
          .order('created_at', { ascending: false })
          .limit(8);
        setCreators(data ?? []);
      } catch { /* table not yet created */ }
    })();
  }, []);

  if (creators.length === 0) return null;

  return (
    <section className="container py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Featured creators</h2>
        <Link to="/creators" className="text-sm text-primary inline-flex items-center gap-1 hover:underline">See all <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {creators.map((c) => (
          <Link key={c.id} to={`/channel/${c.handle}`} className="group block rounded-xl border bg-card p-4 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              {c.avatar_url ? (
                <img src={c.avatar_url} alt={c.display_name} className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-primary-foreground">{c.display_name[0]}</div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-sm truncate group-hover:text-primary">{c.display_name}</p>
                  {c.verified && <ShieldCheck className="h-3 w-3 text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">@{c.handle}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}