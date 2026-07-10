# Cursor Deploy Queue

Lovable agent appends here whenever backend changes are made. Cursor deploys items to the external Supabase project, then checks them off.

Format:
- `[ ] YYYY-MM-DD` — description
  - Functions: `function-name-1`, `function-name-2`
  - Migrations: `supabase/migrations/<file>.sql`
  - Secrets: `SECRET_NAME` (set in external Supabase dashboard)

---

## Pending

- [ ] 2026-07-10 — AI descriptions button + Google reviews seeding
  - Functions: `generate-video-summary`, `fetch-google-reviews`
  - Secrets: `GOOGLE_PLACES_API_KEY`

## Done

(move items here after deploy)
