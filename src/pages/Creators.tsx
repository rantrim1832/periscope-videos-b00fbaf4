import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { CreatorChannel } from '@/lib/creatorTypes';

export default function Creators() {
  const [creators, setCreators] = useState<CreatorChannel[]>([]);
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Creators — Periscope');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await (supabase as any).from('creator_channels')
          .select('*')
          .eq('status', 'approved')
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false });
        setCreators(data ?? []);
      } catch { /* migration pending */ }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-6xl py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Apartment creators</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">The people making the best building tours, neighborhood breakdowns, and honest apartment reviews.</p>
          </div>
          <Button asChild variant="hero"><Link to="/creator/apply">Become a creator</Link></Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading creators…</p>
        ) : creators.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed p-12 text-center">
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No creators yet — be the first.</p>
            <Button asChild className="mt-4"><Link to="/creator/apply">Apply now</Link></Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creators.map((c) => (
              <Link key={c.id} to={`/channel/${c.handle}`} className="group block rounded-2xl border p-5 bg-card hover:shadow-lg transition">
                <div className="flex items-center gap-3">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt={c.display_name} className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-primary-foreground">{c.display_name[0]}</div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold truncate group-hover:text-primary">{c.display_name}</h3>
                      {c.verified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">@{c.handle}</p>
                  </div>
                </div>
                {c.bio && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{c.bio}</p>}
                {c.featured && <Badge variant="secondary" className="mt-3">Featured</Badge>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}