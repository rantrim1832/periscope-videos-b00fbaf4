# Go-Live Activation Checklist

The app runs **fully on mock providers** with zero setup (great for demos). To
switch to **real data**, follow these steps. Nothing here changes app code —
it's configuration + data loading.

Run `npx tsx scripts/setup-check.ts` at any time to see what's configured.

## 1. Database
- [ ] Apply all migrations in `supabase/migrations/` (in filename order).
- [ ] Regenerate types: `supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts`.
- [ ] Seed the **first admin** via the Supabase SQL editor:
      `insert into public.user_roles (user_id, role) values ('<auth-user-uuid>', 'admin');`
      (Self-admin was removed in Phase 0 — this is intentional.)

## 2. Secrets (Supabase Edge Function secrets / host env — never in the client)
- [ ] `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `MAPBOX_TOKEN` (geocoding)
- [ ] `RENTCAST_API_KEY` (enrichment)
- [ ] `LOVABLE_API_KEY` (AI moderation — else fail-closed)
- [ ] `WEBHOOK_SECRET` (seed-review / taggbox webhooks)
- [ ] `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_STREAM_TOKEN` (video upload)
- [ ] `SEARCH_API_KEY` (official-channel discovery — optional; **paid vendor decision**)

## 3. Deploy edge functions
`supabase/functions/`: submit-review, recompute-truth-score, verify-residency,
og-image, sitemap, moderate-content, enrich-property, scrape-properties,
estimate-scrape, estimate-scrape-radius, delete-properties, import-csv-properties,
seed-review, taggbox-webhook.
- [ ] Deploy all. `config.toml` sets `verify_jwt` correctly (webhooks + og-image + sitemap are public; the rest require JWT + in-function role checks).

## 4. Frontend flag
- [ ] In Lovable `.env`, set `VITE_EXTERNAL_SUPABASE_URL`,
      `VITE_EXTERNAL_SUPABASE_PROJECT_ID`, and
      `VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY` to the external Supabase project.
      These aliases are preferred because Lovable Cloud can rewrite
      `VITE_SUPABASE_*`.
- [ ] Set `VITE_USE_CANONICAL=true` so the app reads the canonical graph instead of mock fixtures.

## 5. Load inventory & official content
- [ ] `npm run ingest -- --source csv_import <list1.csv> <list2.csv> <list3.csv>` (loads ~73.5k properties; dedups, geocodes, quarantines).
- [ ] `npm run seed:channels -- --limit 5000` (attaches official channels; needs `SEARCH_API_KEY` for real discovery, else mock).
- [ ] Point `sitemap.xml` at the `sitemap` edge function (or copy its output).

## 6. Verify
- [ ] `npm run build` succeeds.
- [ ] `npx tsx scripts/truthscore-check.ts` passes.
- [ ] Spot-check: search a property → property page shows real data; submit a review → appears in `/admin/moderate` → approve → Truth Score recomputes.

## Escalation items (external decisions)
- Paid **search/Places vendor** for nationwide channel discovery at scale.
- Social-platform **OAuth app approvals** (Meta/TikTok/YouTube) for real content auto-sync.

## Publish
Deploy `dist/` (or Lovable → Publish, which syncs `main`).
