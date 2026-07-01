import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Clock, Building2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPropertyProvider } from '@/data/propertyProvider';

/* eslint-disable @typescript-eslint/no-explicit-any */

const METHODS = [
  { key: 'work_email', label: 'Work email match', desc: 'Use an email on the property/management domain' },
  { key: 'phone', label: 'Phone callback', desc: 'Verify via the property’s listed phone' },
  { key: 'document', label: 'Business document', desc: 'Upload proof of management authority' },
];

const ClaimProperty = () => {
  const { propertyId = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [existing, setExisting] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ role: 'manager', company_name: '', contact_email: '', verification_method: 'work_email' });

  const { data: property } = useQuery({
    queryKey: ['claim-prop', propertyId],
    queryFn: () => getPropertyProvider().getProperty(propertyId),
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) {
        const { data } = await (supabase as any)
          .from('property_claim').select('*')
          .eq('canonical_property_id', propertyId).eq('claimant_user_id', user.id)
          .order('created_at', { ascending: false }).maybeSingle();
        setExisting(data ?? null);
      }
    });
  }, [propertyId]);

  const submit = async () => {
    if (!userId) { navigate('/auth'); return; }
    setSubmitting(true);
    const { data, error } = await (supabase as any).from('property_claim').insert({
      canonical_property_id: propertyId,
      claimant_user_id: userId,
      role: form.role,
      company_name: form.company_name,
      contact_email: form.contact_email,
      verification_method: form.verification_method,
    }).select('*').single();
    setSubmitting(false);
    if (error) { toast({ title: 'Could not submit claim', description: error.message, variant: 'destructive' }); return; }
    setExisting(data);
    toast({ title: 'Claim submitted', description: 'We’ll review and verify your control shortly.' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Building2 className="w-7 h-7" /> Claim this property</h1>
          {property && <p className="text-muted-foreground">{property.name}{property.city ? `, ${property.city}` : ''}</p>}
        </div>

        {existing ? (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              {existing.status === 'approved' ? (
                <><ShieldCheck className="w-12 h-12 mx-auto text-success" /><h2 className="text-xl font-bold">You’re verified</h2>
                  <p className="text-muted-foreground">You manage this property. You can add official content and respond to reviews.</p>
                  <Button variant="hero" asChild><Link to={`/property/${propertyId}`}>Go to property</Link></Button></>
              ) : existing.status === 'rejected' ? (
                <><h2 className="text-xl font-bold">Claim not approved</h2><p className="text-muted-foreground">{existing.rejected_reason || 'Please contact support to re-verify.'}</p></>
              ) : (
                <><Clock className="w-12 h-12 mx-auto text-warning" /><h2 className="text-xl font-bold">Claim under review</h2>
                  <p className="text-muted-foreground">We’re verifying your control of this property. You’ll be notified when it’s approved.</p>
                  <Badge variant="secondary">Pending</Badge></>
              )}
            </CardContent>
          </Card>
        ) : !userId ? (
          <Card><CardContent className="p-8 text-center space-y-3">
            <p className="text-muted-foreground">Sign in with your work account to claim this property.</p>
            <Button variant="hero" asChild><Link to="/auth">Sign in</Link></Button>
          </CardContent></Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Verify your control</CardTitle>
              <CardDescription>Managers can add official content and respond to reviews — but never edit or remove resident reviews.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Your role</Label>
                <div className="flex gap-2 mt-1.5">
                  {['manager', 'staff', 'owner'].map((r) => (
                    <Button key={r} size="sm" variant={form.role === r ? 'default' : 'outline'} onClick={() => setForm({ ...form, role: r })} className="capitalize">{r}</Button>
                  ))}
                </div>
              </div>
              <div><Label htmlFor="company">Management company</Label><Input id="company" className="mt-1.5" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="e.g. Greystar" /></div>
              <div><Label htmlFor="email">Work email</Label><Input id="email" type="email" className="mt-1.5" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="you@managementco.com" /></div>
              <div>
                <Label>Verification method</Label>
                <div className="space-y-2 mt-1.5">
                  {METHODS.map((m) => (
                    <button key={m.key} onClick={() => setForm({ ...form, verification_method: m.key })}
                      className={`w-full text-left rounded-lg border p-3 ${form.verification_method === m.key ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <p className="font-medium text-sm">{m.label}</p><p className="text-xs text-muted-foreground">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <Button variant="hero" className="w-full" onClick={submit} disabled={submitting || !form.contact_email.trim()}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : 'Submit claim for verification'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClaimProperty;
