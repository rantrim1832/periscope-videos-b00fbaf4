import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Video, Camera, FileText, Link2, ShieldCheck, Upload, Loader2, Share2,
  PartyPopper, Clock, XCircle,
} from 'lucide-react';
import { parseEmbed } from '@/services/providers/embed';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from './StarRating';
import {
  emptyDraft, LIFE_STAGE_CATEGORIES, type ContributionDraft, type ContributionType,
  type SubmissionResult,
} from '@/domain/contribution';
import { LIFE_STAGE_LABELS, type LifeStage } from '@/domain/property';
import { CATEGORY_LABELS } from '@/domain/truthScore';
import { submitContribution, createContributionUpload } from '@/services/contributionService';
import { getContributionTopic } from '@/domain/contributionTopics';

const TYPES: { key: ContributionType; icon: typeof Video; title: string; desc: string }[] = [
  { key: 'video', icon: Video, title: 'Video', desc: 'Record or upload a video of the property.' },
  { key: 'import', icon: Link2, title: 'Import a post', desc: 'Link an existing TikTok, YouTube, or Instagram post.' },
  { key: 'photo', icon: Camera, title: 'Photo', desc: 'Upload a photo of the unit, amenity, or issue.' },
  { key: 'text', icon: FileText, title: 'Written', desc: 'Submit a written review.' },
];

const STAGES: LifeStage[] = ['moveIn', 'living', 'maintenance', 'moveOut', 'deposit'];

export const ContributeFlow = ({ propertyId, propertyName, topic }: { propertyId: string; propertyName: string; topic?: string | null }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const activeTopic = getContributionTopic(topic);
  const [step, setStep] = useState(activeTopic ? 2 : 1);
  const [draft, setDraft] = useState<ContributionDraft>(() => {
    const base = emptyDraft(propertyId, propertyName);
    if (!activeTopic) return base;
    return {
      ...base,
      type: 'video',
      lifeStage: activeTopic.lifeStage,
      topic: activeTopic.key,
      tags: activeTopic.tags,
      title: '',
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setHasSession(!!session));
  }, []);

  const set = (patch: Partial<ContributionDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const categories = useMemo(() => LIFE_STAGE_CATEGORIES[draft.lifeStage], [draft.lifeStage]);

  const submit = async () => {
    if (!hasSession) {
      toast({ title: 'Sign in to post', description: 'Your identity stays private — verification proves residency, not who you are.' });
      navigate('/auth');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitContribution(draft);
      setResult(res);
    } catch {
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const share = async () => {
    const text = `I reviewed ${propertyName} on Periscope.`;
    try {
      if (navigator.share) await navigator.share({ title: propertyName, text, url: `${window.location.origin}/property/${propertyId}` });
      else {
        await navigator.clipboard.writeText(`${text} ${window.location.origin}/property/${propertyId}`);
        toast({ title: 'Link copied' });
      }
    } catch { /* cancelled */ }
  };

  if (result) return <ResultScreen result={result} propertyId={propertyId} onShare={share} />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Stepper step={step} />

      {activeTopic && (
        <div className="flex items-center flex-wrap gap-2 text-sm">
          <Badge variant="secondary" className="uppercase tracking-wide text-[10px]">Topic</Badge>
          <span className="font-semibold">{activeTopic.label}</span>
          <span className="text-muted-foreground">— {activeTopic.hint}</span>
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>How do you want to submit?</CardTitle>
            <CardDescription>Video contributions carry the most weight.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TYPES.map((t) => {
              const Icon = t.icon;
              const active = draft.type === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => { set({ type: t.key }); setStep(2); }}
                  className={`text-left rounded-lg border p-4 transition-all hover:border-primary ${active ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <Icon className="w-7 h-7 text-primary mb-2" />
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Review {propertyName}</CardTitle>
            <CardDescription>Video carries the most weight — but a written review with ratings still helps every future renter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="mb-2 block">Format</Label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = draft.type === t.key;
                  return (
                    <Button
                      key={t.key}
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      onClick={() => set({ type: t.key })}
                    >
                      <Icon className="w-4 h-4 mr-1.5" /> {t.title}
                      {t.key === 'video' && !active && <span className="ml-1.5 text-[10px] uppercase tracking-wider opacity-70">Recommended</span>}
                    </Button>
                  );
                })}
              </div>
              {draft.type === 'text' && (
                <p className="text-xs text-muted-foreground mt-2">Written reviews are welcome — a short video makes yours ~4× more useful, if you can.</p>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Which part of living there?</Label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <Button key={s} type="button" size="sm" variant={draft.lifeStage === s ? 'default' : 'outline'} onClick={() => set({ lifeStage: s })}>
                    {LIFE_STAGE_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>

            {draft.type === 'import' && (
              <div className="space-y-2">
                <Label htmlFor="import-url">Link to your public video</Label>
                <Input
                  id="import-url"
                  className="mt-1"
                  placeholder="https://www.tiktok.com/@you/video/… or a YouTube/Instagram link"
                  value={draft.importUrl ?? ''}
                  onChange={(e) => set({ importUrl: e.target.value })}
                />
                {draft.importUrl && (
                  parseEmbed(draft.importUrl)
                    ? <p className="text-xs text-success">{parseEmbed(draft.importUrl)!.platform} video detected — will be embedded with attribution (not re-hosted).</p>
                    : <p className="text-xs text-destructive">Unrecognized link. Supported: YouTube, TikTok, Instagram.</p>
                )}
              </div>
            )}

            {(draft.type === 'video' || draft.type === 'photo') && (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/20">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Upload your {draft.type}</p>
                <p className="text-xs text-muted-foreground mt-1">Processed securely; your address is never shown.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={async () => {
                  const up = await createContributionUpload();
                  set({ mediaAssetId: up.assetId });
                  toast({ title: 'Upload ready', description: `Provider: ${up.provider}` });
                }}>
                  Choose file
                </Button>
                {draft.mediaAssetId && <p className="text-xs text-success mt-2">Media attached</p>}
              </div>
            )}

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" className="mt-1.5"
                placeholder={activeTopic?.titlePlaceholder ?? 'e.g. Charged most of my deposit for nothing'}
                value={draft.title} onChange={(e) => set({ title: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="body">Details</Label>
              <Textarea id="body" className="mt-1.5 min-h-[100px]" placeholder="Describe conditions, management, charges, or other relevant details."
                value={draft.body} onChange={(e) => set({ body: e.target.value })} />
            </div>

            <div>
              <Label className="mb-1 block">Rate what you experienced</Label>
              <div className="rounded-lg border p-3">
                {categories.map((key) => (
                  <StarRating key={key} label={CATEGORY_LABELS[key]} value={draft.ratings[key]}
                    onChange={(v) => set({ ratings: { ...draft.ratings, [key]: v } })} />
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Would you lease here again?</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={draft.wouldLeaseAgain === true ? 'default' : 'outline'} onClick={() => set({ wouldLeaseAgain: true })}>Yes</Button>
                <Button type="button" size="sm" variant={draft.wouldLeaseAgain === false ? 'default' : 'outline'} onClick={() => set({ wouldLeaseAgain: false })}>No</Button>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button
                variant="hero"
                disabled={!draft.title.trim() || (draft.type === 'import' && !parseEmbed(draft.importUrl ?? ''))}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Build trust (optional)</CardTitle>
            <CardDescription>Verified residents carry far more weight — and it's private.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={() => set({ trustTier: 'unverified', verificationMethod: 'none' })}
              className={`w-full text-left rounded-lg border p-4 ${draft.trustTier === 'unverified' ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <p className="font-semibold">Post now, unverified</p>
              <p className="text-xs text-muted-foreground">Counts less toward the rating, and clearly labeled.</p>
            </button>
            <button
              onClick={() => set({ trustTier: 'likely_resident', verificationMethod: 'lease' })}
              className={`w-full text-left rounded-lg border p-4 ${draft.trustTier !== 'unverified' ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <p className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-success" /> I can prove I lived here</p>
              <p className="text-xs text-muted-foreground">Lease / utility / GPS. We verify residency, not your identity, then delete the document.</p>
            </button>

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input type="checkbox" checked={draft.anonymous} onChange={(e) => set({ anonymous: e.target.checked })} className="rounded" />
              <span className="text-sm">Post anonymously (your identity stays hidden)</span>
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">You'll appear as:</span>
              <Badge variant={draft.trustTier === 'verified_resident' ? 'success' : draft.trustTier === 'likely_resident' ? 'secondary' : 'outline'}>
                {draft.trustTier === 'unverified' ? 'Unverified' : draft.trustTier === 'likely_resident' ? 'Likely resident' : 'Verified resident'}
              </Badge>
            </div>
            {draft.trustTier !== 'unverified' && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/verify/${propertyId}`)}>
                <ShieldCheck className="w-4 h-4 mr-2" /> Verify residency now (GPS or document)
              </Button>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button variant="hero" onClick={() => setStep(4)}>Review</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & post</CardTitle>
            <CardDescription>One last look before it helps the next renter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="font-semibold">{draft.title || '(no title)'}</p>
              {draft.body && <p className="text-sm text-muted-foreground">{draft.body}</p>}
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="muted">{LIFE_STAGE_LABELS[draft.lifeStage]}</Badge>
                <Badge variant="outline" className="capitalize">{draft.type}</Badge>
                {draft.mediaAssetId && <Badge variant="success">Media attached</Badge>}
                {draft.wouldLeaseAgain != null && <Badge variant="muted">Would lease again: {draft.wouldLeaseAgain ? 'Yes' : 'No'}</Badge>}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              By posting you confirm this reflects your genuine experience. Content is screened before it appears; anything uncertain is held for review.
            </p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button variant="hero" onClick={submit} disabled={submitting}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : 'Submit review'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Stepper = ({ step }: { step: number }) => (
  <div className="flex items-center gap-2">
    {[1, 2, 3, 4].map((n) => (
      <div key={n} className={`h-1.5 flex-1 rounded-full ${step >= n ? 'bg-primary' : 'bg-muted'}`} />
    ))}
  </div>
);

const ResultScreen = ({ result, propertyId, onShare }: { result: SubmissionResult; propertyId: string; onShare: () => void }) => {
  const map = {
    published: {
      icon: PartyPopper, color: 'text-success',
      title: 'Review submitted', desc: 'Your review is now visible on the property page.',
    },
    pending: {
      icon: Clock, color: 'text-warning',
      title: "You're in review", desc: 'We hold anything uncertain for a quick human check before it appears. You did nothing wrong.',
    },
    rejected: {
      icon: XCircle, color: 'text-destructive',
      title: 'This didn’t pass our guidelines', desc: result.reason || 'It may contain content we can’t publish. You can edit and try again, or appeal.',
    },
  }[result.status];
  const Icon = map.icon;

  return (
    <Card className="max-w-xl mx-auto text-center">
      <CardContent className="p-10 space-y-4">
        <Icon className={`w-14 h-14 mx-auto ${map.color}`} />
        <h2 className="text-2xl font-bold">{map.title}</h2>
        <p className="text-muted-foreground">{map.desc}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {result.status === 'published' && (
            <>
              <Button variant="hero" onClick={onShare}><Share2 className="w-4 h-4 mr-2" /> Share</Button>
              <Button variant="outline" asChild><Link to="/profile">View profile</Link></Button>
            </>
          )}
          <Button variant="outline" asChild><Link to={`/property/${propertyId}`}>Back to property</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
};
