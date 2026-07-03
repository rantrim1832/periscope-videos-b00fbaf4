# Pariscope Product Specification (living)

Current best understanding of the product. Evolves via the Decision Log.

## Mission
See what's really happening before you sign. Pariscope is the **trust layer for
residential housing** — a two-sided (property ↔ resident), provenance-first graph
with a multi-modal evidence layer, made credible by trust and distributed by
culture.

## Three product modes
1. **Leasing decision** (low-frequency, high-intent) — the property page.
2. **Discovery** (search, browse, rankings).
3. **Entertainment** (feed, shorts, creators) — the high-frequency habit that funds the graph.

## Core objects
- **Canonical property** (geocoded-address identity; aliases; provenance facts).
- **Truth Score** — trust-weighted, recency-decayed, confidence-gated 0–100 verdict + 11 categories.
- **Property story** — content-slot completeness ("help complete the story").
- **Resident** — first-class, pseudonymous, Type-A reputation; residency claims; expertise.
- **Official content** — Official·Public (pre-claim) vs Official·Verified (post-claim), from connected channels.
- **Timeline** — longitudinal events (score changes auto-logged).

## Content model (layered; perceived density first)
L1 basics/map/metadata · L2 public social embeds · L3 official content · L4
resident truth · L5 creator/investigator. Density Score + Story Completeness make
gaps an invitation, never an abandoned page.

## Trust
Tiers: Unverified → Likely Resident → Verified Resident (T2/T3 = GPS dwell +
document; **deferred behind content density**). Official is separate from resident
truth and never implies endorsement. Managers respond, never delete (DB-enforced).

## Property page (adaptive — see Decision Log)
- **When Truth Score has confidence:** verdict-first (score hero → evidence → reviews).
- **When confidence-gated (launch default):** **story-first** — lead with story
  completeness + official/public content + "be the first," with the score shown as
  "gathering data." Rationale: at nationwide launch ~all pages are score-empty;
  a giant empty gauge under-delivers, while story/evidence feels intentional.

## Contribution
Import a post (embed) **or** create (record/upload/photo/write). Server-side
fail-closed moderation → published/pending/rejected → share loop + notifications.

## Growth & retention
SEO property pages · entertainment feed · creator/investigator program · content
suggestions · contributor feedback (views, replies, follows, published) · comparison.

## Product backlog / next UX pass
- **Identity-based onboarding redirect.** Property staff/PM flow should not dump
  users into generic apartment search. After selecting "I manage a property,"
  route to: find my property → add it if missing → create staff profile → claim/
  connect official sources → then explore the site. Renter/resident/creator flows
  should lead with interesting local video/feed discovery (location-aware where
  permitted), with "find current/past property" as a secondary but obvious action.

## Business model
Renters never pay for truth. Monetize PMs (claim free → analytics/lead-gen) + data
licensing (private org graph). Connected-source claim is the freemium wedge.

## Architecture
Headless service layer + provider abstractions (mock-safe); Supabase (Postgres +
RLS + edge functions); canonical graph + aggregates; video via Cloudflare Stream
(recommended); app-first trinity (mobile app + web graph + Truth API).

## Non-negotiables
Security before public exposure · provenance-first · renters never paywalled ·
managers can't suppress truth · fail-closed moderation · honest confidence (never
fabricate scores) · demo data clearly labeled.
