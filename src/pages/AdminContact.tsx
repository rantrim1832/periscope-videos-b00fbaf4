import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, Trash2, Mail } from 'lucide-react';

type Msg = {
  id: string; sender_user_id: string | null; sender_email: string | null;
  topic: string; subject: string; message: string; source_url: string | null;
  status: 'new' | 'reviewing' | 'resolved' | 'spam';
  admin_notes: string | null; created_at: string;
};

const STATUSES: Msg['status'][] = ['new', 'reviewing', 'resolved', 'spam'];

const AdminContact = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Msg['status'] | 'all'>('new');
  const [openId, setOpenId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    let q = supabase.from('contact_message').select('*').order('created_at', { ascending: false }).limit(200);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data, error } = await q;
    if (error) toast({ title: 'Load failed', description: error.message, variant: 'destructive' });
    setRows((data ?? []) as Msg[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const setStatus = async (m: Msg, status: Msg['status']) => {
    const { error } = await supabase.from('contact_message')
      .update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
      .eq('id', m.id);
    if (error) return toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    load();
  };

  const saveNotes = async (m: Msg) => {
    const notes = notesDraft[m.id] ?? m.admin_notes ?? '';
    const { error } = await supabase.from('contact_message').update({ admin_notes: notes }).eq('id', m.id);
    if (error) return toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Notes saved' });
    load();
  };

  const del = async (m: Msg) => {
    if (!confirm('Delete this message permanently?')) return;
    const { error } = await supabase.from('contact_message').delete().eq('id', m.id);
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    load();
  };

  const badgeVariant = (s: Msg['status']) =>
    s === 'new' ? 'default' : s === 'reviewing' ? 'secondary' : s === 'resolved' ? 'outline' : 'destructive';

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container px-4 py-6 md:py-10 max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Contact inbox
          </h1>
          <div className="flex gap-1">
            {(['new','reviewing','resolved','spam','all'] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs px-2.5 py-1.5 rounded-md border ${filter === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages in this view.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((m) => {
              const open = openId === m.id;
              return (
                <Card key={m.id}>
                  <CardContent className="p-3">
                    <button onClick={() => setOpenId(open ? null : m.id)} className="w-full text-left">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={badgeVariant(m.status) as any} className="text-[10px]">{m.status}</Badge>
                            <Badge variant="outline" className="text-[10px]">{m.topic}</Badge>
                            <span className="text-[11px] text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-sm font-medium mt-1 truncate">{m.subject}</p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {m.sender_email ?? 'anon'}
                          </p>
                        </div>
                      </div>
                    </button>
                    {open && (
                      <div className="mt-3 space-y-3 border-t border-border pt-3">
                        <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                        {m.source_url && (
                          <p className="text-[11px] text-muted-foreground">From: <a href={m.source_url} className="text-primary hover:underline" target="_blank" rel="noreferrer">{m.source_url}</a></p>
                        )}
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Admin notes</label>
                          <Textarea
                            rows={2}
                            defaultValue={m.admin_notes ?? ''}
                            onChange={(e) => setNotesDraft({ ...notesDraft, [m.id]: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {m.sender_email && (
                            <a href={`mailto:${m.sender_email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Reply via email
                            </a>
                          )}
                          <Button size="sm" variant="outline" onClick={() => saveNotes(m)}>Save notes</Button>
                          <div className="flex-1" />
                          {STATUSES.filter((s) => s !== m.status).map((s) => (
                            <Button key={s} size="sm" variant="ghost" onClick={() => setStatus(m, s)}>Mark {s}</Button>
                          ))}
                          <Button size="sm" variant="ghost" onClick={() => del(m)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContact;