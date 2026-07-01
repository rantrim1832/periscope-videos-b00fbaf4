# Pariscope Canonical Data Model

The foundation of the trust layer: a **two-sided, provenance-first** graph.

```
PROPERTY  ◄──── TRUST (verification, reputation) ────►  RESIDENT
   │                                                        │
   ├─ canonical_property   (resolved current values)        ├─ resident_profile   (public reputation)
   ├─ property_alias       (every source string → canonical)├─ residency_claim    (private tenancy edge)
   ├─ property_fact        (provenance: value/source/conf/ts)└─ resident_expertise (portable Type-A rep)
   ├─ property_source_record (raw staging / quarantine)
   └─ data_source          (trust-tier registry)
```

## Core principles

1. **Identity = geocoded normalized address, never name.** The inventory has
   thousands of name collisions ("Willow Creek" ×13). The canonical key is
   `(zip5, normalized_address)`.
2. **Aliases resolve everything.** `property_alias` maps every source string and
   user query variant to the canonical entity — the defense against
   "property not found".
3. **Provenance on every fact.** `property_fact` stores `(attribute, value,
   source_key, confidence, observed_at)`. `canonical_property` columns hold the
   current best-resolved value; facts hold the sourced history. Conflicts resolve
   by `data_source.trust_tier` (verified claim > enrichment > import > user).
4. **Never drop bad data.** Malformed / low-confidence rows land in
   `property_source_record` with `match_status = 'quarantined'` for repair.
5. **Two-sided.** Residents are first-class (`resident_profile`) with portable,
   **Type-A** reputation (contributor/expertise) — never tenant-screening data.
6. **Public/Private split enforced in RLS.**
   - Public: active canonical properties, aliases, public facts, resident
     reputation, expertise.
   - Private: provenance internals, raw source records, residency claims
     (reveal where someone lives), management/ownership (kept in legacy
     `imported_properties`, admin-only).

## Property classes

`classifyByUnits()` buckets the full spectrum found in the inventory:
`single_family` (≤4) · `small_multifamily` (5–49) · `midsize` (50–199) ·
`large_community` (200+). The legacy `minUnits=50` scraper assumption is retired.

## Production setup notes

- After applying migrations, regenerate Supabase types:
  `supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts`.
  Application code depends on `src/domain/types.ts` (decoupled), so the app keeps
  compiling in the interim.
- The first admin must be seeded via the Supabase SQL editor (self-admin was
  removed in Phase 0).
- `pg_trgm` is enabled for fuzzy name/alias matching used by entity resolution.
