import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronRight, Youtube, Search, Trash2, ExternalLink, Eye, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

export type BrowserCategory = {
  id: string;
  slug: string;
  label: string;
  hint: string;
  feed_category: string;
  suggested_queries: string[];
  is_active: boolean;
};

export type PreviewCandidate = {
  videoId: string;
  title: string;
  channel: string;
  description: string;
  thumbnail: string;
  watchUrl: string;
  alreadyImported: boolean;
};

export type PreviewResult = {
  totalFound: number;
  alreadyImported: number;
  candidates: PreviewCandidate[];
};

type VideoRow = {
  id: string;
  title: string;
  embed_url: string;
  caption: string | null;
  hashtags: string[] | null;
  source: string;
  created_at: string;
  moderation_status: string;
};

function tagValue(tags: string[] | null | undefined, prefix: string) {
  return (tags ?? []).find((t) => t.startsWith(prefix))?.slice(prefix.length);
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((tag): tag is string => typeof tag === 'string');
  return [];
}

export function CategoryLibraryBrowser({
  categories,
  onSeedQuery,
  seedingKey,
  onDelete,
  refreshKey,
  onPreviewQuery,
  onImportSelected,
  openSlug,
  openTick,
}: {
  categories: BrowserCategory[];
  onSeedQuery: (slug: string, query: string) => Promise<{ imported: number; skipped: number; totalFound: number } | null>;
  seedingKey: string | null; // `${slug}::${query}` while running
  onDelete: (id: string) => Promise<void>;
  refreshKey: number;
  onPreviewQuery: (slug: string, query: string) => Promise<PreviewResult | null>;
  onImportSelected: (slug: string, query: string, videoIds: string[]) => Promise<{ imported: number; skipped: number; totalFound: number } | null>;
  openSlug?: string | null;
  openTick?: number;
}) {
  const { toast } = useToast();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [videosBySlug, setVideosBySlug] = useState<Record<string, VideoRow[]>>({});
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<Record<string, { imported: number; skipped: number; totalFound: number; at: number }>>({});
  const [previewKey, setPreviewKey] = useState<string | null>(null); // which query is being previewed
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set<string>());
  const [importing, setImporting] = useState(false);

  // Load per-category counts by inspecting every video's hashtags (small dataset).
  const loadCounts = async () => {
    const { data, error } = await supabase
      .from('seeded_videos')
      .select('hashtags,moderation_status')
      .eq('moderation_status', 'approved')
      .limit(5000);
    if (error) return;
    const c: Record<string, number> = {};
    for (const row of data ?? []) {
      const slug = normalizeTags((row as { hashtags?: unknown }).hashtags).find((t) => t.startsWith('cat:'))?.slice(4);
      if (!slug) continue;
      c[slug] = (c[slug] ?? 0) + 1;
    }
    setCounts(c);
  };

  useEffect(() => {
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Allow parent to programmatically expand a topic (used by the "Preview
  // videos" button on the Topics editor above).
  useEffect(() => {
    if (!openSlug) return;
    setExpanded(openSlug);
    if (!videosBySlug[openSlug]) loadVideos(openSlug);
    // Auto-open the first query's preview so the user sees videos immediately.
    const cat = categories.find((c) => c.slug === openSlug);
    const firstQ = cat?.suggested_queries?.[0];
    if (firstQ) {
      openPreview(openSlug, firstQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSlug, openTick]);

  const loadVideos = async (slug: string) => {
    setLoadingSlug(slug);
    const { data, error } = await supabase
      .from('seeded_videos')
      .select('id,title,embed_url,caption,hashtags,source,created_at,moderation_status')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      toast({ title: 'Load videos failed', description: error.message, variant: 'destructive' });
    } else {
      const filtered = (data ?? [])
        .filter((row: any) => normalizeTags(row.hashtags).includes(`cat:${slug}`))
        .slice(0, 60);
      setVideosBySlug((v) => ({ ...v, [slug]: filtered as VideoRow[] }));
    }
    setLoadingSlug(null);
  };

  const toggle = async (slug: string) => {
    if (expanded === slug) {
      setExpanded(null);
      return;
    }
    setExpanded(slug);
    if (!videosBySlug[slug]) await loadVideos(slug);
  };

  const runQuery = async (slug: string, q: string) => {
    const res = await onSeedQuery(slug, q);
    if (res) {
      setLastRun((r) => ({ ...r, [`${slug}::${q}`]: { ...res, at: Date.now() } }));
      await loadVideos(slug);
      await loadCounts();
    }
  };

  const openPreview = async (slug: string, q: string) => {
    const key = `${slug}::${q}`;
    setPreviewKey(key);
    setPreview(null);
    setSelected(new Set());
    setPreviewLoading(true);
    const res = await onPreviewQuery(slug, q);
    setPreview(res);
    if (res) {
      // Preselect all fresh (not-yet-imported) videos
      const fresh = new Set(res.candidates.filter((c) => !c.alreadyImported).map((c) => c.videoId));
      setSelected(fresh);
    }
    setPreviewLoading(false);
  };

  const closePreview = () => {
    setPreviewKey(null);
    setPreview(null);
    setSelected(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelected((s) => {
      const n = new Set<string>(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const importSelected = async () => {
    if (!previewKey || selected.size === 0) return;
    const [slug, q] = previewKey.split('::');
    setImporting(true);
    const res = await onImportSelected(slug, q, Array.from(selected));
    setImporting(false);
    if (res) {
      setLastRun((r) => ({ ...r, [previewKey]: { ...res, at: Date.now() } }));
      await loadVideos(slug);
      await loadCounts();
      closePreview();
    }
  };

  const totals = useMemo(() => {
    let queries = 0;
    let videos = 0;
    for (const c of categories) queries += c.suggested_queries.length;
    for (const n of Object.values(counts)) videos += n;
    return { queries, videos };
  }, [categories, counts]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" /> Category library browser
            </CardTitle>
            <CardDescription>
              Every topic, every search term it runs, and the videos it has pulled in. Click a topic to expand.
            </CardDescription>
          </div>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline">{categories.length} topics</Badge>
            <Badge variant="outline">{totals.queries} queries</Badge>
            <Badge variant="muted">{totals.videos} videos indexed</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {categories.map((c) => {
          const isOpen = expanded === c.slug;
          const count = counts[c.slug] ?? 0;
          const videos = videosBySlug[c.slug] ?? [];
          return (
            <div key={c.id} className="border border-border rounded-md">
              <button
                onClick={() => toggle(c.slug)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition"
              >
                {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className="text-xs text-muted-foreground">· {c.slug}</span>
                    {!c.is_active && <Badge variant="destructive" className="text-[10px]">inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{c.hint}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">{c.feed_category}</Badge>
                  <Badge variant="outline" className="text-[10px]">{c.suggested_queries.length} queries</Badge>
                  <Badge variant={count > 0 ? 'default' : 'muted'} className="text-[10px]">
                    {count} videos
                  </Badge>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border p-3 space-y-4 bg-muted/20">
                  {/* Queries */}
                  <div>
                    <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                      Search queries YouTube will run
                    </p>
                    {c.suggested_queries.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No queries yet — edit this topic above to add search terms.
                      </p>
                    ) : (
                      <div className="grid gap-1.5">
                        {c.suggested_queries.map((q) => {
                          const key = `${c.slug}::${q}`;
                          const busy = seedingKey === key;
                          const run = lastRun[key];
                          const isPreviewing = previewKey === key;
                          return (
                            <div key={q} className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="text-xs px-2 py-1 rounded bg-background border border-border flex-1 min-w-[200px] truncate">
                                  {q}
                                </code>
                                {run && (
                                  <span className="text-[10px] text-muted-foreground">
                                    +{run.imported} new · {run.skipped} dupe · {run.totalFound} found
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  variant={isPreviewing ? 'default' : 'outline'}
                                  className="h-7 text-xs"
                                  disabled={previewLoading && !isPreviewing}
                                  onClick={() => (isPreviewing ? closePreview() : openPreview(c.slug, q))}
                                >
                                  {previewLoading && isPreviewing ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Eye className="w-3 h-3 mr-1" />
                                  )}
                                  {isPreviewing ? 'Close preview' : 'Preview'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  disabled={busy || seedingKey !== null}
                                  onClick={() => runQuery(c.slug, q)}
                                  title="Import all fresh results without previewing"
                                >
                                  {busy ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Youtube className="w-3 h-3 mr-1 text-red-500" />}
                                  Import all
                                </Button>
                              </div>

                              {isPreviewing && (
                                <div className="border border-primary/40 bg-background rounded-md p-3">
                                  {previewLoading ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 justify-center">
                                      <Loader2 className="w-4 h-4 animate-spin" /> Fetching candidates from YouTube…
                                    </div>
                                  ) : !preview ? (
                                    <p className="text-xs text-destructive">Preview failed. Try again.</p>
                                  ) : preview.candidates.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">No videos returned by YouTube for this query.</p>
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <p className="text-xs text-muted-foreground">
                                          <strong>{preview.totalFound}</strong> results ·{' '}
                                          <strong>{preview.alreadyImported}</strong> already in library ·{' '}
                                          <strong>{selected.size}</strong> selected
                                        </p>
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-[11px]"
                                            onClick={() =>
                                              setSelected(new Set(preview.candidates.filter((v) => !v.alreadyImported).map((v) => v.videoId)))
                                            }
                                          >
                                            Select all fresh
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-[11px]"
                                            onClick={() => setSelected(new Set())}
                                          >
                                            Clear
                                          </Button>
                                          <Button
                                            size="sm"
                                            className="h-7 text-xs"
                                            disabled={importing || selected.size === 0}
                                            onClick={importSelected}
                                          >
                                            {importing ? (
                                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                            ) : (
                                              <CheckCircle2 className="w-3 h-3 mr-1" />
                                            )}
                                            Import selected ({selected.size})
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 max-h-[520px] overflow-y-auto pr-1">
                                        {preview.candidates.map((v) => {
                                          const checked = selected.has(v.videoId);
                                          return (
                                            <label
                                              key={v.videoId}
                                              className={`border rounded-md overflow-hidden text-xs cursor-pointer transition ${
                                                v.alreadyImported
                                                  ? 'opacity-60 border-border'
                                                  : checked
                                                  ? 'border-primary ring-1 ring-primary/40'
                                                  : 'border-border hover:border-primary/60'
                                              }`}
                                            >
                                              <div className="relative">
                                                <img src={v.thumbnail} alt="" loading="lazy" className="w-full h-24 object-cover" />
                                                <div className="absolute top-1 left-1 bg-background/90 rounded-sm p-0.5">
                                                  <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={() => !v.alreadyImported && toggleSelected(v.videoId)}
                                                    disabled={v.alreadyImported}
                                                  />
                                                </div>
                                                {v.alreadyImported && (
                                                  <div className="absolute bottom-1 left-1">
                                                    <Badge variant="muted" className="text-[9px]">already in library</Badge>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="p-2 space-y-1">
                                                <p className="font-medium line-clamp-2 leading-snug">{v.title}</p>
                                                {v.channel && (
                                                  <p className="text-[10px] text-muted-foreground truncate">{v.channel}</p>
                                                )}
                                                <a
                                                  href={v.watchUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
                                                >
                                                  <ExternalLink className="w-3 h-3" /> Watch on YouTube
                                                </a>
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Videos */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Videos in this topic {loadingSlug === c.slug && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}
                      </p>
                      <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => loadVideos(c.slug)}>
                        Refresh
                      </Button>
                    </div>
                    {videos.length === 0 && loadingSlug !== c.slug ? (
                      <p className="text-xs text-muted-foreground italic">No videos yet — run a query above.</p>
                    ) : (
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {videos.map((v) => {
                          const yt = tagValue(v.hashtags, 'yt:');
                          const ch = tagValue(v.hashtags, 'ch:');
                          const seededBy = tagValue(v.hashtags, 'q:');
                          const src = tagValue(v.hashtags, 'src:') ?? v.embed_url;
                          const thumb = yt ? `https://img.youtube.com/vi/${yt}/mqdefault.jpg` : undefined;
                          return (
                            <div key={v.id} className="bg-background border border-border rounded-md overflow-hidden text-xs">
                              {thumb ? (
                                <img src={thumb} alt="" loading="lazy" className="w-full h-24 object-cover" />
                              ) : (
                                <div className="w-full h-24 bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                                  {v.source}
                                </div>
                              )}
                              <div className="p-2 space-y-1">
                                <p className="font-medium line-clamp-2 leading-snug">{v.title}</p>
                                {ch && <p className="text-[10px] text-muted-foreground truncate">{ch}</p>}
                                {seededBy && (
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    <span className="opacity-60">via:</span> {seededBy}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 pt-1">
                                  <a href={src} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5">
                                    <ExternalLink className="w-3 h-3" /> Open
                                  </a>
                                  <button
                                    onClick={async () => {
                                      await onDelete(v.id);
                                      setVideosBySlug((s) => ({ ...s, [c.slug]: (s[c.slug] ?? []).filter((x) => x.id !== v.id) }));
                                      loadCounts();
                                    }}
                                    className="text-[11px] text-destructive hover:underline inline-flex items-center gap-0.5 ml-auto"
                                  >
                                    <Trash2 className="w-3 h-3" /> Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}