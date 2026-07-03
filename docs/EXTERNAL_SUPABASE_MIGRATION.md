# Cutover: Lovable Cloud → External Supabase

This project is currently on **Lovable Cloud** (a managed Supabase behind the
scenes). This doc is the step-by-step to move production DB / auth / edge
functions / storage to your **own** Supabase project while keeping Lovable as
the frontend host on your custom domain.

> ⚠️ Lovable Cloud cannot be fully removed from an existing project. After the
> switch, Cloud stays "attached" but the deployed frontend will read from your
> external project because `VITE_SUPABASE_URL` points there.

---

## 0. Prereqs
- External Supabase project created (note its **ref** and **anon key**).
- Supabase CLI installed locally: `brew install supabase/tap/supabase`.
- Lovable Pro plan (required for custom domain).

## 1. Export data from Cloud
Lovable Cloud does not expose the direct DB password or service role key. Use
the in-editor **View Backend → Database → Backups / SQL editor** to export:
  - Schema-only dump (or rely on `supabase/migrations/` — already in this repo).
  - Data dump per table (CSV export from the table view, or `COPY ... TO STDOUT`
    via the SQL editor for small tables).

For large datasets, ask Lovable support for a pg_dump of the Cloud project.

## 2. Apply schema to the external project
```bash
cd supabase
supabase link --project-ref <YOUR_EXTERNAL_REF>
supabase db push          # applies everything in supabase/migrations/
```

## 3. Load data
Import the CSVs / SQL from step 1 into the external project via the Supabase
dashboard (Table Editor → Import) or `psql` against the external DB.

## 4. Deploy edge functions
```bash
supabase functions deploy --project-ref <YOUR_EXTERNAL_REF>
```
All functions in `supabase/functions/` will deploy. `config.toml` controls
`verify_jwt` per function — webhooks + og-image + sitemap are public, the rest
require JWT.

## 5. Set Edge Function secrets (on external project)
Dashboard → Edge Functions → Manage Secrets:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (auto for the external project)
- `RENTCAST_API_KEY`, `WEBHOOK_SECRET`, `MAPBOX_TOKEN`
- `LOVABLE_API_KEY` (only if you keep using Lovable AI Gateway)
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_STREAM_TOKEN`, `SEARCH_API_KEY`

## 6. Configure Auth on the external project
Dashboard → Authentication:
- **URL Configuration**: Site URL = `https://your-custom-domain.com`,
  Additional Redirect URLs include the Lovable preview URL.
- **Providers**: enable Email + Google (mirror current setup). Configure
  Google OAuth client with `https://<ref>.supabase.co/auth/v1/callback` as the
  authorized redirect.
- Turn OFF anonymous signups. Decide on email auto-confirm (current dev has
  it on — turn OFF for production).

## 7. Recreate storage buckets
There are currently no buckets in this project (see
`supabase-configuration`). If any are added before cutover, recreate them on
the external project with the same names/policies and re-upload objects.

## 8. Point the Lovable frontend at the external project
In the Lovable editor:
1. Copy `.env.production.example` values into the project `.env`
   (overwriting the Cloud-issued values):
   ```
   VITE_SUPABASE_URL=https://<external-ref>.supabase.co
   VITE_SUPABASE_PROJECT_ID=<external-ref>
   VITE_SUPABASE_PUBLISHABLE_KEY=<external-anon-key>
   ```
2. Freeze the auto-generated client so Cloud doesn't rewrite it — after the
   switch, treat `src/integrations/supabase/client.ts` and `types.ts` as
   manually maintained. Regenerate `types.ts` against the external project:
   ```bash
   supabase gen types typescript --project-id <external-ref> \
     > src/integrations/supabase/types.ts
   ```

## 9. Custom domain (Lovable)
Project Settings → Domains → Add:
- `A  @   185.158.133.1`
- `A  www 185.158.133.1`
- `TXT _lovable  <value shown in Lovable>`

See https://docs.lovable.dev/features/custom-domain

## 10. Publish + verify
- Republish from Lovable so Vite rebuilds with the new env.
- Sign in, submit a review, check `/admin/moderate`, confirm data lands in
  the **external** DB (not Cloud).
- Run `npx tsx scripts/setup-check.ts` for a readiness sanity check.

---

## What stops working in the split setup
- Lovable in-editor DB tools (migration UI, RLS scanner, Cloud secrets manager)
  target Cloud, not your external project. Manage those via Supabase CLI /
  dashboard on the external side.
- No SSR — the site remains a static SPA calling Supabase from the browser.
- Any Cloud-only extras (Lovable AI Gateway via `LOVABLE_API_KEY`) still work
  from your external edge functions as long as the secret is set there.