import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Star, StarOff, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminCreators() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [ch, sb] = await Promise.all([
      (supabase as any).from('creator_channels').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('creator_submissions').select('*, creator:creator_channels(display_name, handle)').eq('status', 'pending').order('created_at', { ascending: false }),
    ]);
    setChannels(ch.data ?? []);
    setSubmissions(sb.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    await (supabase as any).from('creator_channels').update({ status }).eq('id', id);
    toast({ title: `Channel ${status}` });
    load();
  };
  const toggleFeatured = async (c: any) => {
    await (supabase as any).from('creator_channels').update({ featured: !c.featured }).eq('id', c.id);
    load();
  };
  const reviewSubmission = async (id: string, action: 'approve' | 'reject') => {
    const { error } = await supabase.functions.invoke('approve-creator-submission', { body: { submission_id: id, action } });
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else toast({ title: `Submission ${action}d` });
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-6xl py-8 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Creator moderation</h1>

        <section>
          <h2 className="text-lg font-semibold mb-3">Pending submissions ({submissions.length})</h2>
          {loading ? <p className="text-muted-foreground">Loading…</p> : submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing waiting.</p>
          ) : (
            <div className="rounded-xl border divide-y">
              {submissions.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.title ?? s.youtube_url}</p>
                    <p className="text-xs text-muted-foreground">by {s.creator?.display_name} • {new Date(s.created_at).toLocaleDateString()}</p>
                    {s.youtube_url && <a href={s.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Open on YouTube ↗</a>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => reviewSubmission(s.id, 'reject')}><XCircle className="h-4 w-4" /></Button>
                    <Button size="sm" onClick={() => reviewSubmission(s.id, 'approve')}><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">All channels ({channels.length})</h2>
          <div className="rounded-xl border divide-y">
            {channels.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{c.display_name}</span>
                    <Badge variant="outline">{c.status}</Badge>
                    {c.verified && <Badge>Verified</Badge>}
                    {c.featured && <Badge variant="secondary">Featured</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">@{c.handle} • YT: {c.youtube_channel_id ?? '—'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => toggleFeatured(c)} title="Toggle featured">
                    {c.featured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                  </Button>
                  {c.status !== 'approved' && <Button size="sm" onClick={() => setStatus(c.id, 'approved')}>Approve</Button>}
                  {c.status !== 'suspended' && <Button size="sm" variant="outline" onClick={() => setStatus(c.id, 'suspended')}>Suspend</Button>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}