import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateVerificationCode, type CreatorChannel, type CreatorSubmission } from '@/lib/creatorTypes';
import { CheckCircle2, ShieldCheck, Youtube, Copy, ExternalLink, Upload, Send } from 'lucide-react';

export default function CreatorDashboard() {
  const nav = useNavigate();
  const { toast } = useToast();
  const [channel, setChannel] = useState<CreatorChannel | null>(null);
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>([]);
  const [claimedVideos, setClaimedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [ytInput, setYtInput] = useState('');
  const [linkingYt, setLinkingYt] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [website, setWebsite] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { nav('/auth?returnTo=' + encodeURIComponent('/creator/dashboard')); return; }
    const { data: ch } = await (supabase as any).from('creator_channels').select('*').eq('user_id', user.id).maybeSingle();
    if (!ch) { nav('/creator/apply'); return; }
    setChannel(ch);
    setBio(ch.bio ?? '');
    setInstagram(ch.instagram_url ?? '');
    setTiktok(ch.tiktok_url ?? '');
    setWebsite(ch.website_url ?? '');
    const [subs, vids] = await Promise.all([
      (supabase as any).from('creator_submissions').select('*').eq('creator_id', ch.id).order('created_at', { ascending: false }),
      (supabase as any).from('seeded_videos').select('id, title, embed_url, hashtags').eq('creator_id', ch.id).limit(20),
    ]);
    setSubmissions(subs.data ?? []);
    setClaimedVideos(vids.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const linkYouTube = async () => {
    if (!ytInput.trim() || !channel) return;
    setLinkingYt(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-verify-channel', { body: { input: ytInput } });
      if (error) throw error;
      const code = channel.verification_code ?? generateVerificationCode();
      const { error: upErr } = await (supabase as any).from('creator_channels').update({
        youtube_channel_id: data.id,
        youtube_url: `https://www.youtube.com/channel/${data.id}`,
        verification_code: code,
        verification_requested_at: new Date().toISOString(),
        avatar_url: channel.avatar_url ?? data.thumbnail,
      }).eq('id', channel.id);
      if (upErr) throw upErr;
      toast({ title: 'YouTube channel linked', description: 'Now paste the verification code into your channel description.' });
      load();
    } catch (e: any) {
      toast({ title: 'Could not link channel', description: e.message ?? String(e), variant: 'destructive' });
    } finally { setLinkingYt(false); }
  };

  const runVerify = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-creator-channel', { body: {} });
      if (error) throw error;
      if (data?.verified) {
        toast({ title: 'Verified!', description: `Auto-claimed ${data.claimed_count ?? 0} existing videos.` });
        load();
      } else {
        toast({ title: 'Not verified yet', description: data?.error ?? 'Make sure the code is saved in your YouTube channel description.', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Verification failed', description: e.message ?? String(e), variant: 'destructive' });
    } finally { setVerifying(false); }
  };

  const submitVideo = async () => {
    if (!videoUrl.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('submit-creator-video', { body: { youtube_url: videoUrl } });
      if (error) throw error;
      toast({ title: 'Submitted for review', description: 'An editor will approve it shortly.' });
      setVideoUrl('');
      load();
    } catch (e: any) {
      toast({ title: 'Submission failed', description: e.message ?? String(e), variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const saveProfile = async () => {
    if (!channel) return;
    setSavingProfile(true);
    const { error } = await (supabase as any).from('creator_channels').update({
      bio: bio.trim() || null,
      instagram_url: instagram.trim() || null,
      tiktok_url: tiktok.trim() || null,
      website_url: website.trim() || null,
    }).eq('id', channel.id);
    setSavingProfile(false);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    else toast({ title: 'Profile saved' });
    load();
  };

  if (loading || !channel) return <div className="min-h-screen bg-background"><Header /><div className="container py-16 text-center text-muted-foreground">Loading…</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-4xl py-8 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{channel.display_name}</h1>
              {channel.verified && <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
              <Badge variant="outline">{channel.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">periscope.com/channel/{channel.handle}</p>
          </div>
          <Button variant="outline" asChild><Link to={`/channel/${channel.handle}`}>View public page <ExternalLink className="h-3.5 w-3.5 ml-1" /></Link></Button>
        </div>

        <section className="rounded-2xl border p-6 bg-card space-y-4">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">YouTube verification</h2>
          </div>
          {!channel.youtube_channel_id ? (
            <>
              <p className="text-sm text-muted-foreground">Paste your YouTube channel URL, @handle, or channel ID. We'll fetch your channel and issue a verification code.</p>
              <div className="flex gap-2">
                <Input value={ytInput} onChange={(e) => setYtInput(e.target.value)} placeholder="https://youtube.com/@your-handle" />
                <Button onClick={linkYouTube} disabled={linkingYt}>{linkingYt ? 'Linking…' : 'Link channel'}</Button>
              </div>
            </>
          ) : channel.verified ? (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" /> Verified on {new Date(channel.verified_at!).toLocaleDateString()}
            </div>
          ) : (
            <>
              <p className="text-sm">Linked to YouTube channel <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{channel.youtube_channel_id}</code></p>
              <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Step 1 — Copy this code</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm bg-background border rounded px-3 py-2 select-all">{channel.verification_code}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(channel.verification_code!); toast({ title: 'Copied' }); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Step 2 — Add it anywhere in your YouTube channel description (YouTube Studio → Customization → Basic info → Description), then save.</p>
                <p className="text-xs text-muted-foreground mt-1">Step 3 — Click verify below. You can remove the code once verified.</p>
                <Button onClick={runVerify} disabled={verifying} className="mt-4">
                  {verifying ? 'Checking…' : 'Verify now'}
                </Button>
              </div>
            </>
          )}
        </section>

        {channel.verified && (
          <section className="rounded-2xl border p-6 bg-card space-y-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Submit a video</h2>
            </div>
            <p className="text-sm text-muted-foreground">Paste a YouTube URL from your channel. An editor reviews and it gets attributed to you on Periscope.</p>
            <div className="flex gap-2">
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              <Button onClick={submitVideo} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</Button>
            </div>
            <div className="text-xs text-muted-foreground border-t pt-3">
              <Upload className="h-3.5 w-3.5 inline mr-1" /> Native uploads coming soon — for now, publish on YouTube and submit the URL here.
            </div>
          </section>
        )}

        {submissions.length > 0 && (
          <section className="rounded-2xl border p-6 bg-card space-y-3">
            <h2 className="text-lg font-semibold">Your submissions</h2>
            <div className="divide-y">
              {submissions.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.title ?? s.youtube_url}</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={s.status === 'approved' ? 'default' : s.status === 'rejected' ? 'destructive' : 'outline'}>{s.status}</Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {claimedVideos.length > 0 && (
          <section className="rounded-2xl border p-6 bg-card space-y-3">
            <h2 className="text-lg font-semibold">Attributed to you ({claimedVideos.length})</h2>
            <ul className="space-y-2 text-sm">
              {claimedVideos.map((v) => (
                <li key={v.id}><Link to={`/watch/${v.id}`} className="hover:text-primary hover:underline">{v.title}</Link></li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border p-6 bg-card space-y-4">
          <h2 className="text-lg font-semibold">Channel profile</h2>
          <div>
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={500} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Instagram URL</Label><Input value={instagram} onChange={(e) => setInstagram(e.target.value)} /></div>
            <div><Label>TikTok URL</Label><Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
          </div>
          <Button onClick={saveProfile} disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save profile'}</Button>
        </section>
      </div>
    </div>
  );
}