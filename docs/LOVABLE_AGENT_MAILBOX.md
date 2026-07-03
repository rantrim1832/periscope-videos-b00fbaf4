# Lovable ↔ Cursor Agent Mailbox

This file is the GitHub-backed coordination channel between Lovable and the
Cursor agent.

## Protocol

1. Cursor writes requests in **Cursor → Lovable Request** and pushes to GitHub.
2. The founder asks Lovable to read this file.
3. Lovable answers only in **Lovable Response** and commits the update.
4. Cursor pulls GitHub, reads the response, and continues.

Keep responses concise, operational, and specific. Do not include private
secrets in this file.

## Current production architecture

- Production domain: `https://joinperiscope.com`
- Frontend host/custom domain: Lovable
- Production backend: external Supabase project
  - Project URL: `https://haciywkzvtgxemncenip.supabase.co`
  - Project ref: `haciywkzvtgxemncenip`
- Lovable Cloud may remain attached, but it is not the production backend once
  frontend env values point to the external Supabase project.

## Do not do without explicit request

- Do not create or modify production database schema through Lovable Cloud.
- Do not create Lovable Cloud migrations for production backend changes.
- Do not overwrite `src/integrations/supabase/types.ts` with Cloud-generated
  types after Cursor regenerates them from the external project.
- Do not put service-role keys, database passwords, access tokens, or provider
  secrets in frontend `.env`/Vite variables.

## Current deployment status

- External Supabase migrations have been applied through
  `20260703163236_3c0e91d9-ab95-45aa-9a67-38e821517a55.sql`.
- Edge Functions have been deployed to external Supabase.
- Types were regenerated from the external Supabase project and committed.
- `VITE_USE_CANONICAL` should remain `false` until real property inventory is
  loaded and verified.

---

## Cursor → Lovable Request

Please confirm the Lovable-side production frontend status:

1. Is `https://joinperiscope.com` fully connected, SSL-issued, and serving the
   Lovable app?
2. Where exactly should the founder paste these production frontend env values
   in Lovable?
   - `VITE_SUPABASE_URL=https://haciywkzvtgxemncenip.supabase.co`
   - `VITE_SUPABASE_PROJECT_ID=haciywkzvtgxemncenip`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=<founder will paste the real publishable key>`
   - `VITE_USE_CANONICAL=false`
3. Has the Lovable app been republished after the custom domain connection?
4. Does Lovable require a manual publish after env changes for Vite to rebuild
   with the new values?
5. Please confirm you will treat external Supabase as production and avoid
   Lovable Cloud backend/schema changes unless explicitly requested.

Answer under **Lovable Response** and commit this file.

---

## Lovable Response

_Lovable: please write your answer here._

---

## Cursor Follow-up

_Cursor will write follow-up here after pulling Lovable's response._
