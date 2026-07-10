
# Creator Channels for Periscope

Turn Periscope into a two-sided platform: content creators in the multifamily/apartment industry get their own channel pages, can claim videos we already embedded, submit new YouTube URLs, and eventually upload native video. Verification is self-serve via a code they paste into their YouTube channel description.

Per project memory, **Cursor owns the production schema on external Supabase**. All SQL below will be drafted as a migration file + posted to `docs/LOVABLE_AGENT_MAILBOX.md` for Cursor to run. I will not execute `supabase--migration` against production.

## Scope of this pass

1. Creator role, profile, channel page
2. Claim existing videos (by YouTube channel ID match)
3. Submit new YouTube URL → goes into curation queue
4. Native video upload (stored in a new `creator-videos` Supabase Storage bucket)
5. Code-in-description verification (self-serve via YouTube Data API)
6. Featured Creators rail on homepage + creator tab in TrendingRail
7. Admin moderation surface at `/admin/creators`

## Schema (for Cursor to run)

```sql
-- 1. New role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'creator';

-- 2. Creator profiles
CREATE TABLE public.creator_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text NOT NULL UNIQUE,           -- URL slug, e.g. "urban-living"
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  banner_url text,
  youtube_channel_id text UNIQUE,        -- UC... — used for claims + verification
  youtube_url text,
  instagram_url text,
  tiktok_url text,
  website_url text,
  verified boolean NOT NULL DEFAULT false,
  verification_code text,                -- code they must paste in YT description
  verification_requested_at timestamptz,
  verified_at timestamptz,
  featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected | suspended
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
-- GRANTs, RLS, indexes, update trigger (see mailbox note for full SQL)

-- 3. Attribution on existing video tables
ALTER TABLE public.seeded_videos   ADD COLUMN creator_id uuid REFERENCES public.creator_channels(id) ON DELETE SET NULL;
ALTER TABLE public.property_videos ADD COLUMN creator_id uuid REFERENCES public.creator_channels(id) ON DELETE SET NULL;
ALTER TABLE public.shorts          ADD COLUMN creator_id uuid REFERENCES public.creator_channels(id) ON DELETE SET NULL;
-- Optional: source text ('scraped' | 'claimed' | 'submitted' | 'uploaded')

-- 4. Creator submissions queue (before promotion into seeded_videos)
CREATE TABLE public.creator_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creator_channels(id) ON DELETE CASCADE,
  kind text NOT NULL,                    -- 'youtube_url' | 'native_upload'
  youtube_url text,
  storage_path text,                     -- for native uploads
  title text,
  description text,
  hashtags text[],
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: creators can CRUD their own channel + submissions; public can read `approved` channels + `verified` creator info; admins full access via `has_role`.

Storage bucket `creator-videos` (private, signed-URL playback for now).

## Frontend

New pages:
- `/creator/apply` — role request form (creates pending `creator_channels` row)
- `/creator/dashboard` — edit channel, request verification, submit YouTube URL, upload video, see claimed videos, view submission status
- `/creator/:handle` — public channel page: banner, bio, socials, verified badge, video grid
- `/creators` — browse all approved creators
- `/admin/creators` — moderation: approve/reject applications, mark featured, review submissions

Updates to existing surfaces:
- `Watch.tsx` — if video has `creator_id`, show byline "By [Name] →" linking to channel + verified badge
- `TrendingRail.tsx` — add "Creators" tab showing featured creators
- Homepage — add `FeaturedCreatorsRail` component
- Nav — add "For Creators" link routing to `/creator/apply`

## Verification flow (code-in-description)

1. Creator enters their YouTube channel URL in dashboard
2. We resolve `UC...` id via YouTube Data API (`youtube-verify-channel` edge function) and store on `creator_channels`
3. We generate a random `PERISCOPE-VERIFY-XXXXXX` code, show it in UI
4. Creator pastes it into their YouTube channel description
5. They click "Verify" → edge function calls YouTube `channels.list?part=snippet` and checks description contains the code
6. On success: set `verified=true`, `verified_at=now()`, auto-claim all existing videos where `channel_id` matches

## Edge functions (new)

- `youtube-verify-channel` — resolves channel URL to `UC...` id via YouTube Data API
- `verify-creator-channel` — runs the code check + auto-claim
- `submit-creator-video` — validates YouTube URL, creates submission row, fetches metadata
- `approve-creator-submission` — admin-only, promotes submission into `seeded_videos` with `creator_id` set

Reuse existing pattern: `verify_jwt=false` in config + `admin.auth.getUser(token)` in-function (matches recent auth fix).

## Handoff to Cursor

I will:
- Add full SQL + storage bucket instructions to `docs/LOVABLE_AGENT_MAILBOX.md`
- Ship all frontend code + edge functions so the moment Cursor runs the migration, everything works
- Guard queries with try/catch so the site keeps working before migration lands

## Out of scope this pass

- Native video transcoding / thumbnails (we'll accept .mp4 up to 500MB and use HTML5 `<video>`)
- Creator analytics dashboard
- Monetization / tips
- Comments / subscriptions
