# Cursor Deploy Queue

Lovable agent appends here whenever backend changes are made. Cursor deploys items to the external Supabase project, then checks them off.

Format:
- `[ ] YYYY-MM-DD` — description
  - Functions: `function-name-1`, `function-name-2`
  - Migrations: `supabase/migrations/<file>.sql`
  - Secrets: `SECRET_NAME` (set in external Supabase dashboard)

---

## Pending

- [ ] 2026-07-10 — `generate-video-summary` returning 401 in production
  - Functions: `generate-video-summary`
  - Symptom: Admin clicks "Generate AI descriptions" in `/admin/curated` and gets `Edge function returned 401: {"error":"Unauthorized"}`. Verified via signed-in admin session with a fresh access token (client re-validates with `supabase.auth.getUser()` before invoking and passes explicit `Authorization: Bearer <token>`), so the client side is sound.
  - Likely causes on external Supabase to check in this order:
    1. Function is deployed but running an older build that doesn't accept the current JWT signing key — redeploy `generate-video-summary` so it picks up the latest signing keys / JWKS.
    2. `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_URL` env missing/stale on the function, causing `admin.auth.getUser(token)` to fail and return the 401 branch.
    3. `LOVABLE_API_KEY` missing on the external project (function returns 500 for this, but worth confirming while redeploying).
  - Repro: `POST https://<external>.supabase.co/functions/v1/generate-video-summary` with a valid admin bearer token and body `{"limit":1,"onlyMissing":true}` → currently 401.
  - Client change already shipped: `src/pages/AdminCuratedVideos.tsx` now re-validates the session with `getUser()` before invoking, so any remaining 401 is server-side.

- [ ] 2026-07-10 — Google reviews diagnostics and stronger Places lookup
  - Functions: `fetch-google-reviews`
  - Notes: Redeploy so `/admin/curated` shows real failure breakdown (`google_api_error`, `no_place_found`, `no_reviews_returned`) instead of silently reporting `0 reviews cached`.

- [ ] 2026-07-10 — AI descriptions button + Google reviews seeding
  - Functions: `generate-video-summary`, `fetch-google-reviews`
  - Secrets: `GOOGLE_PLACES_API_KEY`

## Done

(move items here after deploy)
