# Pre-Launch Audit + P0 Fixes

You picked: **hard gate**, **illustrated state shapes (bento)**, **audit + fix blockers in parallel**, **ship current legal drafts as-is**.

## ⚠️ One flag I have to state on the record
Hard-gating everything contradicts `docs/PRODUCT_SPEC.md` ("renters never paywalled") and kills:
- Google indexing of `/property/*` and `/city/*` (sitemap becomes useless — every crawler hits a login wall)
- Link unfurls in iMessage/Slack/Twitter (previews show login screen)
- Word-of-mouth ("check out this apartment on Periscope" → friction wall)

I'll build it as you asked. But I'm adding a **feature flag** (`VITE_PUBLIC_BROWSING`) so you can flip to soft-gate in 30 seconds post-launch when you see signup conversion vs. traffic loss. I'll also update the sitemap to only include ungated routes so Google doesn't index login-wall pages (which gets you penalized).

---

## Part 1 — P0 launch blockers (I ship these now)

### 1. Auth hard gate
- New `<AuthGate>` wrapper in `App.tsx` around all routes except: `/`, `/auth`, `/welcome`, `/terms`, `/privacy`, `/dmca`, `/contact`, `/reset-password`
- Unauthenticated users hitting gated routes → redirect to `/auth?next=<original>`
- After sign-in, redirect back to `next`
- Feature flag: `VITE_PUBLIC_BROWSING=true` disables the gate
- Marketing home (`/`) redesigned as a real landing page (value prop, signup CTA, screenshots) instead of the current authenticated dashboard
- Update `robots.txt` + `sitemap` edge function to exclude gated routes while flag is off

### 2. States page: illustrated tiles + perf fix
Current cause of slowness: `listStates()` in `propertyProvider` is doing a full aggregate query on every mount, no cache, no pagination.
Fixes:
- Cache state counts in `sessionStorage` with 1hr TTL (states don't change)
- Add DB-side materialized view or a single `state_counts` RPC (one row per state) — one round-trip instead of counting-in-loop
- Replace text cards with **bento-grid of illustrated state SVG tiles**: state outline in brand teal gradient, name + count overlay, hover lift
- 50 lightweight inline SVG state shapes (all US states) — no image licensing, no network requests, ships in JS bundle (~40KB gzipped)
- Skeleton loaders on first paint

### 3. Error boundaries + monitoring
- Wrap all routes in the existing `ErrorBoundary` (currently only wraps some)
- Add a route-level fallback with "Report this" CTA linking to `/contact`
- Add basic client-side error logging via `console.error` → an `error_logs` table (edge function ingest, admin-viewable)
- Wire an "Uh oh" fallback page for `NotFound` improvements

### 4. Legal + compliance quick-fixes (ship drafts as-is per your call)
- Remove "Launch draft. Not legal advice." disclaimer from `Legal.tsx`
- Add "Last updated: 2026-07-09" and a contact email
- Add cookie banner (single-consent, no vendors) — required for CA/EU visitors even at low volume
- Add "Delete my account" flow in Profile settings (CCPA/GDPR minimum)
- Link Terms + Privacy from the signup form (checkbox: "I agree to…")

### 5. SEO metadata + social sharing
- Fix `index.html`: real `<title>`, `<meta name="description">`, og:*, twitter:card (currently likely template defaults)
- Add JSON-LD `Organization` schema to home
- With hard gate on: sitemap only lists `/`, `/auth`, `/welcome`, `/terms`, `/privacy`, `/dmca` — nothing behind login

### 6. Accessibility P0s
- Add `aria-label` to icon-only buttons across Header, PropertyCard, etc.
- `h-screen` → `h-dvh` for mobile viewport correctness
- Focus-visible rings on all interactive elements (already partly via shadcn)
- Alt text on all `<img>` (audit pass)

---

## Part 2 — Written audit (I deliver as `docs/LAUNCH_AUDIT.md` alongside the code)

Comprehensive review across 12 dimensions with severity ratings (P0/P1/P2) — you decide what else to ship before launch:

1. **Product/UX** — onboarding funnel, empty states, dead ends, mobile touch targets, form validation feedback
2. **Auth & security** — password rules, HIBP check, session expiry, RLS policy coverage per table, admin route hardening
3. **Data integrity** — property dedup, review moderation queue SLA, orphaned records
4. **Performance** — bundle size, image lazy-loading, LCP on key routes, `Property.tsx` render cost
5. **SEO/discoverability** — given hard gate, essentially only landing page matters — recommendations for marketing site pages
6. **Legal/compliance** — Terms/Privacy gaps, GDPR/CCPA, DMCA process readiness, tenant screening disclaimer visibility, cookie consent
7. **Content moderation** — reporting flow SLA, ban/appeal, PM response abuse
8. **Analytics** — what to instrument (signup funnel, contribution completion, share events) — currently minimal
9. **Monitoring/ops** — error tracking (Sentry?), uptime, edge function alerting, DB slow-query watch
10. **Email deliverability** — SPF/DKIM/DMARC status on `joinperiscope.com`, welcome/verification/reset templates, unsubscribe compliance
11. **Payments/business** — none live; but PM claim flow → analytics needs pricing page + Stripe scaffold before PM sales
12. **Launch marketing readiness** — press kit, referral links, seed-content plan (empty city pages look dead)

Each finding: severity, impact, effort, my recommendation, and whether it blocks launch.

---

## Part 3 — Explicitly NOT in this pass (call these out separately)

- Real legal review by an attorney (you said you'll do post-launch — I flag this as **HIGH risk** but respect your call)
- Sentry/analytics vendor integration (need your account creds — I'll scaffold hooks; you connect)
- Payments (not needed for T-1)
- Mobile app (per MOBILE_STRATEGY.md, out of scope)

---

## Technical details

- Feature flag lives in `src/services/env.ts`; default `false` = hard gate
- State SVG data: single `src/data/us-states.ts` file with `{code, name, path}` per state
- New tables: `error_logs` (id, user_id nullable, route, message, stack, ua, created_at) — RLS: user reads own, admins read all
- New edge function: `log-error` (accepts POST, inserts row, no auth required)
- Sitemap function updated to respect the gate flag via URL param
- `AuthGate` uses existing `useAuth`/`ProtectedRoute` pattern — mostly a route-config change in `App.tsx`

## Order of operations
1. Auth gate + landing page rework
2. State tiles + perf fix (feels like the biggest visible win)
3. Error boundaries + logging
4. SEO/legal/a11y sweeps
5. Deliver `docs/LAUNCH_AUDIT.md`

Estimated ~4–6 file edits per section, one migration for `error_logs`, ~10 total file touches. Approve and I'll execute in order.
