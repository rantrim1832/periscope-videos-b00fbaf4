# Inventory Ingestion Pipeline

Loads the property inventory into the canonical graph:
**sanitize → repair → geocode → entity-resolve → load**, with **quarantine**
for unrecoverable rows (never dropped).

## Run

Dry-run (offline — mock geocoder + in-memory sink, no DB or secrets):

```bash
npm run ingest -- --dry-run path/to/list1.csv path/to/list2.csv path/to/list3.csv
```

Live (writes to Supabase — requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`;
uses Mapbox when `MAPBOX_TOKEN` is set, else the mock geocoder):

```bash
npm run ingest -- --source csv_import path/to/list.csv
```

Flags: `--dry-run`, `--limit N`, `--source KEY`.

## Design

| Stage | Detail |
|---|---|
| Parse | RFC-4180 tokenizer (`csv.ts`): quoted commas, escaped quotes, CRLF, BOM. |
| Map | **Right-anchored** row mapping (`mapRow.ts`): trailing columns (Units…State) are positionally stable, so leading Name/Address comma-shifts don't corrupt identity fields. |
| Repair | ZIP zero-padding, state validation, phone → E.164. |
| Geocode | `GeocodingProvider` (mock or Mapbox). |
| Resolve | Exact `(zip5, normalized_address)` → merge; ≤25m + same address → auto-merge; ≤100m + name similarity ≥0.6 → **needs_review** queue; else create. |
| Load | canonical_property + property_alias + provenance property_fact; `property_source_record` for audit/quarantine. |

The sink is abstracted (`IngestSink`): `InMemorySink` (dry-run, spatial-grid
indexed) and `SupabaseSink` (production).

## Validated dry-run (all 3 files, ~75k rows)

```
Data rows:       75328
Created:         72921
Merged (exact):  2200
Needs review:    0        (mock geocoder has no real proximity; Mapbox surfaces these)
Quarantined:     207      { missing_zip: 115, missing_address: 90, invalid_state: 2 }
Aliases:         75121
Facts:           206859
Elapsed:         0.7s
```

Right-anchored parsing recovered nearly all comma-shifted rows (207 quarantined
vs a ~1,400 naive-parse estimate).

## Production notes

- Set `MAPBOX_TOKEN` for real geocoding (enables proximity merge/review).
- Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for live writes.
- Review the `property_source_record` queue (`match_status in ('needs_review','quarantined')`) to resolve ambiguous/broken rows.
- Re-runs are idempotent on exact keys; safe to re-ingest.
