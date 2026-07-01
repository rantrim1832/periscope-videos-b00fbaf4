# Pariscope Decision Log

The living record of major decisions and strategic evolutions. Documentation is
the current best understanding — not immutable. Each entry: the decision, why the
prior assumption was weaker, tradeoffs, and status.

Format: `[YYYY-MM-DD] TITLE — Decision · Why prior was weaker · Tradeoffs · Status`

---

## Identity & strategy

- **[2026-06-30] The product is truth, not video.** Video is the highest form of
  evidence; the moat is the canonical property graph + trust layer. *Prior:*
  "video review site" — a content treadmill with weak defensibility. *Tradeoff:*
  less "viral video app" positioning up front. *Status:* Adopted.

- **[2026-06-30] Five-layer stack → trust layer.** History → Truth →
  Accountability → Intelligence → OS; the largest defensible company is the
  **trust layer for residential housing** (two-sided, culture-distributed,
  agent-consumed). *Prior:* "review site" undersized the opportunity. *Status:* Adopted.

- **[2026-06-30] Accountability is emergent, never Pariscope's voice.** Residents/
  journalists/regulators act; Pariscope is neutral §230 infrastructure. *Prior:*
  an "accountability network" that speaks in first person loses §230 + invites
  defamation. *Tradeoff:* slower, less punchy. *Status:* Adopted (legal firewall).

- **[2026-06-30] Provenance-first data model.** Every fact carries source/
  confidence/timestamp. *Prior:* bare columns can't safely merge sources or feed
  AI agents. *Tradeoff:* more schema complexity. *Status:* Adopted — the AI-era moat.

- **[2026-06-30] Resident is a first-class entity (two-sided graph).** PROPERTY ↔
  RESIDENT. *Prior:* one-sided review site → weaker network effects. *Status:* Adopted.

- **[2026-06-30] Trust portability = L6 (LinkedIn × Airbnb − FICO).** Resident-
  owned, consent-based, non-FCRA. *Prior:* credit-bureau model is used *against*
  users. *Status:* Adopted; Type-A reputation only (no tenant screening).

## Sequencing & growth

- **[2026-07-01] Security before everything (Phase 0).** *Prior:* deferring auth
  ("we'll add auth later") produced stacking critical vulns. *Status:* Adopted (PR #1).

- **[2026-07-01] Content density before verification density.** *Prior:* verifying
  a near-empty content set optimizes nothing. *Tradeoff:* lower average trust
  early. *Status:* Adopted — verification (T2/T3) deferred.

- **[2026-07-01] Import existing content + embed (no re-host).** *Prior:* assuming
  users post fresh content ignores the content already created daily. *Status:* Adopted.

- **[2026-07-01] Apartment staff as a creator class.** Communities help complete
  the story; never control truth (DB-enforced). *Prior:* treating PMs only as
  reviewees ignores the densest legal content source. *Status:* Adopted.

- **[2026-07-01] Entertainment feed is co-equal, not a channel.** *Prior:* a
  low-frequency utility has terrible retention/CAC. *Tradeoff:* must govern
  entertainment by truth. *Status:* Adopted.

- **[2026-07-01] Nationwide launch; "no page feels abandoned" > complete truth.**
  Perceived density (map + official + public) before perfect density. *Prior:*
  city-by-city + completeness gating is too slow. *Status:* Adopted.

- **[2026-07-01] Official content + Resident truth, always separated & labeled.**
  Official·Public (pre-claim) vs Official·Verified (post-claim). *Status:* Adopted.

- **[2026-07-01] Connected sources auto-sync for verified managers.** *Prior:*
  manual reposting won't scale PM content. *Status:* Adopted (mock-safe; OAuth later).

## Engineering

- **[2026-07-01] Fail-closed moderation.** *Prior:* fail-open auto-approved toxic
  content on error. *Status:* Adopted.
- **[2026-07-01] Server-side moderation for submissions.** *Prior:* clients can't
  be trusted to self-declare "approved." *Status:* Adopted.
- **[2026-07-01] Interface-driven providers with mock fallback.** No vendor key
  blocks development. *Status:* Adopted (geocode/video/moderation/enrichment/
  discovery/social-source).
- **[2026-07-01] Single algorithm home for Truth Score (SQL + trigger; TS mirror).**
  *Status:* Adopted; auto-recompute on review change.

## Open / proposed

- **[2026-07-01] PROPOSED: Adaptive property hero (story-first when confidence-
  gated).** See PRODUCT_SPEC. *Status:* Adopted under delegated authority (this PR).

- **[2026-07-01] Homepage is the product, not a brochure.** The landing now leads
  with real search, a live feed preview, and real Truth Scores (worst-first — the
  "gap" hook), plus an action triad. *Prior:* a static marketing page hid the best
  features behind nav; a user wouldn't discover the magic in 60s. *Tradeoff:*
  less classic-marketing framing. *Status:* Adopted.

- **[2026-07-01] Onboarding identity selection (/welcome).** New users choose
  renter/resident/manager/creator and are routed to the right first experience
  (intent stored on resident_profile). *Prior:* bare signup dumped everyone on the
  homepage with no path to value. *Status:* Adopted.

- **[2026-07-01] Homepage answers "what's most interesting right now" in <10s.**
  Content-hook-first wall (real clips + Truth Score reveals + "management changed →
  score dropped" drama + category chips); slim search; no manifesto. *Prior:* even
  the "living homepage" led with an explanatory hero — optimizing for explanation,
  not curiosity/outrage/surprise. Many visitors aren't shopping; hooks pull them in.
  *Tradeoff:* less first-time "what is this" framing (mitigated by content legibility
  + onboarding). *Status:* Adopted — discover by using, not reading.

- **[2026-07-01] Contributor rewards + real profile.** Points/levels/badges
  (Type-A recognition only, awarded server-side on review publish) + a real
  self-profile (level, points, badges, contributions, followers). *Prior:* the
  profile was hardcoded mock; contribution had no status/recognition payoff.
  *Status:* Adopted.

- **[2026-07-01] T2/T3 resident verification (server-side).** GPS-in-range →
  Likely Resident (instant); lease/utility document → Verified Resident (admin-
  approved). Trust-tier changes are server-side only (edge fn/admin), never
  client-declared; verification proves residency, not identity. *Prior:*
  verification was deferred behind content density (correct then); now content/
  creator/retention loops exist, so trust-weighting is meaningful. *Status:* Adopted.

## Escalation items (need founder / external decision)
- Paid **search/Places vendor** for nationwide channel discovery at scale.
- Social-platform **OAuth app approvals** (Meta/TikTok/YouTube) for real auto-sync.
- **Phase 0 security** must merge into the product lineage before public launch.
