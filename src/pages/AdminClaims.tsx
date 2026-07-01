import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Building2 } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */

const AdminClaims = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('property_claim')
      .select('*, canonical_property:canonical_property_id(name, city, state)')
      .eq('status', filter)
      .order('created_at', { ascending: false });
    setClaims(data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const review = async (id: string, status: 'approved' | 'rejected') => {
    const { data: { user } } = await supabase.auth.getUser();
    const patch: any = { status, reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() };
    if (status === 'rejected') patch.rejected_reason = rejectReason[id] ?? 'Could not verify control';
    const { error } = await (supabase as any).from('property_claim').update(patch).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Claim ${status}${status === 'approved' ? ' — channels verified, manager granted' : ''}`);
    fetchClaims();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Property Claims</h1>
        <p className="text-muted-foreground mb-6">Verify management control. Approving flips official content to Verified and grants a manager role (audit-logged). Managers can respond to reviews but never delete them.</p>

        <div className="flex gap-3 mb-6">
          {(['pending', 'approved', 'rejected'] as const).map((f) => {
            const Icon = f === 'pending' ? Clock : f === 'approved' ? CheckCircle : XCircle;
            return <Button key={f} variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}><Icon className="w-4 h-4 mr-2" />{f[0].toUpperCase() + f.slice(1)}</Button>;
          })}
        </div>

        {loading ? <p className="text-muted-foreground">Loading…</p> : claims.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">No {filter} claims</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {claims.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {c.canonical_property?.name ?? 'Property'}
                    <span className="text-sm font-normal text-muted-foreground">{c.canonical_property?.city}, {c.canonical_property?.state}</span>
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline" className="capitalize">{c.role}</Badge>
                    <Badge variant="muted">{c.verification_method}</Badge>
                    {c.company_name && <span className="text-muted-foreground">{c.company_name}</span>}
                    {c.contact_email && <span className="text-muted-foreground">· {c.contact_email}</span>}
                  </div>
                </CardHeader>
                {filter === 'pending' && (
                  <CardContent className="space-y-3">
                    <Input placeholder="Rejection reason (optional)" value={rejectReason[c.id] ?? ''} onChange={(e) => setRejectReason({ ...rejectReason, [c.id]: e.target.value })} />
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => review(c.id, 'approved')}><CheckCircle className="w-4 h-4 mr-1" /> Approve &amp; verify</Button>
                      <Button variant="destructive" className="flex-1" onClick={() => review(c.id, 'rejected')}><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
                    </div>
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

export default AdminClaims;
