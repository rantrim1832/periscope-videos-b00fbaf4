import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, ShieldCheck } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */

const AdminVerifications = () => {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('residency_verification')
      .select('*, canonical_property:canonical_property_id(name, city, state)')
      .eq('status', filter).order('created_at', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const review = async (id: string, status: 'approved' | 'rejected') => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from('residency_verification')
      .update({ status, reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === 'approved' ? 'Approved — resident now Verified' : 'Rejected');
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><ShieldCheck className="w-7 h-7" /> Residency Verifications</h1>
        <p className="text-muted-foreground mb-6">Approve document-based verifications → Verified Resident (T3). GPS verifications are automatic (T2).</p>
        <div className="flex gap-3 mb-6">
          {(['pending', 'approved', 'rejected'] as const).map((f) => {
            const Icon = f === 'pending' ? Clock : f === 'approved' ? CheckCircle : XCircle;
            return <Button key={f} variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}><Icon className="w-4 h-4 mr-2" />{f[0].toUpperCase() + f.slice(1)}</Button>;
          })}
        </div>
        {loading ? <p className="text-muted-foreground">Loading…</p> : items.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">No {filter} verifications</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {items.map((v) => (
              <Card key={v.id}>
                <CardHeader>
                  <CardTitle className="text-base">{v.canonical_property?.name ?? 'Property'} <span className="font-normal text-muted-foreground">· {v.canonical_property?.city}, {v.canonical_property?.state}</span></CardTitle>
                  <div className="flex gap-2 text-sm"><Badge variant="outline">{v.method}</Badge><Badge variant="muted">→ {v.target_tier}</Badge></div>
                </CardHeader>
                {filter === 'pending' && (
                  <CardContent className="flex gap-2">
                    <Button size="sm" onClick={() => review(v.id, 'approved')}><CheckCircle className="w-4 h-4 mr-1" /> Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => review(v.id, 'rejected')}><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerifications;
