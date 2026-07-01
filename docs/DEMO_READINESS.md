# Demo Readiness Report — Pariscope

**Build status:** ✅ `tsc` clean · `eslint` clean · `vite build` succeeds · preview serves HTTP 200
**Data mode:** Mock providers by default (no secrets required). Set `VITE_USE_CANONICAL=true` + Supabase creds to switch to live data.

## Suitable for
Founder UX review and customer demonstration with production integrations mocked.

## 1. Test/demo artifacts removed
- Fabricated homepage metrics ("12,450+ reviews", "8,200+ verified residents") → replaced with honest value props.
- Legacy `/post` stub → redirects to the real `/contribute` flow; unused import removed.
- No `href="#"` dead links remain in the app shell.

## 2. Mock providers (work with zero keys)
| Concern | Mock behavior |
|---|---|
| Property data | Rich fixtures across rich / sparse / empty states |
| Geocoding | Deterministic US coordinates |
| Video playback | Real public sample HLS stream (genuinely plays) |
| Social embeds | Real YouTube/TikTok/IG iframes |
| Moderation | Fail-closed heuristic |
| Channel discovery | Deterministic candidates + confidence |
| Maps | Keyless OpenStreetMap embed |

## 3. Major flows navigable
- **Discover:** `/` → hero search → `/search`; `/browse` (state→city→property); `/feed` (entertainment).
- **Decide:** `/property/:id` — Truth Score, Report Card (+ shareable image), evidence (video plays), reviews by life stage, official content, map, timeline, nearby, density.
- **Compare:** add-to-compare → `/compare` side-by-side.
- **Contribute:** `/contribute/:id` — import a post OR create; moderation → published/pending/rejected → share.
- **Property managers:** Official content → Claim → `/claim/:id`; admin review at `/admin/claims`; verified managers respond to reviews.
- **Admin:** `/admin/moderate` (review queue), `/admin/claims`.

## 4. Empty states are intentional
- Zero-data property → "Not enough data yet" score + "Be the first to expose or defend this place" + completeness/density panel + nearby.
- Empty evidence/reviews/feed/search → explicit, invitational CTAs.

## 5. Broken links hidden/disabled
- `/properties` → `/browse`; `/post` → `/contribute`; Contact → mailto; Guidelines/Privacy/Terms → clearly-labeled "coming soon" (non-interactive).

## 5b. Mock/demo data clearly labeled (honesty safeguard)
- **Site-wide "Demo mode" banner** (dismissible) whenever running on mock providers: *"all scores, reviews, residents, and videos shown are illustrative sample data, not real content."*
- **"Sample data"** badge on each property's verdict hero in demo mode.
- No real reviews, residents, videos, claims, or scores are fabricated or presented as real — all illustrative content is labeled as such.

## 6. Incomplete features labeled
- **Community** and **Profile** carry a "Preview" banner (illustrative, live data coming soon).
- Official content labeled **Official · Public** vs **Official · Verified**.
- Score shows honest confidence gating ("Early signal" / "Not enough data yet").

## 7. Human Walkthrough (mock build)
- **First-time visitor** → homepage legible ("truth about apartments, with video proof"); search works.
- **Shopper** → property page leads with verdict + playable video evidence; can compare.
- **Doom-scroller** → `/feed` immersive, category rails, every clip anchored to a property.
- **Contributor** → import or record; clear moderation outcomes + share.
- **Property manager** → claim → (admin approve) → verified badge + respond (cannot delete reviews).
- **Admin** → moderation + claim queues functional.

## Embarrassment flags (things to know before showing anyone)
Addressed in this build:
- ✅ Fabricated metrics removed; all sample content now labeled "Demo mode / Sample data."
- ✅ No `href="#"` dead links; `/properties` and `/post` redirected.
- ✅ Community/Profile marked "Preview."

Still true — disclose if asked (not blockers for a mock UX review):
- ⚠️ **Security hardening (Phase 0) is on a separate branch (#1), not in this demo lineage.** Fine for a mocked demo (no real auth/admin abuse surface), but **must merge before any public/live launch** (self-admin escalation, RLS, edge-function authz, fail-closed moderation live).
- ⚠️ **Legacy admin pages** (`/admin/scraper`, `/admin/settings`, `/admin/stats`, `/admin/properties`, `/admin/csv-upload`, `/admin/scrape-logs`) are from the original app and are **not route-guarded in this lineage** (the `AdminRoute` guard is in #1). Reachable by URL; not linked from the demo nav. Avoid demoing them, or merge #1.
- ⚠️ **Legacy `Reviews` and `Shorts` pages** contain leftover sample content and are superseded by `/property` and `/feed`; consider removing from nav for a cleaner demo.
- ⚠️ Contribution/claim **submission requires sign-in**; in pure-mock mode the write is in-memory (no persistence across reload).

## Known demo limitations (by design)
- Live data requires migrations applied + `VITE_USE_CANONICAL=true` + Supabase creds; edge functions deployed; `WEBHOOK_SECRET` set.
- Contribution/claim submission requires sign-in (Supabase Auth); in pure-mock mode contribution uses the in-memory pipeline.
- Legacy `Reviews`/`Shorts` pages retain some sample content; superseded by `/feed`.
- Dynamic OG unfurl needs the edge function deployed; in-app share uses the canvas Report Card image.
- Nationwide scale + real channel discovery need a search/Places vendor (documented; mocked now).

## To publish
`npm run build` → deploy `dist/` (or Lovable Publish). No secrets needed for the mock demo.
