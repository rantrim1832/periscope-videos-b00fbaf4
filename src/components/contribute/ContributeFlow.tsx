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
  PartyPopper, Clock, XCircle, Check,
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
import { CONTRIBUTION_TOPICS } from '@/domain/contributionTopics';

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
          <CardContent className="space-y-5 pt-6">
            {/* HERO: the actual upload action comes first so the page reads as "upload your video". */}
            {(draft.type === 'video' || draft.type === 'photo') && (
              <div className="border-2 border-dashed border-primary/40 rounded-xl p-8 md:p-10 text-center bg-primary/[0.04]">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <p className="text-base md:text-lg font-semibold">
                  {draft.type === 'video' ? 'Upload your video' : 'Upload your photo'}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Under 3 min works best. Processed securely — your address is never shown.
                </p>
                <Button variant="hero" size="lg" className="mt-4" onClick={async () => {
                  const up = await createContributionUpload();
                  set({ mediaAssetId: up.assetId });
                  toast({ title: 'Upload ready', description: `Provider: ${up.provider}` });
                }}>
                  <Upload className="w-4 h-4" /> Choose file
                </Button>
                {draft.mediaAssetId && (
                  <p className="text-xs text-success mt-3 font-medium">✓ Video attached</p>
                )}
              </div>
            )}

            {draft.type === 'import' && (
              <div className="rounded-xl border border-primary/40 bg-primary/[0.04] p-6 space-y-2">
                <Label htmlFor="import-url" className="text-base font-semibold">Paste your public video link</Label>
                <p className="text-xs text-muted-foreground -mt-1">YouTube, TikTok, or Instagram — we'll embed it with attribution.</p>
                <Input
                  id="import-url"
                  className="mt-2 h-11"
                  placeholder="https://www.tiktok.com/@you/video/…"
                  value={draft.importUrl ?? ''}
                  onChange={(e) => set({ importUrl: e.target.value })}
                />
                {draft.importUrl && (
                  parseEmbed(draft.importUrl)
                    ? <p className="text-xs text-success">{parseEmbed(draft.importUrl)!.platform} video detected.</p>
                    : <p className="text-xs text-destructive">Unrecognized link. Supported: YouTube, TikTok, Instagram.</p>
                )}
              </div>
            )}

            {/* Format switcher — small, secondary, below the primary action */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">Not filming?</span>
              {TYPES.filter((t) => t.key !== draft.type).map((t) => (
                <Button key={t.key} type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs"
                  onClick={() => set({ type: t.key })}>
                  <t.icon className="w-3.5 h-3.5 mr-1" /> {t.key === 'text' ? 'Write it instead' : t.key === 'import' ? 'Import a link' : t.key === 'photo' ? 'Upload a photo' : 'Record video'}
                </Button>
              ))}
            </div>

            <div className="pt-2 border-t">
              <Label className="mb-2 block">Which part of living there?</Label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <Button key={s} type="button" size="sm" variant={draft.lifeStage === s ? 'default' : 'outline'} onClick={() => set({ lifeStage: s })}>
                    {LIFE_STAGE_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>

            <TopicPicker draft={draft} set={set} />

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" className="mt-1.5"
                placeholder={activeTopic?.titlePlaceholder ?? 'e.g. Charged most of my deposit for nothing'}
                value={draft.title} onChange={(e) => set({ title: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="body">{draft.type === 'text' ? 'Your review *' : 'Details (optional)'}</Label>
              <Textarea id="body" className="mt-1.5 min-h-[100px]"
                placeholder={draft.type === 'text'
                  ? 'Share what living here was actually like — the good and the bad.'
                  : 'Add anything the video doesn\'t already show.'}
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

// Renter-facing topic chips. Users pick one primary topic (drives title
// placeholder + life stage) and any number of secondary tags — categories
// cross-cut, so a "noise" video can also be tagged "neighbors" and "walls".
const TopicPicker = ({
  draft, set,
}: {
  draft: ContributionDraft;
  set: (patch: Partial<ContributionDraft>) => void;
}) => {
  const renterTopics = useMemo(
    () => Object.values(CONTRIBUTION_TOPICS).filter((t) => t.audience === 'resident'),
    [],
  );
  const managerTopics = useMemo(
    () => Object.values(CONTRIBUTION_TOPICS).filter((t) => t.audience === 'manager'),
    [],
  );
  const selectedTags = new Set(draft.tags ?? []);
  const [pickerOpen, setPickerOpen] = useState(!draft.topic);
  const [showAllTags, setShowAllTags] = useState(false);
  const activeTopic = draft.topic ? CONTRIBUTION_TOPICS[draft.topic] : undefined;
  const topicGroups = useMemo(() => ([
    {
      label: 'Start here',
      keys: ['record-review', 'loved-it', 'full-tour', 'unit-tour', 'day-in-life'],
    },
    {
      label: 'Building reality',
      keys: ['management', 'maintenance', 'property-condition', 'amenities-real', 'noise', 'safety', 'pests'],
    },
    {
      label: 'Daily life',
      keys: ['parking', 'pets', 'packages', 'laundry', 'hvac', 'wifi-signal', 'commute', 'wfh-setup', 'families-schools', 'accessibility', 'local-vibe', 'staff-shoutout'],
    },
    {
      label: 'Money & moving',
      keys: ['pricing', 'application', 'move-in-day', 'move-out', 'deposit-return', 'renewal-negotiation', 'red-flags'],
    },
  ]), []);

  const pickTopic = (key: string) => {
    const topic = CONTRIBUTION_TOPICS[key];
    if (!topic) return;
    const nextTags = Array.from(new Set([...(draft.tags ?? []), ...topic.tags]));
    set({ topic: key, tags: nextTags, lifeStage: topic.lifeStage });
    setPickerOpen(false);
  };
  const toggleTag = (tag: string) => {
    const next = new Set(draft.tags ?? []);
    if (next.has(tag)) next.delete(tag); else next.add(tag);
    set({ tags: Array.from(next) });
  };

  const allTags = Array.from(
    new Set(Object.values(CONTRIBUTION_TOPICS).flatMap((t) => t.tags)),
  ).sort();

  // Suggested tags = tags from the picked topic + a small curated set of common
  // cross-cutting tags, so users aren't drowning in an alphabetical dump.
  const suggestedTags = useMemo(() => {
    const base = new Set<string>(activeTopic?.tags ?? []);
    ['noise', 'parking', 'maintenance', 'management', 'safety', 'pets', 'deposit', 'amenities']
      .forEach((t) => base.add(t));
    (draft.tags ?? []).forEach((t) => base.add(t));
    return Array.from(base).sort();
  }, [activeTopic, draft.tags]);

  const visibleTags = showAllTags ? allTags : suggestedTags;

  return (
    <div className="pt-4 border-t space-y-4">
      <div className="rounded-xl border bg-muted/30 p-3 md:p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Label className="text-sm font-semibold">What's this about?</Label>
            <p className="mt-1 text-sm font-semibold leading-tight text-foreground">
              {activeTopic?.label ?? 'Choose a review topic'}
            </p>
            {activeTopic && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{activeTopic.hint}</p>}
          </div>
          <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => setPickerOpen((open) => !open)}>
            {pickerOpen ? 'Done' : 'Change'}
          </Button>
        </div>

        {pickerOpen && (
          <div className="space-y-3">
            {topicGroups.map((group) => {
              const topics = group.keys.map((key) => CONTRIBUTION_TOPICS[key]).filter(Boolean);
              return (
                <div key={group.label}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                    {topics.map((t) => {
                      const active = draft.topic === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => pickTopic(t.key)}
                          className={`min-h-[44px] shrink-0 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                            active
                              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                              : 'border-border bg-background text-foreground hover:border-primary hover:text-primary'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            {active && <Check className="h-3.5 w-3.5" />}
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <details className="group rounded-lg border border-dashed bg-background/70 p-3">
              <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground">
                Manager / official topics
              </summary>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {managerTopics.map((t) => {
                  const active = draft.topic === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => pickTopic(t.key)}
                      className={`min-h-[40px] shrink-0 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background hover:border-primary hover:text-primary'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <Label className="text-sm font-semibold">
            Tags <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          {selectedTags.size > 0 && (
            <span className="text-xs text-muted-foreground">{selectedTags.size} selected</span>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {visibleTags.map((tag) => {
            const active = selectedTags.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary border-primary'
                    : 'bg-background border-border text-muted-foreground hover:border-primary hover:text-foreground'
                }`}
              >
                #{tag}
              </button>
            );
          })}
          {!showAllTags && allTags.length > visibleTags.length && (
            <button
              type="button"
              onClick={() => setShowAllTags(true)}
              className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-dashed text-muted-foreground hover:text-foreground hover:border-primary"
            >
              + {allTags.length - visibleTags.length} more
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


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
