import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Upload, ShieldCheck, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/lib/demo';
import { getPropertyProvider } from '@/data/propertyProvider';
import { useToast } from '@/hooks/use-toast';

const Verify = () => {
  const { propertyId = '' } = useParams();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{ tier?: string; status?: string; message: string } | null>(null);

  const { data: property } = useQuery({ queryKey: ['verify-prop', propertyId], queryFn: () => getPropertyProvider().getProperty(propertyId) });

  const call = async (body: Record<string, unknown>, key: string) => {
    if (isDemoMode()) {
      toast({ title: 'Available on the live app', description: 'Verification runs against real property data.' });
      return;
    }
    setBusy(key);
    try {
      const { data, error } = await supabase.functions.invoke('verify-residency', { body: { propertyId, ...body } });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setResult(data as { tier?: string; status?: string; message: string });
    } catch (e) {
      toast({ title: 'Verification failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const verifyGps = () => {
    if (isDemoMode()) { call({}, 'gps'); return; }
    if (!navigator.geolocation) { toast({ title: 'Geolocation unavailable', variant: 'destructive' }); return; }
    setBusy('gps');
    navigator.geolocation.getCurrentPosition(
      (pos) => call({ method: 'gps_dwell', latitude: pos.coords.latitude, longitude: pos.coords.longitude }, 'gps'),
      () => { setBusy(null); toast({ title: 'Location permission needed', description: 'Allow location to verify by GPS.', variant: 'destructive' }); },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck className="w-7 h-7" /> Verify your residency</h1>
          {property && <p className="text-muted-foreground">{property.name}{property.city ? `, ${property.city}` : ''}</p>}
          <p className="text-sm text-muted-foreground mt-2">Verification proves you lived here — not who you are. Your reviews stay pseudonymous.</p>
        </div>

        {result ? (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              {result.tier === 'likely_resident' ? <ShieldCheck className="w-12 h-12 mx-auto text-success" /> : <Clock className="w-12 h-12 mx-auto text-warning" />}
              <h2 className="text-xl font-bold">{result.message}</h2>
              {result.tier && <Badge variant="success">Likely Resident</Badge>}
              {result.status === 'pending' && <Badge variant="secondary">Verified Resident — pending review</Badge>}
              <div><Button variant="hero" asChild className="mt-2"><Link to={`/property/${propertyId}`}>Back to property</Link></Button></div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Quick — by location</CardTitle>
                <CardDescription>Verify you're at the property now → Likely Resident.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={verifyGps} disabled={busy === 'gps'}>
                  {busy === 'gps' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking…</> : 'Verify with GPS'}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> Strongest — by document</CardTitle>
                <CardDescription>Lease or utility bill → Verified Resident (reviewed, then deleted).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/20">
                  <Upload className="w-7 h-7 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Address is matched, then the document is deleted.</p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => call({ method: 'lease' }, 'doc')} disabled={busy === 'doc'}>
                  {busy === 'doc' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : 'Submit document'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verify;
