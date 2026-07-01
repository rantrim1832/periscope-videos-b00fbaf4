# Pariscope Service Layer

The headless core shared by web, mobile, and ingestion. **Interface-driven and
mock-safe**: every external dependency has a provider abstraction that falls back
to a working mock when no secret is configured — so the whole system runs locally
and in CI with zero vendor accounts.

## Structure

```
src/services/
  env.ts                 universal env accessor (Node + Vite)
  normalize.ts           address/zip/phone/state normalization + identity + geo/fuzzy
  clients.ts             createAdminClient() (Node, service-role)
  providers/
    geocoding.ts         GeocodingProvider   → Mock | Mapbox
    moderation.ts        ModerationProvider   → Mock | Lovable (fail-closed)
    video.ts             VideoProvider        → Mock | Cloudflare Stream
    enrichment.ts        EnrichmentProvider   → Mock | RentCast
  repositories/
    propertyRepository.ts   canonical graph data access (domain-mapped)
    residentRepository.ts   resident graph data access
  propertyService.ts     search + property page composition
  index.ts               barrel
```

## Provider selection (env-driven, mock fallback)

| Provider   | Real impl selected when…                              | Otherwise |
|------------|-------------------------------------------------------|-----------|
| Geocoding  | `MAPBOX_TOKEN` / `VITE_MAPBOX_TOKEN` set              | Mock (deterministic US coords) |
| Moderation | `LOVABLE_API_KEY` set                                 | Mock (fail-closed heuristic) |
| Video      | `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_STREAM_TOKEN`   | Mock (fake upload/playback) |
| Enrichment | `RENTCAST_API_KEY` set                                | Mock (no-op, no fabricated data) |

Each provider exposes a `__setXProvider()` test seam for injecting fakes.

## Design principles

- **Dependency injection for DB access.** Repositories take a `SupabaseClient`
  so the browser (anon client) and Node ingestion (admin client) share the same
  code. The browser anon client is never imported here (it touches localStorage).
- **Domain-mapped boundary.** Rows map to `src/domain/types.ts`, keeping the app
  type-safe before the generated Supabase types are regenerated post-migration.
- **Fail-closed by contract.** The moderation abstraction never approves on
  uncertainty.

## Production setup

Set these as **server-side** secrets (Supabase Edge Function secrets or the
ingestion host env) — never in the client bundle:

```
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   # admin client (ingestion)
MAPBOX_TOKEN                              # geocoding
RENTCAST_API_KEY                          # enrichment
LOVABLE_API_KEY                           # moderation
CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_STREAM_TOKEN  # video
```

Until these are provisioned, the mock providers keep every flow functional.
