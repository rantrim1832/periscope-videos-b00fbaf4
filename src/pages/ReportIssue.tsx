import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Flag, ShieldCheck } from 'lucide-react';

const REPORT_TYPES = [
  ['abuse', 'Abuse / harassment'],
  ['doxxing', 'Doxxing / private information'],
  ['threat', 'Threat or violence'],
  ['nudity', 'Nudity / sexual content'],
  ['copyright', 'Copyright / DMCA'],
  ['privacy', 'Privacy / identity concern'],
  ['fake_content', 'Fake or manipulated content'],
  ['property_info', 'Incorrect property information'],
  ['other', 'Other'],
] as const;

const TARGET_TYPES = [
  ['property', 'Property page'],
  ['review', 'Review'],
  ['video', 'Video / social embed'],
  ['comment', 'Comment / answer'],
  ['profile', 'Profile'],
  ['source', 'Official/public source'],
  ['other', 'Other'],
] as const;

const ReportIssue = () => {
  useDocumentTitle('Report content — Periscope safety', 'Report abuse, threats, doxxing, copyright, privacy, fake content, or incorrect property information.');
  const { toast } = useToast();
  const [params] = useSearchParams();
  const initialUrl = useMemo(() => params.get('url') ?? document.referrer ?? '', [params]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    reportType: params.get('type') ?? 'abuse',
    targetType: params.get('target_type') ?? 'other',
    targetId: params.get('target_id') ?? '',
    targetUrl: initialUrl,
    email: '',
    description: '',
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.description.trim()) {
      toast({ title: 'Describe what should be reviewed', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from('safety_report').insert({
      reporter_user_id: auth.user?.id ?? null,
      reporter_email: form.email.trim() || auth.user?.email || null,
      report_type: form.reportType,
      target_type: form.targetType,
      target_id: form.targetId.trim() || null,
      target_url: form.targetUrl.trim() || window.location.href,
      description: form.description.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not submit report', description: error.message, variant: 'destructive' });
      return;
    }
    setForm({ ...form, description: '', email: '' });
    toast({ title: 'Report submitted', description: 'An admin can now review it. If there is immediate danger, contact emergency services.' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold flex items-center gap-2"><Flag className="w-8 h-8 text-destructive" /> Report content or safety issue</h1>
          <p className="text-muted-foreground">Report threats, doxxing, nudity, copyright, privacy concerns, fake content, or incorrect property information.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What should be reviewed?</CardTitle>
            <CardDescription>Reports go to an admin queue. We preserve resident truth while removing content that creates legal, privacy, or safety risk.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="reportType">Issue type</Label>
                  <select id="reportType" className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value })}>
                    {REPORT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="targetType">Content type</Label>
                  <select id="targetType" className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}>
                    {TARGET_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="targetId">Content/property ID (optional)</Label>
                  <Input id="targetId" className="mt-1.5" value={form.targetId} onChange={(e) => setForm({ ...form, targetId: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="email">Email for follow-up (optional)</Label>
                  <Input id="email" type="email" className="mt-1.5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <Label htmlFor="targetUrl">URL</Label>
                <Input id="targetUrl" className="mt-1.5" value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} placeholder="https://joinperiscope.com/property/..." />
              </div>
              <div>
                <Label htmlFor="description">Details</Label>
                <Textarea id="description" className="mt-1.5 min-h-40" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is the issue? Include timestamps for video, screenshots, or context where helpful." />
              </div>
              <Button type="submit" variant="destructive" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit report'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-muted/40">
          <CardContent className="p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Reports are not a tool for suppressing honest negative resident experiences. Property managers may respond and add context, but resident truth cannot be removed just because it is unfavorable.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ReportIssue;
