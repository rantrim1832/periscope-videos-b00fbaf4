## What I'm building

Three features + one important constraint you need to know about.

### Constraint first (read this)
Production database is owned by Cursor (external Supabase). I **cannot** create new tables or run migrations from here. That affects two pieces:
- **Video view tracking** needs a new `video_views` table → I'll write the SQL and drop it in `docs/LOVABLE_AGENT_MAILBOX.md` for Cursor to run. Until then, the dashboard shows views as "pending schema".
- **Analytics counts** (properties, users, videos, cities) all use existing tables → these work immediately.

---

### 1. Admin Analytics Dashboard — `/admin/dashboard`

New page with metric cards + tables, all read-only queries against existing tables:

- **Properties**: total, new today / 7d / 30d
- **Videos**: total approved, new today / 7d / 30d, pending review count
- **Users**: total, new 7d/30d, split by role (renter / property_manager / staff / admin) from `user_roles`
- **Top cities**: property count by city (top 10)
- **New properties by city** (last 30d)
- **Contact submissions**: new 7d, unread count
- **Video views**: placeholder card until `video_views` table exists

Added to admin nav. Uses existing shadcn Card + a small recharts bar for city breakdown.

### 2. Homepage rails — trending & viral

- **Logged-in users** (top of home feed): "🔥 Trending now" horizontal rail pulling top videos from the 4 viral/funny curated categories, sorted by YouTube view count (already stored on `seeded_videos`).
- **Logged-out visitors** (join teaser section): "See what's going viral" 4-thumbnail strip with view counts. Clicking any thumbnail opens the auth/join modal.

Both rails reuse the existing video card component. No schema changes.

### 3. "Near you" IP-based local rail

- New edge function `geo-locate` reads `x-forwarded-for` → calls `ipapi.co/{ip}/json` (free tier, no key) → returns `{ city, region, country }`.
- Homepage calls it once on mount, caches in sessionStorage.
- If result matches a city we have videos for, show "📍 Popular near you" rail above trending. Silent — no permission prompt, no banner.
- **Privacy note**: I'll add a one-line disclosure to your privacy policy page ("We use your IP address to show locally relevant content"). Required for GDPR if you get any EU traffic; harmless for US-only. Tell me if you want me to skip this line.
- VPN/no-match users just don't see the rail — graceful fallback.

### 4. Mailbox note to Cursor

Append to `docs/LOVABLE_AGENT_MAILBOX.md`:
```sql
CREATE TABLE public.video_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  video_source text NOT NULL, -- 'shorts' | 'seeded_videos' | 'property_videos'
  viewer_id uuid,             -- nullable for anon
  ip_hash text,               -- sha256(ip) for dedup, no raw IP stored
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_video_views_video ON public.video_views(video_id, created_at DESC);
CREATE INDEX idx_video_views_created ON public.video_views(created_at DESC);
GRANT SELECT, INSERT ON public.video_views TO authenticated, anon;
GRANT ALL ON public.video_views TO service_role;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert views" ON public.video_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read all views" ON public.video_views FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```
Once Cursor runs it, the dashboard view-count cards light up automatically.

---

### Files I'll touch

**New:**
- `src/pages/AdminDashboard.tsx`
- `src/components/admin/MetricCard.tsx`
- `src/components/home/TrendingRail.tsx`
- `src/components/home/NearYouRail.tsx`
- `src/components/home/JoinTeaserViral.tsx`
- `src/hooks/useGeoLocation.ts`
- `supabase/functions/geo-locate/index.ts`

**Edited:**
- `src/App.tsx` (add `/admin/dashboard` route)
- `src/components/AdminLayout.tsx` or wherever admin nav lives (add link)
- `src/pages/Index.tsx` or homepage (mount the 3 rails / teaser)
- `docs/LOVABLE_AGENT_MAILBOX.md` (SQL for Cursor)
- Privacy policy page (one-line IP disclosure)

### Answers to your workflow questions

**Steps end-to-end:**
1. Approve videos in `/admin/curated` (Preview → Import)
2. Optional: attach video to a specific property in `/admin/properties`
3. Video appears on homepage rails + property page automatically
4. Google Reviews are a separate pipeline (RentCast scraper → `property_external_reviews`); not tied to video approval
5. Monitor everything in the new `/admin/dashboard`

**How many videos?** Each YouTube query = ~25 results. Your 4 viral categories × ~5 queries = ~500 candidates per full sweep. Realistic keep-rate ~10–20%, so 50–100 approved per session.
