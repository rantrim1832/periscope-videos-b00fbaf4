import { FormEvent, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Link } from 'react-router-dom';
import { LifeBuoy, ShieldAlert } from 'lucide-react';

const TOPICS = [
  ['general', 'General question'],
  ['claim_help', 'Property claim help'],
  ['safety', 'Safety / abuse'],
  ['privacy', 'Privacy request'],
  ['copyright', 'Copyright / DMCA'],
  ['press', 'Press'],
  ['business', 'Business / partnerships'],
] as const;

const Contact = () => {
  useDocumentTitle('Contact Periscope — support, claims, safety', 'Contact Periscope for support, property claim help, privacy, copyright, or safety issues.');
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    topic: 'general',
    email: '',
    subject: '',
    message: '',
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast({ title: 'Add a subject and message', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from('contact_message').insert({
      sender_user_id: auth.user?.id ?? null,
      sender_email: form.email.trim() || auth.user?.email || null,
      topic: form.topic,
      subject: form.subject.trim(),
      message: form.message.trim(),
      source_url: window.location.href,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Could not send message', description: error.message, variant: 'destructive' });
      return;
    }
    setForm({ topic: 'general', email: '', subject: '', message: '' });
    toast({ title: 'Message received', description: 'We will review it from the admin queue.' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold flex items-center gap-2"><LifeBuoy className="w-8 h-8 text-primary" /> Contact Periscope</h1>
          <p className="text-muted-foreground">Support, property claim help, privacy, copyright, safety, and business inquiries.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send a message</CardTitle>
            <CardDescription>Do not include highly sensitive documents here. Use the resident verification flow for lease/utility proof.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <select
                    id="topic"
                    className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  >
                    {TOPICS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="email">Email for follow-up</Label>
                  <Input id="email" type="email" className="mt-1.5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" className="mt-1.5" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" className="mt-1.5 min-h-36" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Share enough detail for us to route this correctly." />
              </div>
              <Button type="submit" variant="hero" disabled={submitting}>{submitting ? 'Sending...' : 'Send message'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <h2 className="font-semibold">Need to report content?</h2>
                <p className="text-sm text-muted-foreground">Use the report form for threats, doxxing, nudity, copyright, privacy, fake content, or property-info issues.</p>
              </div>
            </div>
            <Button variant="outline" asChild><Link to="/report">Report content</Link></Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Contact;
