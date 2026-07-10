import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CURATED_CATEGORIES } from '@/lib/curatedCategories';
import { parseEmbed } from '@/services/providers/embed';
import { Loader2, Youtube, Link2, Trash2, Sparkles, Plus, Save, Pencil } from 'lucide-react';
import { Building2, Star, Eye } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { CategoryLibraryBrowser } from '@/components/admin/CategoryLibraryBrowser';
import { getPublicSupabasePublishableKey, getPublicSupabaseUrl } from '@/services/env';

type Row = {
  id: string;
  title: string;
  embed_url: string;
  caption: string | null;
  hashtags: string[] | null;
  source: string;
  created_at: string;
  moderation_status: string;
};

type Category = {
  id: string;
  slug: string;
  label: string;
  hint: string;
  feed_category: string;
  suggested_queries: string[];
  sort_order: number;
  is_active: boolean;
};

type YouTubePreviewCandidate = {
  videoId: string;
  title: string;
  channel: string;
  description: string;
  thumbnail: string;
  watchUrl: string;
  alreadyImported: boolean;
};

type YouTubePreviewResult = {
  totalFound: number;
  alreadyImported: number;
  candidates: YouTubePreviewCandidate[];
  error?: string;
  quotaExceeded?: boolean;
};

const YOUTUBE_FUNCTION_URL = `${String(getPublicSupabaseUrl() ?? '').replace(/\/$/, '')}/functions/v1/youtube-import`;
const YOUTUBE_FUNCTION_KEY = String(getPublicSupabasePublishableKey() ?? '');

function extractErrorMessage(error: unknown) {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  const maybe = error as { message?: string; error?: string; detail?: string };
  return maybe.detail || maybe.message || maybe.error || String(error);
}

function normalizeYouTubePreviewError(message: string) {
  if (/YOUTUBE_API_KEY|YouTube API key/i.test(message)) {
    return 'YouTube import is missing its API key on the external production backend. Manual link import still works; set YOUTUBE_API_KEY on that backend and redeploy youtube-import to restore previews.';
  }
  if (isYouTubeQuotaError(message)) {
    return 'YouTube daily search quota is exhausted. Manual link import still works; wait for the daily reset or use a YouTube API project with a higher Search quota.';
  }
  return message;
}

function isYouTubeQuotaError(message: string) {
  return /quota exceeded|rateLimitExceeded|RATE_LIMIT_EXCEEDED|RESOURCE_EXHAUSTED|defaultSearchListPerDayPerProject|daily search quota/i.test(message);
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((tag): tag is string => typeof tag === 'string');
  return [];
}

async function loadExistingYouTubeIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('seeded_videos')
    .select('hashtags')
    .eq('source', 'youtube')
    .limit(20000);
  if (error) throw error;
  const ids = new Set<string>();
  for (const row of data ?? []) {
    for (const tag of normalizeTags((row as { hashtags?: unknown }).hashtags)) {
      if (tag.startsWith('yt:')) ids.add(tag.slice(3));
    }
  }
  return ids;
}

async function previewYouTubeVideos(query: string, category: string, maxResults = 25): Promise<YouTubePreviewResult> {
  if (!YOUTUBE_FUNCTION_URL.startsWith('https://') || !YOUTUBE_FUNCTION_KEY) {
    throw new Error('Video preview service is not configured.');
  }

  const res = await fetch(YOUTUBE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      apikey: YOUTUBE_FUNCTION_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query, category, maxResults, mode: 'preview' }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(normalizeYouTubePreviewError(extractErrorMessage(json) || `Video preview failed (${res.status})`));
  }
  const candidates = (Array.isArray(json?.candidates) ? json.candidates : []) as YouTubePreviewCandidate[];
  const ytTags = candidates.map((candidate) => `yt:${candidate.videoId}`);
  const alreadyImported = ytTags.length > 0 ? await loadExistingYouTubeIds() : new Set<string>();
  const markedCandidates = candidates.map((candidate) => ({
    ...candidate,
    alreadyImported: alreadyImported.has(candidate.videoId),
  }));
  return {
    totalFound: Number(json?.totalFound ?? 0),
    alreadyImported: markedCandidates.filter((candidate) => candidate.alreadyImported).length,
    candidates: markedCandidates,
    error: typeof json?.error === 'string' ? normalizeYouTubePreviewError(json.error) : undefined,
    quotaExceeded: Boolean(json?.quotaExceeded),
  };
}

async function insertPreviewCandidates(category: string, query: string, candidates: YouTubePreviewCandidate[], videoIds?: string[]) {
  const selected = videoIds?.length ? new Set(videoIds) : null;
  const ids = candidates.map((candidate) => candidate.videoId);
  if (ids.length === 0) return { imported: 0, skipped: 0, totalFound: 0 };

  const existingIds = await loadExistingYouTubeIds();

  const rows = candidates
    .filter((candidate) => !existingIds.has(candidate.videoId))
    .filter((candidate) => !selected || selected.has(candidate.videoId))
    .map((candidate) => ({
      title: candidate.title || 'Untitled apartment video',
      embed_url: `https://www.youtube.com/embed/${candidate.videoId}`,
      caption: candidate.channel
        ? `${candidate.channel}${candidate.description ? ` · ${candidate.description.slice(0, 400)}` : ''}`
        : candidate.description?.slice(0, 400) || null,
      hashtags: [
        `cat:${category}`,
        `yt:${candidate.videoId}`,
        `q:${query}`,
        candidate.channel ? `ch:${candidate.channel}` : null,
        `src:${candidate.watchUrl || `https://www.youtube.com/watch?v=${candidate.videoId}`}`,
      ].filter(Boolean) as string[],
      source: 'youtube',
      moderation_status: 'approved',
      is_positive: false,
    }));

  if (rows.length === 0) {
    return { imported: 0, skipped: ids.length, totalFound: ids.length };
  }

  const { error } = await supabase.from('seeded_videos').insert(rows);
  if (error) throw error;
  return { imported: rows.length, skipped: ids.length - rows.length, totalFound: ids.length };
}

const FEED_CATEGORY_OPTIONS = [
  'Maintenance issues','Deposit disputes','Property tours','Renter tips',
  'Resident warnings','Property comparison',
];

function TopicEditor({
  draft, setDraft, onSave, onCancel, saving,
}: {
  draft: Partial<Category>;
  setDraft: (d: Partial<Category>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const queriesText = (draft.suggested_queries ?? []).join('\n');
  return (
    <div className="p-3 space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Label</label>
          <Input value={draft.label ?? ''} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Move-in day mishaps" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Slug (URL-safe, lowercase)</label>
          <Input value={draft.slug ?? ''} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="e.g. move-in-mishaps" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground block mb-1">Hint (short description)</label>
          <Input value={draft.hint ?? ''} onChange={(e) => setDraft({ ...draft, hint: e.target.value })} placeholder="What kind of videos live here?" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Feed rail</label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draft.feed_category ?? 'Renter tips'}
            onChange={(e) => setDraft({ ...draft, feed_category: e.target.value })}
          >
            {FEED_CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Sort order</label>
          <Input type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">
          Suggested YouTube search queries (one per line — bulk seed runs every line)
        </label>
        <Textarea
          rows={6}
          value={queriesText}
          onChange={(e) => setDraft({ ...draft, suggested_queries: e.target.value.split('\n') })}
          placeholder={'apartment tour before signing\napartment red flags\n...'}
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted-foreground flex items-center gap-2">
          <input type="checkbox" checked={draft.is_active ?? true} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
          Active
        </label>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Save
          </Button>
        </div>
      </div>
    </div>
  );
}

const AdminCuratedVideos = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [slug, setSlug] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [count, setCount] = useState(25);
  const [importing, setImporting] = useState(false);
  const [bulkSeeding, setBulkSeeding] = useState(false);
  const [linking, setLinking] = useState(false);
  const [fetchingGoogle, setFetchingGoogle] = useState(false);
  const [perQuery, setPerQuery] = useState(15);
  const [generatingSummaries, setGeneratingSummaries] = useState(false);
  const [summaryLimit, setSummaryLimit] = useState(20);

  const [pasteUrl, setPasteUrl] = useState('');
  const [pasteSlug, setPasteSlug] = useState<string>('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteCreator, setPasteCreator] = useState('');
  const [pasting, setPasting] = useState(false);

  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [browserRefresh, setBrowserRefresh] = useState(0);
  const [seedingKey, setSeedingKey] = useState<string | null>(null);
  const [previewCache, setPreviewCache] = useState<Record<string, YouTubePreviewCandidate[]>>({});
  const [youtubeQuotaError, setYoutubeQuotaError] = useState<string | null>(null);
  const [openBrowserSlug, setOpenBrowserSlug] = useState<string | null>(null);
  const [openBrowserTick, setOpenBrowserTick] = useState(0);

  const jumpToPreview = (catSlug: string) => {
    setOpenBrowserSlug(catSlug);
    setOpenBrowserTick((n) => n + 1);
    // Scroll browser section into view
    setTimeout(() => {
      document.getElementById('category-library-browser')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Topic editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Category>>({});
  const [savingCat, setSavingCat] = useState(false);
  // True when the `curated_categories` table isn't provisioned in this
  // environment. We fall back to the built-in list and hide the topic
  // editor so admins don't hit write errors on a table that doesn't exist.
  const [topicsEditable, setTopicsEditable] = useState(true);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('curated_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      // PGRST205 = table not in schema cache (table simply doesn't exist in
      // this project). That's an expected fallback path — no toast, just
      // switch to the built-in list and disable editor controls. Any other
      // error is worth surfacing.
      const missingTable =
        (error as any).code === 'PGRST205' ||
        /schema cache|does not exist/i.test(error.message ?? '');
      if (missingTable) {
        setTopicsEditable(false);
        console.info('[curated] curated_categories table not found — using built-in topic list');
      } else {
        toast({ title: 'Load topics failed — using built-in list', description: error.message, variant: 'destructive' });
      }
    }
    const list = (data ?? []).map((r: any) => ({
      ...r,
      suggested_queries: Array.isArray(r.suggested_queries) ? r.suggested_queries : [],
    })) as Category[];
    // Keep built-in topics visible even when the database already contains
    // older saved topics. Saved rows win when a slug exists in both places.
    const savedSlugs = new Set(list.map((category) => category.slug));
    const missingBuiltIns = CURATED_CATEGORIES
      .filter((category) => !savedSlugs.has(category.slug))
      .map((category, index) => ({
        id: `builtin:${category.slug}`,
        slug: category.slug,
        label: category.label,
        hint: category.hint,
        feed_category: category.feedCategory,
        suggested_queries: category.suggestedQueries,
        sort_order: (list.length + index) * 10,
        is_active: true,
      }));
    const effective = [...list, ...missingBuiltIns];
    setCategories(effective);
    if (!slug && effective[0]) {
      setSlug(effective[0].slug);
      setPasteSlug(effective[0].slug);
      setQuery(effective[0].suggested_queries[0] ?? '');
    }
  };

  useEffect(() => { loadCategories(); /* eslint-disable-next-line */ }, []);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('seeded_videos')
      .select('id,title,embed_url,caption,hashtags,source,created_at,moderation_status')
      .order('created_at', { ascending: false })
      .limit(200);
    const { data, error } = await q;
    if (error) toast({ title: 'Load failed', description: error.message, variant: 'destructive' });
    const filtered = filter === 'all'
      ? (data ?? [])
      : (data ?? []).filter((row: any) => normalizeTags(row.hashtags).includes(`cat:${filter}`));
    setRows(filtered as Row[]);
    setLoading(false);
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setDraft({ ...c, suggested_queries: [...c.suggested_queries] });
  };

  const startNew = () => {
    setEditingId('new');
    setDraft({
      slug: '', label: '', hint: '', feed_category: 'Renter tips',
      suggested_queries: [], sort_order: (categories[categories.length - 1]?.sort_order ?? 0) + 10, is_active: true,
    });
  };

  const saveDraft = async () => {
    const d = draft;
    if (!d.slug?.trim() || !d.label?.trim()) {
      return toast({ title: 'Slug and label required', variant: 'destructive' });
    }
    const cleanSlug = d.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const payload = {
      slug: cleanSlug,
      label: d.label.trim(),
      hint: d.hint?.trim() ?? '',
      feed_category: d.feed_category ?? 'Renter tips',
      suggested_queries: (d.suggested_queries ?? []).map((s) => s.trim()).filter(Boolean),
      sort_order: Number(d.sort_order ?? 0),
      is_active: d.is_active ?? true,
    };
    setSavingCat(true);
    try {
      if (editingId === 'new' || editingId?.startsWith('builtin:')) {
        const { error } = await supabase.from('curated_categories').insert(payload);
        if (error) throw error;
      } else if (editingId) {
        const { error } = await supabase.from('curated_categories').update(payload).eq('id', editingId);
        if (error) throw error;
      }
      toast({ title: 'Topic saved' });
      setEditingId(null); setDraft({});
      loadCategories();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setSavingCat(false);
    }
  };

  const deleteCategory = async (c: Category) => {
    if (c.id.startsWith('builtin:')) {
      return toast({ title: 'Built-in topic', description: 'Built-in topics stay available so their videos can always be previewed.' });
    }
    if (!confirm(`Delete topic "${c.label}"? Videos already imported stay in the library.`)) return;
    const { error } = await supabase.from('curated_categories').delete().eq('id', c.id);
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    loadCategories();
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const runImport = async () => {
    if (!query.trim()) return;
    if (youtubeQuotaError) {
      toast({ title: 'YouTube quota exhausted', description: youtubeQuotaError, variant: 'destructive' });
      return;
    }
    setImporting(true);
    try {
      const preview = await previewYouTubeVideos(query.trim(), slug, count);
      if (preview.quotaExceeded || preview.error) {
        const message = preview.error ?? 'YouTube preview failed.';
        if (preview.quotaExceeded) setYoutubeQuotaError(message);
        throw new Error(message);
      }
      const data = await insertPreviewCandidates(slug, query.trim(), preview.candidates);
      toast({
        title: `Import complete · ${data.imported} new videos`,
        description: `${data.imported} added to the library below · ${data.skipped} already imported (dupes) · ${data.totalFound} results scanned. Scroll down to review them.`,
      });
      load();
      setBrowserRefresh((n) => n + 1);
    } catch (e: any) {
      toast({ title: 'Import failed', description: extractErrorMessage(e), variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const runBulkSeed = async (categoryOnly?: string) => {
    if (!confirm(
      categoryOnly
        ? `Seed every suggested query for "${categoryOnly}"? This may take ~30s.`
        : `Seed EVERY category with ~${perQuery} videos per query? This runs 40+ YouTube searches (~1–2 min) and uses meaningful daily quota.`
    )) return;
    setBulkSeeding(true);
    try {
      const selectedCategories = categories.filter((category) =>
        category.is_active && (!categoryOnly || category.slug === categoryOnly)
      );
      if (selectedCategories.length === 0) throw new Error('No active categories found.');

      let totalImported = 0;
      let totalSkipped = 0;
      let totalFound = 0;
      let failed = 0;
      let firstFailure = '';

      for (const category of selectedCategories) {
        const queries = category.suggested_queries.map((item) => item.trim()).filter(Boolean);
        for (const suggestedQuery of queries) {
          if (youtubeQuotaError) {
            failed += 1;
            if (!firstFailure) firstFailure = youtubeQuotaError;
            break;
          }
          try {
            const preview = await previewYouTubeVideos(suggestedQuery, category.slug, perQuery);
            if (preview.quotaExceeded || preview.error) {
              const message = preview.error ?? 'YouTube preview failed.';
              if (preview.quotaExceeded) setYoutubeQuotaError(message);
              throw new Error(message);
            }
            const result = await insertPreviewCandidates(category.slug, suggestedQuery, preview.candidates);
            totalImported += result.imported;
            totalSkipped += result.skipped;
            totalFound += result.totalFound;
          } catch (err) {
            failed += 1;
            const message = normalizeYouTubePreviewError(extractErrorMessage(err));
            if (!firstFailure) firstFailure = message;
            if (isYouTubeQuotaError(message)) {
              setYoutubeQuotaError(message);
              break;
            }
          }
        }
        if (firstFailure && isYouTubeQuotaError(firstFailure)) break;
      }

      if (totalFound === 0 && failed > 0) throw new Error(firstFailure || 'Every seed query failed.');
      toast({
        title: `Bulk import complete · ${totalImported} new videos`,
        description: `${totalImported} added to the library below · ${totalSkipped} were already imported (dupes) · ${totalFound} total results scanned${failed ? ` · ${failed} queries failed` : ''}. Scroll down to review and moderate them.`,
      });
      load();
      setBrowserRefresh((n) => n + 1);
    } catch (e: any) {
      toast({ title: 'Bulk seed failed', description: extractErrorMessage(e), variant: 'destructive' });
    } finally {
      setBulkSeeding(false);
    }
  };

  const runLinkVideosToProperties = async () => {
    setLinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('link-videos-to-properties', { body: {} });
      if (error) throw error;
      const matched = data?.matched ?? 0;
      const videosConsidered = data?.videosConsidered ?? 0;
      const propertiesConsidered = data?.propertiesConsidered ?? 0;
      if (matched === 0) {
        const reason =
          videosConsidered === 0
            ? 'No approved YouTube videos to link yet — approve videos in the moderation queue below first.'
            : propertiesConsidered === 0
              ? 'No properties found in the database to match against.'
              : `Scanned ${videosConsidered} approved videos against ${propertiesConsidered} properties, but no video title/caption mentioned a property name, address, or management company. This is normal for generic "apartment tour" content — links happen when a video calls out a specific building.`;
        toast({ title: 'Linking finished · 0 matches', description: reason });
      } else {
        toast({
          title: 'Linking complete',
          description: `Matched ${matched} (auto-approved ${data?.autoApproved ?? 0} · needs review ${data?.needsReview ?? 0}) from ${videosConsidered} videos × ${propertiesConsidered} properties.`,
        });
      }
    } catch (e: any) {
      toast({ title: 'Linking failed', description: extractErrorMessage(e), variant: 'destructive' });
    } finally {
      setLinking(false);
    }
  };

  const runFetchGoogleReviews = async () => {
    setFetchingGoogle(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-google-reviews', { body: { limit: 25 } });
      if (error) throw error;
      toast({
        title: 'Google reviews pulled',
        description: `Processed ${data?.propertiesProcessed ?? 0} properties · ${data?.totalReviews ?? 0} reviews cached.`,
      });
    } catch (e: any) {
      toast({ title: 'Google fetch failed', description: extractErrorMessage(e), variant: 'destructive' });
    } finally {
      setFetchingGoogle(false);
    }
  };

  const runGenerateSummaries = async () => {
    setGeneratingSummaries(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-video-summary', {
        body: { limit: summaryLimit, onlyMissing: true },
      });
      if (error) throw error;
      toast({
        title: 'AI descriptions written',
        description: `Processed ${data?.processed ?? 0} · updated ${data?.updated ?? 0} · skipped ${data?.skipped ?? 0}.`,
      });
      setBrowserRefresh((n) => n + 1);
    } catch (e: any) {
      toast({ title: 'Generation failed', description: extractErrorMessage(e), variant: 'destructive' });
    } finally {
      setGeneratingSummaries(false);
    }
  };

  const runPaste = async () => {
    const parsed = parseEmbed(pasteUrl);
    if (!parsed) {
      toast({ title: 'Unsupported URL', description: 'Paste a YouTube, TikTok, or Instagram link.', variant: 'destructive' });
      return;
    }
    setPasting(true);
    try {
      const tags: string[] = [`cat:${pasteSlug}`, `src:${parsed.sourceUrl}`];
      if (parsed.platform === 'youtube') {
        const m = parsed.embedUrl.match(/embed\/([\w-]{11})/);
        if (m) tags.push(`yt:${m[1]}`);
      }
      if (pasteCreator.trim()) tags.push(`ch:${pasteCreator.trim()}`);
      const { error } = await supabase.from('seeded_videos').insert({
        title: pasteTitle.trim() || 'Untitled apartment video',
        embed_url: parsed.embedUrl,
        caption: pasteCreator.trim() || null,
        hashtags: tags,
        source: parsed.platform,
        moderation_status: 'approved',
        is_positive: false,
      });
      if (error) throw error;
      toast({ title: 'Added', description: 'Video added to the feed.' });
      setPasteUrl(''); setPasteTitle(''); setPasteCreator('');
      load();
      setBrowserRefresh((n) => n + 1);
    } catch (e: any) {
      toast({ title: 'Add failed', description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setPasting(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('seeded_videos').update({ moderation_status: 'rejected' }).eq('id', id);
    if (error) return toast({ title: 'Remove failed', description: error.message, variant: 'destructive' });
    setRows((r) => r.filter((x) => x.id !== id));
    setBrowserRefresh((n) => n + 1);
  };

  const seedOneQuery = async (catSlug: string, q: string) => {
    if (youtubeQuotaError) {
      toast({ title: 'YouTube quota exhausted', description: youtubeQuotaError, variant: 'destructive' });
      return null;
    }
    const key = `${catSlug}::${q}`;
    setSeedingKey(key);
    try {
      const preview = await previewYouTubeVideos(q, catSlug, 15);
      if (preview.quotaExceeded || preview.error) {
        const message = preview.error ?? 'YouTube preview failed.';
        if (preview.quotaExceeded) setYoutubeQuotaError(message);
        throw new Error(message);
      }
      setPreviewCache((cache) => ({ ...cache, [key]: preview.candidates }));
      const data = await insertPreviewCandidates(catSlug, q, preview.candidates);
      toast({
        title: `Seeded "${q}"`,
        description: `+${data.imported} new · ${data.skipped} dupes · ${data.totalFound} found`,
      });
      setBrowserRefresh((n) => n + 1);
      load();
      return { imported: data.imported ?? 0, skipped: data.skipped ?? 0, totalFound: data.totalFound ?? 0 };
    } catch (e: any) {
      toast({ title: 'Query failed', description: extractErrorMessage(e), variant: 'destructive' });
      return null;
    } finally {
      setSeedingKey(null);
    }
  };

  const previewOneQuery = async (catSlug: string, q: string) => {
    if (youtubeQuotaError) {
      return { totalFound: 0, alreadyImported: 0, candidates: [], error: youtubeQuotaError, quotaExceeded: true };
    }
    try {
      const data = await previewYouTubeVideos(q, catSlug, 25);
      if (data.quotaExceeded) setYoutubeQuotaError(data.error ?? 'YouTube daily search quota is exhausted.');
      setPreviewCache((cache) => ({ ...cache, [`${catSlug}::${q}`]: data.candidates }));
      return data;
    } catch (e: any) {
      const message = normalizeYouTubePreviewError(extractErrorMessage(e));
      if (isYouTubeQuotaError(message)) setYoutubeQuotaError(message);
      toast({ title: 'Preview failed', description: message, variant: 'destructive' });
      return { totalFound: 0, alreadyImported: 0, candidates: [], error: message, quotaExceeded: isYouTubeQuotaError(message) };
    }
  };

  const importSelectedIds = async (catSlug: string, q: string, videoIds: string[]) => {
    const key = `${catSlug}::${q}`;
    setSeedingKey(key);
    try {
      const candidates = previewCache[key] ?? (await previewYouTubeVideos(q, catSlug, 25)).candidates;
      const data = await insertPreviewCandidates(catSlug, q, candidates, videoIds);
      toast({
        title: `Imported ${data.imported} selected videos`,
        description: `${data.skipped} skipped · ${data.totalFound} found for "${q}"`,
      });
      setBrowserRefresh((n) => n + 1);
      load();
      return { imported: data.imported ?? 0, skipped: data.skipped ?? 0, totalFound: data.totalFound ?? 0 };
    } catch (e: any) {
      toast({ title: 'Import failed', description: extractErrorMessage(e), variant: 'destructive' });
      return null;
    } finally {
      setSeedingKey(null);
    }
  };

  const removeAsync = async (id: string) => {
    await remove(id);
  };

  const currentCat = categories.find((c) => c.slug === slug) ?? categories[0] ?? null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container px-4 py-6 md:py-10 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Curated video library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bulk-import public YouTube videos by category, or paste TikTok / Instagram / YouTube links manually.
            Only the official embed is stored — the creator keeps full credit.
          </p>
        </div>

        {youtubeQuotaError && (
          <Card className="mb-6 border-destructive/40 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-destructive">YouTube search quota exhausted</p>
              <p className="text-sm text-muted-foreground mt-1">{youtubeQuotaError}</p>
            </CardContent>
          </Card>
        )}

        {topicsEditable && <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2"><Pencil className="w-5 h-5 text-primary" /> Topics</CardTitle>
                <CardDescription>Add, rename, or delete the categories used by import and bulk seed.</CardDescription>
              </div>
              <Button size="sm" onClick={startNew} disabled={editingId !== null}>
                <Plus className="w-4 h-4 mr-1" /> New topic
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="border border-border rounded-md">
                {editingId === c.id ? (
                  <TopicEditor
                    draft={draft} setDraft={setDraft} onSave={saveDraft} onCancel={() => { setEditingId(null); setDraft({}); }} saving={savingCat}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-3 p-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.label} <span className="text-muted-foreground font-normal">· {c.slug}</span></p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{c.hint}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px]">{c.feed_category}</Badge>
                        <Badge variant="muted" className="text-[10px]">{c.suggested_queries.length} queries</Badge>
                        {!c.is_active && <Badge variant="destructive" className="text-[10px]">inactive</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => jumpToPreview(c.slug)} disabled={editingId !== null}>
                        <Eye className="w-4 h-4 mr-1" /> Preview videos
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => startEdit(c)} disabled={editingId !== null}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteCategory(c)} disabled={editingId !== null}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {editingId === 'new' && (
              <div className="border border-primary rounded-md">
                <TopicEditor
                  draft={draft} setDraft={setDraft} onSave={saveDraft} onCancel={() => { setEditingId(null); setDraft({}); }} saving={savingCat}
                />
              </div>
            )}
          </CardContent>
        </Card>}

        <div id="category-library-browser" />
        <CategoryLibraryBrowser
          categories={categories}
          onSeedQuery={seedOneQuery}
          seedingKey={seedingKey}
          onDelete={removeAsync}
          refreshKey={browserRefresh}
          onPreviewQuery={previewOneQuery}
          onImportSelected={importSelectedIds}
          openSlug={openBrowserSlug}
          openTick={openBrowserTick}
        />

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> One-click bulk seed</CardTitle>
            <CardDescription>
              Runs every suggested query across every category — the fastest way to fill an empty feed with hundreds of real apartment videos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Videos per query (1–50)</label>
                <Input type="number" min={1} max={50} value={perQuery}
                  onChange={(e) => setPerQuery(Number(e.target.value))} className="w-28" />
              </div>
              <Button onClick={() => runBulkSeed()} disabled={bulkSeeding}>
                {bulkSeeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Seed every category
              </Button>
              <Button variant="outline" onClick={() => runBulkSeed(slug)} disabled={bulkSeeding || !currentCat}>
                Seed only "{currentCat?.label ?? '—'}"
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Duplicates are auto-skipped, so it's safe to re-run whenever you want fresh content.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> AI descriptions</CardTitle>
            <CardDescription>
              Writes an original 2-3 sentence summary, an editorial angle, and 3-5 topic tags for each approved YouTube video — indexed by search engines so we own the content around every embed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Videos to process (1–100)</label>
                <Input type="number" min={1} max={100} value={summaryLimit}
                  onChange={(e) => setSummaryLimit(Math.max(1, Math.min(100, Number(e.target.value) || 20)))}
                  className="w-28" />
              </div>
              <Button onClick={runGenerateSummaries} disabled={generatingSummaries}>
                {generatingSummaries ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate for videos missing a summary
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Uses Lovable AI (Gemini 3.5 Flash). Summaries and tags show on the Watch page, in trending rails, and get indexed by search engines. Safe to re-run — already-summarised videos are skipped.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Enrich properties</CardTitle>
            <CardDescription>
              Link seeded YouTube videos to matching properties, and pull cached Google reviews. Both feed into the Truth Score.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={runLinkVideosToProperties} disabled={linking} variant="outline">
                {linking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                Link videos to properties
              </Button>
              <Button onClick={runFetchGoogleReviews} disabled={fetchingGoogle} variant="outline">
                {fetchingGoogle ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2" />}
                Fetch Google reviews (25)
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              High-confidence video matches auto-approve; medium go to moderation. Google reviews cache up to 5 per property (Google's limit).
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Youtube className="w-5 h-5 text-red-500" /> YouTube bulk import</CardTitle>
            <CardDescription>Search YouTube and add up to 50 embeddable videos into a category at once.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_100px_auto]">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={slug}
                onChange={(e) => {
                  const s = e.target.value;
                  setSlug(s);
                  const c = categories.find((x) => x.slug === s);
                  if (c && c.suggested_queries[0]) setQuery(c.suggested_queries[0]);
                }}
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search terms" />
              <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} />
              <Button onClick={runImport} disabled={importing}>
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(currentCat?.suggested_queries ?? []).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  className="text-xs px-2 py-1 rounded-full border border-border hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Link2 className="w-5 h-5 text-primary" /> Paste a single link</CardTitle>
            <CardDescription>YouTube, TikTok, or Instagram reel URLs work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)} placeholder="https://..." />
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={pasteSlug} onChange={(e) => setPasteSlug(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
              <Input value={pasteTitle} onChange={(e) => setPasteTitle(e.target.value)} placeholder="Title (optional)" />
              <Input value={pasteCreator} onChange={(e) => setPasteCreator(e.target.value)} placeholder="Creator handle (optional)" />
            </div>
            <Button onClick={runPaste} disabled={pasting || !pasteUrl.trim()}>
              {pasting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add video'}
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">Library ({rows.length})</h2>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No videos yet — run an import above.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((r) => {
              const cat = (r.hashtags ?? []).find((t) => t.startsWith('cat:'))?.slice(4) ?? '—';
              const ch = (r.hashtags ?? []).find((t) => t.startsWith('ch:'))?.slice(3);
              const yt = (r.hashtags ?? []).find((t) => t.startsWith('yt:'))?.slice(3);
              const thumb = yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : undefined;
              return (
                <Card key={r.id} className={r.moderation_status === 'rejected' ? 'opacity-50' : ''}>
                  <CardContent className="p-3 flex gap-3">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-32 h-20 object-cover rounded" loading="lazy" />
                    ) : (
                      <div className="w-32 h-20 bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground">
                        {r.source}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{r.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px]">{cat}</Badge>
                        <Badge variant="muted" className="text-[10px]">{r.source}</Badge>
                        {ch && <span className="text-[10px] text-muted-foreground truncate">· {ch}</span>}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <a href={r.embed_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Preview</a>
                        <button onClick={() => remove(r.id)} className="text-xs text-destructive hover:underline inline-flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCuratedVideos;
