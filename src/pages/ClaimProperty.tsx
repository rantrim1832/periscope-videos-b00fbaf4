import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, Clock, Building2, Loader2, Mail, Phone, FileText,
  Video, Bell, MessageSquare, CheckCircle2, ArrowRight, Info,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPropertyProvider } from '@/data/propertyProvider';

/* eslint-disable @typescript-eslint/no-explicit-any */

const METHODS = [
  {
    key: 'work_email',
    label: 'Work email',
    icon: Mail,
    desc: 'Fastest. Use an email on the property or management-company domain — we send a one-time verification link.',
    time: 'Usually verified in minutes',
  },
  {
    key: 'phone',
    label: 'Phone callback',
    icon: Phone,
    desc: "We'll call the property's public phone number and confirm you work there.",
    time: 'Usually verified in 1 business day',
  },
  {
    key: 'document',
    label: 'Business document',
    icon: FileText,
    desc: 'Upload a management agreement, business license, or property tax record. Documents are deleted after verification.',
    time: 'Usually verified in 1–2 business days',
  },
];

const BENEFITS = [
  { icon: Video, title: 'Publish official content', desc: 'Add tours, amenity walkthroughs, and photos labeled Official · Verified.' },
  { icon: Bell, title: 'Get review alerts', desc: 'Get notified the moment a resident posts a new video or written review.' },
  { icon: MessageSquare, title: 'Respond to reviews', desc: 'Add public responses so future renters see your side of the story.' },
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

  const status: 'none' | 'pending' | 'approved' | 'rejected' =
    !existing ? 'none' : (existing.status as 'pending' | 'approved' | 'rejected');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Badge variant="secondary" className="w-fit">For property managers</Badge>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" /> Claim this property
          </h1>
          {property && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{property.name}</span>
              {property.addressLine1 ? ` · ${property.addressLine1}` : ''}
              {property.city ? `, ${property.city}` : ''}
              {property.state ? `, ${property.state}` : ''}
            </p>
          )}
        </div>

        {/* Progress */}
        <StatusTimeline status={status} />

        {/* Approved: show public profile / next steps */}
        {status === 'approved' ? (
          <Card>
            <CardHeader className="text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-success" />
              <CardTitle>You're verified as a manager</CardTitle>
              <CardDescription>Your public profile and official content tools are unlocked.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="hero" size="lg" className="w-full" asChild>
                <Link to={`/manage/${propertyId}`}>
                  Edit your public profile <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" asChild>
                  <Link to={`/manage/${propertyId}?kind=website`}>Add website</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/manage/${propertyId}?kind=youtube`}>Add a leasing tour</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/manage/${propertyId}?kind=instagram`}>Connect Instagram</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/property/${propertyId}`}>View property page</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : status === 'pending' ? (
          <Card>
            <CardHeader className="text-center">
              <Clock className="w-12 h-12 mx-auto text-warning" />
              <CardTitle>Claim under review</CardTitle>
              <CardDescription>
                We're verifying your control of this property using the {String(existing.verification_method).replace('_', ' ')} method.
                You'll be notified as soon as it's approved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border p-3 space-y-1">
                <p className="font-medium">Submitted details</p>
                <p className="text-muted-foreground">Role: <span className="capitalize text-foreground">{existing.role}</span></p>
                {existing.company_name && <p className="text-muted-foreground">Company: <span className="text-foreground">{existing.company_name}</span></p>}
                {existing.contact_email && <p className="text-muted-foreground">Contact: <span className="text-foreground">{existing.contact_email}</span></p>}
              </div>
              <Button variant="outline" asChild className="w-full">
                <Link to="/notifications">Check for updates</Link>
              </Button>
            </CardContent>
          </Card>
        ) : status === 'rejected' ? (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">Claim not approved</CardTitle>
              <CardDescription>{existing.rejected_reason || 'We could not verify your control of this property.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You can try again with a different verification method, or contact support for help.
              </p>
              <div className="flex gap-2">
                <Button variant="hero" onClick={() => setExisting(null)}>Try again</Button>
                <Button variant="outline" asChild><Link to="/contact">Contact support</Link></Button>
              </div>
            </CardContent>
          </Card>
        ) : !userId ? (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <p className="text-muted-foreground">Sign in with your work account to claim this property.</p>
              <Button variant="hero" asChild><Link to="/auth">Sign in</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* What you unlock */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader>
                <CardTitle>What claiming unlocks</CardTitle>
                <CardDescription>Free for verified managers. Takes about 2 minutes to submit.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {BENEFITS.map((b) => {
                  const Icon = b.icon;
                  return (
                    <div key={b.title} className="rounded-lg bg-background/60 p-3 space-y-1">
                      <Icon className="w-5 h-5 text-primary" />
                      <p className="font-semibold text-sm">{b.title}</p>
                      <p className="text-xs text-muted-foreground">{b.desc}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Ground rule callout */}
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
              <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-muted-foreground">
                Managers can publish official content and reply to reviews, but they{' '}
                <span className="font-semibold text-foreground">cannot edit, remove, or hide resident reviews</span>. Reviews stay independent.
              </p>
            </div>

            {/* Claim form */}
            <Card>
              <CardHeader>
                <CardTitle>Verify your control</CardTitle>
                <CardDescription>Pick the fastest method available to you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Your role</Label>
                  <div className="flex gap-2 mt-1.5">
                    {['manager', 'staff', 'owner'].map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant={form.role === r ? 'default' : 'outline'}
                        onClick={() => setForm({ ...form, role: r })}
                        className="capitalize"
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="company">Management company</Label>
                  <Input
                    id="company"
                    className="mt-1.5"
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    placeholder="e.g. Greystar"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    className="mt-1.5"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    placeholder="you@managementco.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Never shown publicly. Used only to verify you.</p>
                </div>

                <div>
                  <Label>Verification method</Label>
                  <div className="space-y-2 mt-1.5">
                    {METHODS.map((m) => {
                      const Icon = m.icon;
                      const active = form.verification_method === m.key;
                      return (
                        <button
                          key={m.key}
                          onClick={() => setForm({ ...form, verification_method: m.key })}
                          className={`w-full text-left rounded-lg border p-4 transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{m.label}</p>
                                <Badge variant="outline" className="text-[10px]">{m.time}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  size="lg"
                  onClick={submit}
                  disabled={submitting || !form.contact_email.trim()}
                >
                  {submitting
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
                    : <>Submit claim for verification <ArrowRight className="w-4 h-4 ml-1" /></>}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

// 3-step visual progress: Submit → Verify → Manage
const StatusTimeline = ({ status }: { status: 'none' | 'pending' | 'approved' | 'rejected' }) => {
  const steps = [
    { key: 'submit', label: 'Submit claim' },
    { key: 'verify', label: 'We verify' },
    { key: 'manage', label: 'Manage your page' },
  ] as const;
  const activeIndex = status === 'approved' ? 2 : status === 'pending' ? 1 : 0;

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i < activeIndex || status === 'approved';
        const active = i === activeIndex && status !== 'approved';
        return (
          <div key={s.key} className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? 'bg-success text-success-foreground'
                  : active ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-medium truncate ${done || active ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</p>
            </div>
            {i < steps.length - 1 && (
              <div className={`hidden sm:block h-0.5 flex-1 rounded ${i < activeIndex ? 'bg-success' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ClaimProperty;
