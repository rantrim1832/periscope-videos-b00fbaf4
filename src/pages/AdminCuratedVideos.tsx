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
import { Textarea } from '@/components/ui/textarea';

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
  const [perQuery, setPerQuery] = useState(15);

  const [pasteUrl, setPasteUrl] = useState('');
  const [pasteSlug, setPasteSlug] = useState<string>('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteCreator, setPasteCreator] = useState('');
  const [pasting, setPasting] = useState(false);

  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Topic editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Category>>({});
  const [savingCat, setSavingCat] = useState(false);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('curated_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) return toast({ title: 'Load topics failed', description: error.message, variant: 'destructive' });
    const list = (data ?? []).map((r: any) => ({
      ...r,
      suggested_queries: Array.isArray(r.suggested_queries) ? r.suggested_queries : [],
    })) as Category[];
    // Fallback to legacy static list if the DB is empty for any reason.
    const effective = list.length > 0 ? list : CURATED_CATEGORIES.map((c, i) => ({
      id: c.slug, slug: c.slug, label: c.label, hint: c.hint,
      feed_category: c.feedCategory, suggested_queries: c.suggestedQueries,
      sort_order: i * 10, is_active: true,
    }));
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
    if (filter !== 'all') q = q.overlaps('hashtags', [`cat:${filter}`]);
    const { data, error } = await q;
    if (error) toast({ title: 'Load failed', description: error.message, variant: 'destructive' });
    setRows((data ?? []) as Row[]);
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
      if (editingId === 'new') {
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
    if (!confirm(`Delete topic "${c.label}"? Videos already imported stay in the library.`)) return;
    const { error } = await supabase.from('curated_categories').delete().eq('id', c.id);
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    loadCategories();
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const runImport = async () => {
    if (!query.trim()) return;
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-import', {
        body: { query: query.trim(), category: slug, maxResults: count },
      });
      if (error) throw error;
      toast({
        title: 'Import complete',
        description: `Imported ${data.imported} new · skipped ${data.skipped} duplicates · found ${data.totalFound}.`,
      });
      load();
    } catch (e: any) {
      toast({ title: 'Import failed', description: e.message ?? String(e), variant: 'destructive' });
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
      const { data, error } = await supabase.functions.invoke('youtube-bulk-seed', {
        body: { perQuery, category: categoryOnly },
      });
      if (error) throw error;
      toast({
        title: 'Bulk seed complete',
        description: `Imported ${data.totalImported} · skipped ${data.totalSkipped} dupes · found ${data.totalFound}.`,
      });
      load();
    } catch (e: any) {
      toast({ title: 'Bulk seed failed', description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setBulkSeeding(false);
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
  };

  const currentCat = categories.find((c) => c.slug === slug) ?? categories[0];

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

        <Card className="mb-6">
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
        </Card>

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
              <Button variant="outline" onClick={() => runBulkSeed(slug)} disabled={bulkSeeding}>
                Seed only "{currentCat.label}"
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Duplicates are auto-skipped, so it's safe to re-run whenever you want fresh content.
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
