import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, LifeBuoy } from 'lucide-react';

type SafetyRow = {
  id: string;
  kind: 'report' | 'contact';
  type: string;
  subject: string;
  message: string;
  email: string | null;
  status: string;
  url: string | null;
  created_at: string;
};

const statusVariant = (status: string) => status === 'new' ? 'destructive' : status === 'reviewing' ? 'secondary' : 'outline';

const AdminSafety = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<SafetyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [reports, contacts] = await Promise.all([
      (supabase as any)
        .from('safety_report')
        .select('id, report_type, target_type, target_id, target_url, description, reporter_email, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50),
      (supabase as any)
        .from('contact_message')
        .select('id, topic, subject, message, sender_email, source_url, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);
    if (reports.error || contacts.error) {
      toast({ title: 'Could not load safety inbox', description: reports.error?.message || contacts.error?.message, variant: 'destructive' });
    }
    const reportRows: SafetyRow[] = (reports.data ?? []).map((r: any) => ({
      id: r.id,
      kind: 'report',
      type: `${r.report_type} · ${r.target_type}`,
      subject: r.target_id ? `Target ${r.target_id}` : 'Reported content',
      message: r.description,
      email: r.reporter_email,
      status: r.status,
      url: r.target_url,
      created_at: r.created_at,
    }));
    const contactRows: SafetyRow[] = (contacts.data ?? []).map((c: any) => ({
      id: c.id,
      kind: 'contact',
      type: c.topic,
      subject: c.subject,
      message: c.message,
      email: c.sender_email,
      status: c.status,
      url: c.source_url,
      created_at: c.created_at,
    }));
    setRows([...reportRows, ...contactRows].sort((a, b) => b.created_at.localeCompare(a.created_at)));
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (row: SafetyRow, status: string) => {
    const table = row.kind === 'report' ? 'safety_report' : 'contact_message';
    const { error } = await (supabase as any).from(table).update({ status, updated_at: new Date().toISOString() }).eq('id', row.id);
    if (error) {
      toast({ title: 'Could not update status', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Status updated' });
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldAlert className="w-7 h-7 text-primary" /> Safety Inbox</h1>
          <p className="text-muted-foreground">Reports, contact messages, copyright/privacy requests, and property-info issues.</p>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : rows.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">No reports or contact messages yet.</CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {rows.map((row) => {
              const Icon = row.kind === 'report' ? ShieldAlert : LifeBuoy;
              return (
                <Card key={`${row.kind}-${row.id}`}>
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 items-start justify-between">
                      <CardTitle className="text-lg flex items-center gap-2"><Icon className="w-5 h-5 text-primary" /> {row.subject}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={row.kind === 'report' ? 'destructive' : 'secondary'}>{row.kind}</Badge>
                        <Badge variant="outline">{row.type}</Badge>
                        <Badge variant={statusVariant(row.status) as any}>{row.status}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()} {row.email ? `· ${row.email}` : ''}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {row.url && <a className="text-sm text-primary underline break-all" href={row.url} target="_blank" rel="noreferrer">{row.url}</a>}
                    <p className="text-sm whitespace-pre-wrap">{row.message}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateStatus(row, 'reviewing')}>Mark reviewing</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(row, 'resolved')}>Resolve</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(row, 'closed')}>Close</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSafety;
