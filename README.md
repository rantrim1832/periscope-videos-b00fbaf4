# Pariscope — the trust layer for renting

**See what's really happening before you sign.** Pariscope is a two-sided
(property ↔ resident), provenance-first graph with a multi-modal evidence layer
(ratings, text, photo, video), a trust system that makes the evidence believable,
and a social/entertainment engine that makes contributing irresistible.

> Not a review website — a **collaborative truth network about physical places**.

## Three modes, one graph
- **Leasing decision** — the property page: **Truth Score** + Report Card, video
  evidence, reviews by life stage, timeline, official content, story completeness.
- **Discovery** — search, browse, city hubs, and **rankings** (best/worst by category).
- **Entertainment** — an immersive **feed** of apartment reality, creators, and hooks.

## Tech
Vite · React 18 · TypeScript · Tailwind · shadcn/ui · React Router · TanStack Query ·
Supabase (Postgres + RLS + Edge Functions). Interface-driven providers make every
external dependency **mock-safe** — the whole app runs with zero secrets.

## Getting started
```bash
npm i
npm run dev        # runs on mock providers (no secrets needed)
```

### Scripts
| Command | What it does |
|---|---|
| `npm run dev` / `build` / `preview` | Vite dev / production build / preview |
| `npm test` | Vitest suite (Truth Score, normalization, ingestion) |
| `npm run setup:check` | Report which env vars/secrets are set |
| `npm run ingest -- --dry-run <csv...>` | Inventory ingestion (offline dry-run) |
| `npm run seed:channels -- --dry-run` | Official-channel discovery/seeding |

## Architecture
- `src/domain/` — pure logic: **Truth Score** (trust-weighted, recency-decayed,
  confidence-gated), story completeness, density, view models.
- `src/services/` — headless layer: provider abstractions (geocoding, video,
  moderation, enrichment, channel discovery, social sources) with mock + real
  impls; repositories; normalization/identity.
- `src/data/` — `PropertyDataProvider` (mock fixtures ↔ canonical graph via
  `VITE_USE_CANONICAL`).
- `src/ingestion/` + `scripts/` — CSV → canonical graph pipeline (sanitize →
  geocode → entity-resolve → quarantine → load).
- `supabase/migrations/` — canonical graph, reviews, Truth Score aggregate +
  recompute triggers, claims/verification, rewards, Q&A, connected sources, RLS.
- `supabase/functions/` — submit-review, recompute-truth-score, verify-residency,
  og-image, sitemap, moderation, enrichment, scraping, webhooks.

## Docs
- `docs/PRODUCT_SPEC.md` — living product spec.
- `docs/DECISION_LOG.md` — major decisions & strategic pivots.
- `docs/DATA_MODEL.md` · `docs/SERVICE_LAYER.md` · `docs/INGESTION.md` ·
  `docs/CONNECTED_SOURCES.md`.
- `docs/DEMO_READINESS.md` — demo build status.
- `docs/GO_LIVE.md` — activation checklist (migrations, secrets, edge functions,
  `VITE_USE_CANONICAL=true`, inventory load).

## Demo vs. live
By default the app runs in **demo mode** (labeled sample data, mock providers).
Set `VITE_USE_CANONICAL=true` + apply migrations + deploy edge functions + set
secrets to run on real data. See `docs/GO_LIVE.md`.

## Security & trust (non-negotiables)
Security before public exposure · provenance-first · renters never paywalled ·
managers can respond but **never** delete/suppress resident truth (RLS-enforced) ·
fail-closed moderation · honest confidence (never fabricate scores).
