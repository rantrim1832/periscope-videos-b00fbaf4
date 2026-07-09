import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users, MessageSquare, Video, Home, Star, ShieldCheck, Sparkles,
  TrendingUp, Loader2, Settings, Youtube, Flag, ClipboardCheck,
} from 'lucide-react';

type Analytics = {
  totals: Record<string, number>;
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

  useEffect(() => {
    (async () => {
      const { data: res, error } = await supabase.functions.invoke('admin-analytics');
      if (error) toast({ title: 'Failed to load analytics', description: error.message, variant: 'destructive' });
      else setData(res as Analytics);
      setLoading(false);
    })();
  }, [toast]);

  const t = data?.totals ?? {};
  const maxSignup = Math.max(1, ...(data?.signup_series ?? []).map((s) => s.count));

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <div className="container px-4 py-6 md:py-10 max-w-6xl">
        <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" /> Admin dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time overview of users, content, and support activity.</p>
          </div>
          <QuickLinks />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">No data.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Stat icon={Users} label="Users" value={t.users} delta={`+${t.users_new_7d} this week`} accent="text-primary" />
              <Stat icon={Star} label="Reviews" value={t.reviews} delta={`+${t.reviews_new_7d} this week`} />
              <Stat icon={Youtube} label="Curated videos" value={t.videos} delta={`+${t.videos_new_7d} this week`} />
              <Stat icon={Home} label="Properties" value={t.properties} delta={`+${t.properties_new_7d} this week`} />
              <Stat icon={ShieldCheck} label="Verifications" value={t.verifications} delta={`${t.verifications_pending} pending`} highlight={t.verifications_pending > 0} />
              <Stat icon={MessageSquare} label="Contact msgs" value={t.contact_messages} delta={`${t.contact_new} new`} highlight={t.contact_new > 0} />
              <Stat icon={Sparkles} label="Topics" value={t.curated_categories} />
              <Stat icon={Video} label="Shorts" value={t.shorts} />
            </div>

            <Card className="mb-6">
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
            </Card>

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

export default AdminDashboard;