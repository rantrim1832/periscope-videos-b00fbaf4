# Periscope Pre-Launch Audit — 2026-07-09

Scope: T-1 launch review across product, security, legal, performance, SEO, ops. Severity: **P0** = launch blocker, **P1** = fix week 1, **P2** = fix in first month.

## What just shipped in this pass (P0 fixes, done)

- **Hard auth gate** — all routes except `/`, `/auth`, `/welcome`, `/terms`, `/privacy`, `/dmca`, `/contact`, `/help`, `/report` now require login. Unauthenticated users hitting a gated route land on `/auth?returnTo=<path>` and bounce back after signin.
- **Marketing landing page at `/`** — new `src/pages/Landing.tsx` replaces the "empty logged-out dashboard" experience. Value prop + primary signup CTA + manager CTA + footer with legal links.
- **`/browse` states page** — sessionStorage caching (1hr TTL, instant paint on return), skeleton loaders on first paint, and illustrated bento grid of state silhouette tiles (baked from `@svg-maps/usa` into `src/data/usStates.json` — no runtime map dep).
- **robots.txt** — every gated route explicitly `Disallow`ed so Google doesn't index the login wall. Only public marketing pages crawlable.
- **Legal pages** — removed the "launch draft, not legal advice" disclaimer; added last-updated date and `legal@joinperiscope.com` contact.
- **Error boundary** — now uses `min-h-dvh` (mobile viewport correctness), shows the error message, adds a "Report this" button linking to `/contact`, and exposes a `window.__periscope_error_sink` hook for the eventual Sentry wire-up.

---

## ⚠️ Critical decisions to revisit

### 1. Hard gate contradicts product spec (P0 to reconsider)
`docs/PRODUCT_SPEC.md` says "renters never paywalled." Hard-gating means:
- **Zero organic SEO** — `/property/*` and `/city/*` are the entire SEO strategy per `sitemap` edge function; Google can't index them behind a login. Sitemap.xml now points at auth-walled URLs, which triggers **soft-404 penalties**. Recommend removing dynamic entries from the sitemap edge function until you soft-gate (currently deployed sitemap fn still enumerates property IDs — you or Cursor needs to update it).
- **Zero social virality** — every shared link previews as a login page.
- **Competitor parity broken** — Yelp, Zillow, Glassdoor, ApartmentRatings all soft-gate.

**Recommendation:** switch to soft-gate before or shortly after launch. Show property name + score + 2 review teaser + photo publicly; gate full reviews, videos, resident profiles, contribution. That's the winning pattern.

### 2. Real legal review not done (P0 risk you accepted)
Terms/Privacy/DMCA are still Lovable-drafted policy text. Recommend getting a real attorney review within 2 weeks of launch. Specific risks:
- **CCPA/GDPR** — no explicit data-subject-rights section, no "Do Not Sell" toggle, no cookie consent banner. California + EU visitors can file complaints.
- **FCRA/tenant screening disclaimer** — currently one line in ToS. Should be **prominent** on every property page footer to defend against class action.
- **Section 230 safe harbor** — moderation language is fine but the DMCA counter-notice process is under-specified.

### 3. Sitemap function is out of sync (P0)
`supabase/functions/sitemap/index.ts` enumerates 45k property IDs into sitemap.xml. With hard gate on, this hands Google a giant list of 302-redirects. Either:
- Redeploy that edge function to only emit the 9 public routes, OR
- Flip to soft-gate so those URLs are actually indexable.

---

## Full audit by dimension

### Product / UX (P0–P1)
- **P0** New-user signup flow: no email verification loop tested end-to-end. Test with a real inbox before launch.
- **P0** `/welcome` onboarding: verify it works for a signed-in user with zero prior state.
- **P1** Empty city pages look dead. Add "Be the first to review" CTA + surrounding-cities recommender.
- **P1** Mobile touch targets: audit for <44×44 CSS px on Header, PropertyCard actions, PromptTileRail.
- **P1** Form validation feedback inconsistent (some fields toast, some inline). Standardize.
- **P2** No skeleton loaders on Property page — reads as broken on slow networks.

### Auth & security (P0–P1)
- **P0** Enable **HIBP leaked-password check** in Supabase Auth settings (Lovable Cloud → Users → Auth Settings → Password HIBP Check). Currently off = signup accepts `password123`.
- **P0** Password minLength is **6** in `Auth.tsx`. Raise to 8 minimum, ideally 10.
- **P0** No rate limiting on `/auth` — enable Supabase's built-in attempt limit or add captcha (Supabase supports hCaptcha).
- **P0** No Google/Apple social sign-in — spec calls for Google by default; add before launch to reduce signup friction dramatically (~40% conversion lift industry std).
- **P1** No "delete my account" flow (CCPA/GDPR right-to-erasure). Wire a Profile page button that calls an edge function which soft-deletes the user's PII.
- **P1** No session-expiry warning on long-idle sessions.
- **P1** Admin routes protected client-side only via `AdminRoute` component. Confirm every admin table has RLS server-side guarding on `has_role(auth.uid(), 'admin')`. (I did not verify each table this pass — Cursor owns the schema.)
- **P2** No 2FA option for admin accounts.

### Data integrity (P1)
- Property dedup: address normalization runs in `src/services/normalize.ts` but no automated periodic dedup job. Duplicate property listings will erode Truth Score credibility.
- Review moderation queue has no SLA target or admin dashboard alerting.
- Orphaned records: reviews pointing to deleted properties, channels pointing to inactive properties — audit needed.

### Performance (P1)
- **P1** Home Index.tsx is **613 lines** and imports ~40 icons + does two large queries (`feed()` + `listSummaries()`) on every mount. Split into route-level chunks; some rails should lazy-render on scroll.
- **P1** Bundle audit needed: `bun run build` and check `dist/` sizes. Suspect >800KB gzipped on first load.
- **P1** Property page images: audit for `loading="lazy"` and correct `width/height` (CLS).
- **P1** OG image edge function is called synchronously per property meta — cache aggressively at edge.
- **P2** No LCP preload for hero images on Landing or Property pages.

### SEO (P0 given current gate posture)
- **P0** With hard gate, only Landing + Legal + Contact are indexable. The homepage title/description are good but need:
  - JSON-LD `Organization` + `WebSite` schema on landing
  - Real og:image (currently pointing at a preview screenshot that will 404 or 302 in prod)
- **P1** No robots.txt reference to sitemap absolute URL (currently `/sitemap.xml` relative works but absolute is safer).
- **P1** Once you soft-gate: add `<link rel="canonical">` per property page, breadcrumb JSON-LD, `LocalBusiness` schema per property.

### Legal / compliance (P0)
- **P0** No cookie-consent banner. California requires "Do Not Sell/Share" link; EU visitors need consent banner if you use any analytics beyond first-party.
- **P0** Signup form does **not** show "By continuing you agree to Terms + Privacy" — add checkbox or inline copy. Landing page has it; Auth page does not.
- **P0** Tenant-screening disclaimer needs to appear on every property page footer, not only in ToS.
- **P1** No "delete my account" endpoint (see Auth section).
- **P1** No data export (GDPR portability) endpoint.
- **P2** No age gate (under-13 COPPA — probably fine, apartments aren't marketed to minors, but add a "must be 18+" line to ToS).

### Content moderation (P1)
- `/report` flow exists; verify it routes to admin queue AND fires a Slack/email alert to on-call admin (currently unclear).
- No published moderation SLA. Commit to something (e.g., "reviewed within 24h").
- No ban / appeal flow. First harassment case will force this to be built under pressure.
- Property managers can currently only respond, not flag. Add "Manager flag" that goes to moderation.

### Analytics (P1)
- **P1** No analytics instrumented at all (no PostHog, GA4, Mixpanel, Plausible). You will launch **blind** — no funnel data, no drop-off insights, no cohort retention. Ship at least PostHog or Plausible before launch. Free tier is fine at low volume.
- Key events to instrument: `signup_started`, `signup_completed`, `verification_email_sent`, `first_property_view`, `contribution_started`, `contribution_completed`, `share_clicked`, `claim_initiated`.

### Monitoring / ops (P0–P1)
- **P0** No client-side error tracking (Sentry, etc.). The ErrorBoundary hook `window.__periscope_error_sink` is ready for wire-up — you need a Sentry account.
- **P0** No uptime monitoring (BetterUptime, UptimeRobot, Pingdom). Sign up + configure a monitor for `/` and one gated route.
- **P1** No edge function alerting on failure rates.
- **P1** No DB slow-query alerts. Cursor owns schema; ask them about pg_stat_statements.
- **P2** No status page.

### Email deliverability (P0)
- **P0** Verify SPF, DKIM, DMARC on `joinperiscope.com` are correct in DNS. Without DMARC pass, welcome emails will land in spam.
- **P0** Test welcome / verification / password-reset emails against Gmail, Outlook, Yahoo — confirm inbox delivery.
- **P1** Unsubscribe link on transactional emails (CAN-SPAM).
- **P1** Warm up sending IP if using Resend — first 100 emails go to spam on cold IPs.

### Payments / business (P2)
- Not launching payments — fine. But claim-flow → PM sales funnel needs a pricing page + Stripe scaffold within 30 days.

### Launch marketing readiness (P1)
- No press kit / brand assets page (`/press` or `/media`).
- No referral / invite link mechanism to seed early growth.
- Empty city pages will look dead — seed at least 5–10 reviews per launch city before public announcement.
- No sharing UTM template — every "share" link should carry `utm_source=share` at minimum.

### Accessibility (P1)
- Ran a mental sweep; needs manual audit with axe. Known issues:
  - Some icon-only buttons in `Header.tsx` missing `aria-label`.
  - `h-screen` used in a few pages instead of `h-dvh` (mobile safari address-bar jump).
  - Focus-visible rings inherited from shadcn — verify not stripped by custom variants.
  - Alt text on all `<img>` needs a pass — several PropertyCard and hero images use empty `alt`.

---

## Recommended launch-day cutlist

**Must fix before flip:**
1. HIBP + raise password minLength to 8
2. Add Google sign-in
3. Terms checkbox on signup
4. Cookie banner (single-consent)
5. Sentry + BetterUptime accounts wired
6. PostHog or Plausible analytics
7. Sitemap edge function updated for hard gate
8. Real email deliverability test (SPF/DKIM/DMARC)
9. Tenant-screening disclaimer on property page footer
10. Seed 5–10 reviews per launch city

**Ship in week 1:**
- Delete-my-account flow
- Real attorney legal review
- Empty-state polish on city pages
- Mobile a11y pass

**Ship in month 1:**
- Soft-gate migration (highly recommended)
- Pricing page + Stripe scaffold
- Moderation SLA + admin alerts
- 2FA for admin
- Status page + published SLA

---

## Notes on process

Because Cursor owns the production schema (per `mem://constraints/external-supabase`), no database migrations were created in this pass. Items requiring schema changes (error_logs table, delete-account edge function, moderation alerts table) are flagged for you or Cursor to implement on the external Supabase project directly.