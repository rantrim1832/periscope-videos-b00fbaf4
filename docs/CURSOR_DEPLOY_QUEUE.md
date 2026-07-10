# Cursor Deploy Queue

Lovable agent appends here whenever backend changes are made. Cursor deploys items to the external Supabase project, then checks them off.

Format:
- `[ ] YYYY-MM-DD` — description
  - Functions: `function-name-1`, `function-name-2`
  - Migrations: `supabase/migrations/<file>.sql`
  - Secrets: `SECRET_NAME` (set in external Supabase dashboard)

---

## Pending

- [ ] 2026-07-10 — Google reviews diagnostics and stronger Places lookup
  - Functions: `fetch-google-reviews`
  - Notes: Redeploy so `/admin/curated` shows real failure breakdown (`google_api_error`, `no_place_found`, `no_reviews_returned`) instead of silently reporting `0 reviews cached`.

- [ ] 2026-07-10 — AI descriptions button + Google reviews seeding
  - Functions: `generate-video-summary`, `fetch-google-reviews`
  - Secrets: `GOOGLE_PLACES_API_KEY`

## Done

(move items here after deploy)
