import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { slugifyHandle } from '@/lib/creatorTypes';
import { Video, CheckCircle2 } from 'lucide-react';

export default function CreatorApply() {
  const nav = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [existing, setExisting] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { nav('/auth?returnTo=' + encodeURIComponent('/creator/apply')); return; }
      const { data } = await (supabase as any).from('creator_channels').select('*').eq('user_id', user.id).maybeSingle();
      setExisting(data);
      setChecking(false);
    })();
  }, [nav]);

  const submit = async () => {
    if (!displayName.trim() || !handle.trim()) {
      toast({ title: 'Name and handle required', variant: 'destructive' }); return;
    }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }
    const { error } = await (supabase as any).from('creator_channels').insert({
      user_id: user.id,
      display_name: displayName.trim(),
      handle: slugifyHandle(handle),
      bio: bio.trim() || null,
      status: 'pending',
    });
    setBusy(false);
    if (error) {
      toast({ title: 'Could not create channel', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Application submitted', description: 'You can now set up your channel.' });
    nav('/creator/dashboard');
  };

  if (checking) return <div className="min-h-screen bg-background"><Header /><div className="container py-16 text-center text-muted-foreground">Loading…</div></div>;

  if (existing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-2xl py-12">
          <div className="rounded-2xl border p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold">You already have a creator channel</h1>
            <p className="text-muted-foreground mt-2">Status: <span className="font-medium text-foreground">{existing.status}</span></p>
            <Button asChild className="mt-6"><Link to="/creator/dashboard">Go to dashboard</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-2xl py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-3"><Video className="h-5 w-5 text-primary-foreground" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Become a Periscope Creator</h1>
            <p className="text-muted-foreground mt-1">Get your own channel page. Claim videos we already embedded, submit new ones, and reach renters and managers looking for real building tours.</p>
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border p-6 bg-card">
          <div>
            <Label htmlFor="dn">Channel display name</Label>
            <Input id="dn" value={displayName} onChange={(e) => { setDisplayName(e.target.value); if (!handle) setHandle(slugifyHandle(e.target.value)); }} placeholder="Urban Living NYC" />
          </div>
          <div>
            <Label htmlFor="hd">Handle</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">periscope.com/channel/</span>
              <Input id="hd" value={handle} onChange={(e) => setHandle(slugifyHandle(e.target.value))} placeholder="urban-living-nyc" />
            </div>
          </div>
          <div>
            <Label htmlFor="bio">Short bio (optional)</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="What kind of apartment content do you make?" maxLength={500} />
          </div>
          <Button onClick={submit} disabled={busy} size="lg" className="w-full">
            {busy ? 'Submitting…' : 'Create my channel'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">You'll verify YouTube ownership in the next step.</p>
        </div>
      </div>
    </div>
  );
}