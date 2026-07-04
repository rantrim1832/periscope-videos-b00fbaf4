import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, ShieldCheck, Star } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/lib/demo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Row { id: string; name: string; level: number; points: number; trustTier: string }

async function getLeaders(): Promise<Row[]> {
  if (isDemoMode()) return [];
  const { data } = await (supabase as any)
    .from('resident_profile')
    .select('id, display_name, pseudonym, level, points, trust_tier')
    .gt('points', 0).order('points', { ascending: false }).limit(50);
  return (data ?? []).map((p: any) => ({
    id: p.id, name: p.display_name ?? p.pseudonym ?? 'Contributor', level: p.level ?? 1, points: p.points ?? 0, trustTier: p.trust_tier,
  }));
}

const MEDAL = ['🥇', '🥈', '🥉'];

const Leaderboard = () => {
  useDocumentTitle('Top contributors | Periscope', 'The renters and creators contributing helpful property context.');
  const { data: rows = [], isLoading } = useQuery({ queryKey: ['leaderboard'], queryFn: getLeaders });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-2"><Trophy className="w-7 h-7 text-warning" /> Top contributors</h1>
        <p className="text-muted-foreground mb-6">The renters and creators helping others understand places before they lease.</p>

        {isDemoMode() || (!isLoading && rows.length === 0) ? (
          <EmptyState icon={Trophy} title="The leaderboard is wide open" description="Be one of the first contributors — publish reviews to earn points, badges, and a spot at the top." primary={{ label: 'Share an experience', to: '/contribute' }} />
        ) : isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r, i) => (
              <Link key={r.id} to={`/creator/${r.id}`} className="block">
                <Card className={i < 3 ? 'border-primary/40' : ''}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <span className="w-8 text-center text-lg font-bold">{i < 3 ? MEDAL[i] : i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> Level {r.level}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {r.points} pts</span>
                      </p>
                    </div>
                    {r.trustTier === 'verified_resident' && <Badge variant="success" className="gap-1 shrink-0"><ShieldCheck className="w-3 h-3" /> Verified</Badge>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
