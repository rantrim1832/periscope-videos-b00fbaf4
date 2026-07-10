// Admin analytics — returns a single JSON payload for the /admin dashboard.
// Uses the service role so we can read auth.users (for signup timeline / emails)
// and cross-table counts safely. Admin check is enforced up front.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authed = createClient(supaUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await authed.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401);
    const userId = claims.claims.sub as string;

    const admin = createClient(supaUrl, serviceKey);
    const { data: role } = await admin.from('user_roles').select('role')
      .eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!role) return json({ error: 'Admin only' }, 403);

    const now = new Date();
    const iso = (d: Date) => d.toISOString();
    const daysAgo = (n: number) => new Date(now.getTime() - n * 86400_000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch counts in parallel.
    const [
      usersList, // auth.users listing
      reviewsHead, reviews7, reviews30,
      videosHead, videosToday, videos7, videos30, videosPending,
      shortsHead,
      propertiesHead, propertiesToday, properties7, properties30,
      verificationsHead, verificationsPending,
      curatedHead,
      contactHead, contactNew, contact7,
      recentReviews, recentVideos, recentContact, recentProperties,
      rolesList, propertyCities, videoViewsHead,
    ] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from('reviews').select('*', { head: true, count: 'exact' }),
      admin.from('reviews').select('*', { head: true, count: 'exact' }).gte('created_at', iso(daysAgo(7))),
      admin.from('reviews').select('*', { head: true, count: 'exact' }).gte('created_at', iso(daysAgo(30))),
      admin.from('seeded_videos').select('*', { head: true, count: 'exact' }),
      admin.from('seeded_videos').select('*', { head: true, count: 'exact' }).gte('created_at', iso(startOfToday)),
      admin.from('seeded_videos').select('*', { head: true, count: 'exact' }).gte('created_at', iso(daysAgo(7))),
      admin.from('seeded_videos').select('*', { head: true, count: 'exact' }).gte('created_at', iso(daysAgo(30))),
      admin.from('seeded_videos').select('*', { head: true, count: 'exact' }).eq('moderation_status', 'pending'),
      admin.from('shorts').select('*', { head: true, count: 'exact' }),
      admin.from('properties').select('*', { head: true, count: 'exact' }),
      admin.from('properties').select('*', { head: true, count: 'exact' }).gte('created_at', iso(startOfToday)),
      admin.from('properties').select('*', { head: true, count: 'exact' }).gte('created_at', iso(daysAgo(7))),
      admin.from('properties').select('*', { head: true, count: 'exact' }).gte('created_at', iso(daysAgo(30))),
      admin.from('user_verifications').select('*', { head: true, count: 'exact' }),
      admin.from('user_verifications').select('*', { head: true, count: 'exact' }).eq('status', 'pending'),
      admin.from('curated_categories').select('*', { head: true, count: 'exact' }),
      admin.from('contact_message').select('*', { head: true, count: 'exact' }),
      admin.from('contact_message').select('*', { head: true, count: 'exact' }).eq('status', 'new'),
      admin.from('contact_message').select('*', { head: true, count: 'exact' }).gte('created_at', iso(daysAgo(7))),
      admin.from('reviews').select('id, created_at, user_id, property_id, rating').order('created_at', { ascending: false }).limit(10),
      admin.from('seeded_videos').select('id, created_at, title, source').order('created_at', { ascending: false }).limit(10),
      admin.from('contact_message').select('id, created_at, subject, sender_email, status').order('created_at', { ascending: false }).limit(10),
      admin.from('properties').select('id, created_at, name, city, state').order('created_at', { ascending: false }).limit(10),
      admin.from('user_roles').select('role, user_id').limit(5000),
      admin.from('properties').select('city, created_at').not('city', 'is', null).limit(20000),
      // Video views table may not exist yet — swallow the error and treat as 0.
      admin.from('video_views' as any).select('*', { head: true, count: 'exact' }).then((r: any) => r).catch(() => ({ count: null })),
    ]);

    const allUsers = usersList.data?.users ?? [];
    const totalUsers = allUsers.length;
    const newUsers7 = allUsers.filter((u) => new Date(u.created_at) >= daysAgo(7)).length;
    const newUsers30 = allUsers.filter((u) => new Date(u.created_at) >= daysAgo(30)).length;

    // Signup time-series (last 30 days)
    const signupDays: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) signupDays[iso(daysAgo(i)).slice(0, 10)] = 0;
    for (const u of allUsers) {
      const key = u.created_at.slice(0, 10);
      if (key in signupDays) signupDays[key]++;
    }
    const signupSeries = Object.entries(signupDays).map(([date, count]) => ({ date, count }));

    // Recent signups (last 10)
    const recentUsers = [...allUsers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, provider: u.app_metadata?.provider }));

    // Top contributors (reviews per user)
    const contribRes = await admin.from('reviews').select('user_id').limit(5000);
    const contribCounts = new Map<string, number>();
    for (const r of contribRes.data ?? []) {
      if (r.user_id) contribCounts.set(r.user_id, (contribCounts.get(r.user_id) ?? 0) + 1);
    }
    const emailById = new Map(allUsers.map((u) => [u.id, u.email]));
    const topContributors = [...contribCounts.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([user_id, count]) => ({ user_id, email: emailById.get(user_id) ?? '—', reviews: count }));

    // Role breakdown
    const roleCounts: Record<string, number> = { admin: 0, moderator: 0, user: 0, property_manager: 0, staff: 0 };
    for (const r of (rolesList.data as any[]) ?? []) {
      const k = r.role as string;
      roleCounts[k] = (roleCounts[k] ?? 0) + 1;
    }

    // Top cities (all-time) + new-in-30d by city
    const cityAll = new Map<string, number>();
    const cityNew = new Map<string, number>();
    const cutoff30 = daysAgo(30).getTime();
    for (const p of (propertyCities.data as any[]) ?? []) {
      const c = (p.city ?? '').trim();
      if (!c) continue;
      cityAll.set(c, (cityAll.get(c) ?? 0) + 1);
      if (new Date(p.created_at).getTime() >= cutoff30) {
        cityNew.set(c, (cityNew.get(c) ?? 0) + 1);
      }
    }
    const topCities = [...cityAll.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([city, count]) => ({ city, count }));
    const newByCity = [...cityNew.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    return json({
      generated_at: now.toISOString(),
      totals: {
        users: totalUsers,
        users_new_7d: newUsers7,
        users_new_30d: newUsers30,
        reviews: reviewsHead.count ?? 0,
        reviews_new_7d: reviews7.count ?? 0,
        reviews_new_30d: reviews30.count ?? 0,
        videos: videosHead.count ?? 0,
        videos_new_today: videosToday.count ?? 0,
        videos_new_7d: videos7.count ?? 0,
        videos_new_30d: videos30.count ?? 0,
        videos_pending: videosPending.count ?? 0,
        shorts: shortsHead.count ?? 0,
        properties: propertiesHead.count ?? 0,
        properties_new_today: propertiesToday.count ?? 0,
        properties_new_7d: properties7.count ?? 0,
        properties_new_30d: properties30.count ?? 0,
        verifications: verificationsHead.count ?? 0,
        verifications_pending: verificationsPending.count ?? 0,
        curated_categories: curatedHead.count ?? 0,
        contact_messages: contactHead.count ?? 0,
        contact_new: contactNew.count ?? 0,
        contact_new_7d: contact7.count ?? 0,
        video_views: (videoViewsHead as any)?.count ?? null,
      },
      roles: roleCounts,
      top_cities: topCities,
      new_by_city: newByCity,
      signup_series: signupSeries,
      recent_users: recentUsers,
      top_contributors: topContributors,
      recent_reviews: recentReviews.data ?? [],
      recent_videos: recentVideos.data ?? [],
      recent_contact: recentContact.data ?? [],
      recent_properties: recentProperties.data ?? [],
    });
  } catch (e) {
    return json({ error: 'Unhandled', detail: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}