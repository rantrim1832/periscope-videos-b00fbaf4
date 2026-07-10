import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users, MessageSquare, Video, Home, Star, ShieldCheck, Sparkles,
  TrendingUp, Loader2, Settings, Youtube, Flag, ClipboardCheck,
  AlertCircle, CheckCircle2, Link2, RefreshCw,
} from 'lucide-react';

type Analytics = {
  totals: Record<string, number>;
  generated_at?: string;
  source?: 'admin-analytics' | 'browser-fallback';
  warning?: string;
  roles?: Record<string, number>;
  top_cities?: { city: string; count: number }[];
  new_by_city?: { city: string; count: number }[];
  signup_series: { date: string; count: number }[];
  recent_users: { id: string; email: string; created_at: string; provider?: string }[];
  top_contributors: { user_id: string; email: string; reviews: number }[];
  recent_reviews: any[];
  recent_videos: any[];
  recent_contact: any[];
  recent_properties: any[];
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data: res, error } = await supabase.functions.invoke('admin-analytics');
      if (error) throw error;
      setData({ ...(res as Analytics), source: 'admin-analytics' });
    } catch (e: any) {
      const message = e?.message ?? String(e);
      setLoadError(message);
      const fallback = await loadBrowserFallback(message);
      setData(fallback);
      toast({
        title: 'Dashboard loaded with limited analytics',
        description: 'Live content counts are shown below; user signup analytics are unavailable right now.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const t = data?.totals ?? {};
  const maxSignup = Math.max(1, ...(data?.signup_series ?? []).map((s) => s.count));
  const isFallback = data?.source === 'browser-fallback';

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container px-4 py-6 md:py-10 max-w-6xl">
        <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" /> Admin dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time overview of content imports, property linking, users, and support activity.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button size="sm" variant="outline" onClick={loadDashboard} disabled={loading}>
              {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
              Refresh
            </Button>
            <QuickLinks />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : !data ? (
          <EmptyDashboard error={loadError} />
        ) : (
          <>
            {isFallback && (
              <Card className="mb-6 border-primary/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Dashboard analytics function did not respond, so these are direct live content counts.</p>
                    <p className="text-xs text-muted-foreground mt-1">Signup charts and user emails are hidden until the analytics function is available. Imports, moderation, and property-linking status below are still live.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-3 gap-3 mb-6">
              <StatusCard
                icon={Youtube}
                title="Video import status"
                value={`${(t.videos ?? 0).toLocaleString()} total`}
                detail={`${t.videos_approved ?? 0} approved · ${t.videos_pending ?? 0} pending review · ${t.videos_rejected ?? 0} rejected`}
                cta="Open curated library"
                to="/admin/curated"
                ready={(t.videos ?? 0) > 0}
              />
              <StatusCard
                icon={Link2}
                title="Property link status"
                value={`${(t.property_video_links ?? 0).toLocaleString()} linked videos`}
                detail={`${t.property_video_links_approved ?? 0} approved · ${t.property_video_links_pending ?? 0} need moderation`}
                cta="Run linking"
                to="/admin/curated"
                ready={(t.property_video_links ?? 0) > 0}
              />
              <StatusCard
                icon={Home}
                title="Property inventory"
                value={`${(t.properties ?? 0).toLocaleString()} buildings`}
                detail={`${t.properties_new_today ?? 0} added today · ${t.properties_new_7d ?? 0} this week`}
                cta="Open properties"
                to="/admin/properties"
                ready={(t.properties ?? 0) > 0}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Stat icon={Users} label="Users" value={t.users} delta={`+${t.users_new_7d} this week`} accent="text-primary" />
              <Stat icon={Star} label="Reviews" value={t.reviews} delta={`+${t.reviews_new_7d} this week`} />
              <Stat icon={Youtube} label="Curated videos" value={t.videos} delta={`+${t.videos_new_today ?? 0} today · +${t.videos_new_7d} 7d · +${t.videos_new_30d ?? 0} 30d`} />
              <Stat icon={Home} label="Properties" value={t.properties} delta={`+${t.properties_new_today ?? 0} today · +${t.properties_new_7d} 7d · +${t.properties_new_30d ?? 0} 30d`} />
              <Stat icon={ShieldCheck} label="Verifications" value={t.verifications} delta={`${t.verifications_pending} pending`} highlight={t.verifications_pending > 0} />
              <Stat icon={MessageSquare} label="Contact msgs" value={t.contact_messages} delta={`${t.contact_new} new · +${t.contact_new_7d ?? 0} 7d`} highlight={t.contact_new > 0} />
              <Stat icon={Sparkles} label="Topics" value={t.curated_categories} />
              <Stat icon={Video} label="Shorts" value={t.shorts} />
              <Stat icon={ClipboardCheck} label="Videos pending review" value={t.videos_pending ?? 0} delta={t.videos_pending ? 'Approve on /admin/curated' : 'All caught up'} highlight={(t.videos_pending ?? 0) > 0} />
              <Stat icon={Link2} label="Property-video links" value={t.property_video_links ?? 0} delta={`${t.property_video_links_pending ?? 0} need review`} highlight={(t.property_video_links_pending ?? 0) > 0} />
              <Stat icon={TrendingUp} label="Video views" value={t.video_views ?? '—'} delta={t.video_views === null || t.video_views === undefined ? 'Tracking table pending' : 'Total plays'} />
            </div>

            {(data.roles || data.top_cities?.length) && (
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {data.roles && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Users by role</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="divide-y divide-border">
                        {Object.entries(data.roles).map(([role, n]) => (
                          <li key={role} className="py-2 flex items-center justify-between">
                            <span className="text-sm capitalize">{role.replace('_', ' ')}</span>
                            <Badge variant="outline" className="text-xs">{n}</Badge>
                          </li>
                        ))}
                        <li className="py-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Renters (users without an explicit role)</span>
                          <span>{Math.max(0, (t.users ?? 0) - Object.values(data.roles).reduce((a, b) => a + b, 0))}</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {data.top_cities && data.top_cities.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><Home className="w-4 h-4 text-primary" /> Top cities by properties</CardTitle>
                      <CardDescription>All-time property count · new in last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="divide-y divide-border">
                        {data.top_cities.slice(0, 10).map((c) => {
                          const newCount = data.new_by_city?.find((n) => n.city === c.city)?.count ?? 0;
                          return (
                            <li key={c.city} className="py-2 flex items-center justify-between">
                              <span className="text-sm truncate">{c.city}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {c.count} total{newCount > 0 && <span className="text-primary font-medium"> · +{newCount} new</span>}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {data.signup_series.length > 0 && <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-4 h-4 text-primary" /> New signups · last 30 days</CardTitle>
                <CardDescription>{t.users_new_30d} new accounts in the last month.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32">
                  {data.signup_series.map((s) => (
                    <div key={s.date} className="flex-1 flex flex-col items-center gap-1" title={`${s.date}: ${s.count}`}>
                      <div className="w-full bg-primary/70 rounded-t" style={{ height: `${(s.count / maxSignup) * 100}%`, minHeight: s.count > 0 ? 2 : 0 }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>{data.signup_series[0]?.date}</span>
                  <span>{data.signup_series[data.signup_series.length - 1]?.date}</span>
                </div>
              </CardContent>
            </Card>}

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <PanelList
                title="Recent signups" icon={Users}
                items={data.recent_users.map((u) => ({
                  primary: u.email ?? '—',
                  secondary: `${u.provider ?? 'email'} · ${timeAgo(u.created_at)}`,
                }))}
                empty="No users yet."
              />
              <PanelList
                title="New contact messages" icon={MessageSquare}
                items={data.recent_contact.map((c: any) => ({
                  primary: c.subject,
                  secondary: `${c.sender_email ?? 'anon'} · ${timeAgo(c.created_at)}`,
                  badge: c.status,
                }))}
                empty="Inbox is empty."
                cta={{ label: 'Open inbox →', to: '/admin/contact' }}
              />
              <PanelList
                title="Recent reviews" icon={Star}
                items={data.recent_reviews.map((r: any) => ({
                  primary: `${r.rating}★ review`,
                  secondary: timeAgo(r.created_at),
                }))}
                empty="No reviews yet."
              />
              <PanelList
                title="Recent curated videos" icon={Youtube}
                items={data.recent_videos.map((v: any) => ({
                  primary: v.title,
                  secondary: `${v.source} · ${timeAgo(v.created_at)}`,
                }))}
                empty="Run bulk seed on /admin/curated."
                cta={{ label: 'Seed more →', to: '/admin/curated' }}
              />
              <PanelList
                title="Recent properties" icon={Home}
                items={data.recent_properties.map((p: any) => ({
                  primary: p.name ?? '—',
                  secondary: `${p.city ?? ''}${p.state ? `, ${p.state}` : ''} · ${timeAgo(p.created_at)}`,
                }))}
                empty="No properties yet."
              />
              <PanelList
                title="Top contributors" icon={TrendingUp}
                items={data.top_contributors.map((u) => ({
                  primary: u.email,
                  secondary: `${u.reviews} reviews`,
                }))}
                empty="No reviews to rank yet."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const QuickLinks = () => (
  <div className="flex flex-wrap gap-1.5">
    {[
      ['/admin/contact', 'Inbox', MessageSquare],
      ['/admin/curated', 'Curated', Sparkles],
      ['/admin/moderate', 'Moderation', Flag],
      ['/admin/verifications', 'Verify', ClipboardCheck],
      ['/admin/settings', 'Settings', Settings],
    ].map(([to, label, Icon]: any) => (
      <Link key={to} to={to} className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </Link>
    ))}
  </div>
);

const EmptyDashboard = ({ error }: { error: string | null }) => (
  <Card className="border-destructive/40">
    <CardContent className="p-5 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
      <div>
        <p className="text-sm font-medium">Admin data could not be loaded.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Open the curated library to verify imports, then refresh this page. {error ? `Last error: ${error}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/admin/curated" className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Open curated library
          </Link>
          <Link to="/admin/properties" className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5" /> Open properties
          </Link>
        </div>
      </div>
    </CardContent>
  </Card>
);

const StatusCard = ({ icon: Icon, title, value, detail, cta, to, ready }: any) => (
  <Card className={ready ? 'border-primary/30' : ''}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </div>
        {ready ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Icon className="w-5 h-5 text-muted-foreground" />}
      </div>
      <p className="text-xs text-muted-foreground mt-2 min-h-4">{detail}</p>
      <Link to={to} className="text-xs text-primary hover:underline mt-3 inline-flex">{cta} →</Link>
    </CardContent>
  </Card>
);

const Stat = ({ icon: Icon, label, value, delta, accent, highlight }: any) => (
  <Card className={highlight ? 'border-primary' : ''}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className={`w-4 h-4 ${accent ?? 'text-muted-foreground'}`} />
      </div>
      <p className="text-2xl font-bold mt-1">{value?.toLocaleString?.() ?? 0}</p>
      {delta && <p className={`text-[11px] mt-0.5 ${highlight ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{delta}</p>}
    </CardContent>
  </Card>
);

const PanelList = ({ title, icon: Icon, items, empty, cta }: any) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /> {title}</CardTitle>
        {cta && <Link to={cta.to} className="text-xs text-primary hover:underline">{cta.label}</Link>}
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">{empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.slice(0, 6).map((it: any, i: number) => (
            <li key={i} className="py-2 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{it.primary}</p>
                <p className="text-[11px] text-muted-foreground truncate">{it.secondary}</p>
              </div>
              {it.badge && <Badge variant="outline" className="text-[10px]">{it.badge}</Badge>}
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

async function loadBrowserFallback(reason: string): Promise<Analytics> {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400_000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const safe = async <T,>(promise: PromiseLike<T>, fallback: T): Promise<T> => {
    try { return await promise; } catch { return fallback; }
  };
  const count = async (table: string, build?: (q: any) => any) => {
    const base = (supabase as any).from(table).select('id', { head: true, count: 'exact' });
    const res = await safe(build ? build(base) : base, { count: 0, error: null });
    return res?.error ? 0 : res?.count ?? 0;
  };

  const [
    reviews, reviews7, reviews30,
    videos, videosToday, videos7, videos30, videosPending, videosApproved, videosRejected,
    shorts,
    properties, propertiesToday, properties7, properties30,
    verifications, verificationsPending,
    curatedCategories,
    contactMessages, contactNew, contact7,
    propertyVideoLinks, propertyVideoLinksApproved, propertyVideoLinksPending,
    recentReviewsRes, recentVideosRes, recentContactRes, recentPropertiesRes, propertyCitiesRes,
  ] = await Promise.all([
    count('reviews'),
    count('reviews', (q) => q.gte('created_at', iso(daysAgo(7)))),
    count('reviews', (q) => q.gte('created_at', iso(daysAgo(30)))),
    count('seeded_videos'),
    count('seeded_videos', (q) => q.gte('created_at', iso(startOfToday))),
    count('seeded_videos', (q) => q.gte('created_at', iso(daysAgo(7)))),
    count('seeded_videos', (q) => q.gte('created_at', iso(daysAgo(30)))),
    count('seeded_videos', (q) => q.eq('moderation_status', 'pending')),
    count('seeded_videos', (q) => q.eq('moderation_status', 'approved')),
    count('seeded_videos', (q) => q.eq('moderation_status', 'rejected')),
    count('shorts'),
    count('properties'),
    count('properties', (q) => q.gte('created_at', iso(startOfToday))),
    count('properties', (q) => q.gte('created_at', iso(daysAgo(7)))),
    count('properties', (q) => q.gte('created_at', iso(daysAgo(30)))),
    count('user_verifications'),
    count('user_verifications', (q) => q.eq('status', 'pending')),
    count('curated_categories'),
    count('contact_message'),
    count('contact_message', (q) => q.eq('status', 'new')),
    count('contact_message', (q) => q.gte('created_at', iso(daysAgo(7)))),
    count('property_videos'),
    count('property_videos', (q) => q.eq('is_approved', true)),
    count('property_videos', (q) => q.eq('is_approved', false)),
    safe((supabase as any).from('reviews').select('id, created_at, user_id, property_id, rating').order('created_at', { ascending: false }).limit(10), { data: [] as any[] }),
    safe((supabase as any).from('seeded_videos').select('id, created_at, title, source').order('created_at', { ascending: false }).limit(10), { data: [] as any[] }),
    safe((supabase as any).from('contact_message').select('id, created_at, subject, sender_email, status').order('created_at', { ascending: false }).limit(10), { data: [] as any[] }),
    safe((supabase as any).from('properties').select('id, created_at, name, city, state').order('created_at', { ascending: false }).limit(10), { data: [] as any[] }),
    safe((supabase as any).from('properties').select('city, created_at').not('city', 'is', null).limit(20000), { data: [] as any[] }),
  ]);

  const cityAll = new Map<string, number>();
  const cityNew = new Map<string, number>();
  const cutoff30 = daysAgo(30).getTime();
  for (const p of (propertyCitiesRes as any).data ?? []) {
    const c = String(p.city ?? '').trim();
    if (!c) continue;
    cityAll.set(c, (cityAll.get(c) ?? 0) + 1);
    if (new Date(p.created_at).getTime() >= cutoff30) cityNew.set(c, (cityNew.get(c) ?? 0) + 1);
  }

  return {
    source: 'browser-fallback',
    warning: reason,
    generated_at: now.toISOString(),
    totals: {
      users: 0,
      users_new_7d: 0,
      users_new_30d: 0,
      reviews,
      reviews_new_7d: reviews7,
      reviews_new_30d: reviews30,
      videos,
      videos_new_today: videosToday,
      videos_new_7d: videos7,
      videos_new_30d: videos30,
      videos_pending: videosPending,
      videos_approved: videosApproved,
      videos_rejected: videosRejected,
      shorts,
      properties,
      properties_new_today: propertiesToday,
      properties_new_7d: properties7,
      properties_new_30d: properties30,
      verifications,
      verifications_pending: verificationsPending,
      curated_categories: curatedCategories,
      contact_messages: contactMessages,
      contact_new: contactNew,
      contact_new_7d: contact7,
      property_video_links: propertyVideoLinks,
      property_video_links_approved: propertyVideoLinksApproved,
      property_video_links_pending: propertyVideoLinksPending,
      video_views: null as any,
    },
    roles: undefined,
    top_cities: [...cityAll.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([city, count]) => ({ city, count })),
    new_by_city: [...cityNew.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([city, count]) => ({ city, count })),
    signup_series: [],
    recent_users: [],
    top_contributors: [],
    recent_reviews: (recentReviewsRes as any).data ?? [],
    recent_videos: (recentVideosRes as any).data ?? [],
    recent_contact: (recentContactRes as any).data ?? [],
    recent_properties: (recentPropertiesRes as any).data ?? [],
  };
}

export default AdminDashboard;