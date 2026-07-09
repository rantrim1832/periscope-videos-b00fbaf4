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
import { Loader2, Youtube, Link2, Trash2, Sparkles } from 'lucide-react';

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

const AdminCuratedVideos = () => {
  const { toast } = useToast();
  const [slug, setSlug] = useState(CURATED_CATEGORIES[0].slug);
  const [query, setQuery] = useState(CURATED_CATEGORIES[0].suggestedQueries[0]);
  const [count, setCount] = useState(25);
  const [importing, setImporting] = useState(false);

  const [pasteUrl, setPasteUrl] = useState('');
  const [pasteSlug, setPasteSlug] = useState(CURATED_CATEGORIES[0].slug);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteCreator, setPasteCreator] = useState('');
  const [pasting, setPasting] = useState(false);

  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

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

  const currentCat = CURATED_CATEGORIES.find((c) => c.slug === slug)!;

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
                  const c = CURATED_CATEGORIES.find((x) => x.slug === s);
                  if (c) setQuery(c.suggestedQueries[0]);
                }}
              >
                {CURATED_CATEGORIES.map((c) => (
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
              {currentCat.suggestedQueries.map((q) => (
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
                {CURATED_CATEGORIES.map((c) => (
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
            {CURATED_CATEGORIES.map((c) => (
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
