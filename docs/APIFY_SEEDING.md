# Apify visual/source seeding

Goal: make property pages feel alive with **real official/public sources** before
resident density exists. This does not create fake residents, fake likes, or fake
reviews.

## Recommended first scrape

Use an Apify Google Maps / Places actor with website + social-link enrichment.
Target query batches such as:

- `apartments in Dallas TX`
- `luxury apartments in Dallas TX`
- `apartments in Austin TX`
- `student apartments in Tempe AZ`

Prefer actor settings that return:

- property/business name
- full address, city, state
- website
- social links (Instagram, Facebook, TikTok, YouTube)
- image/gallery URLs where available
- virtual tour / Matterport links where available

## Import options

### 1. Dry-run from an Apify dataset

```bash
APIFY_TOKEN=... npm run import:apify -- --dataset <datasetId> --limit 100 --dry-run
```

### 2. Dry-run from a JSON export

```bash
npm run import:apify -- --file ./apify-output.json --dry-run
```

### 3. Live import

Requires production server credentials:

```bash
APIFY_TOKEN=... \
SUPABASE_URL=https://haciywkzvtgxemncenip.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run import:apify -- --dataset <datasetId> --limit 500
```

The importer:

- matches Apify rows to `canonical_property` by address/city/state first, then
  name/city/state
- writes unique URLs into `property_channel`
- labels source as `seed`
- marks `is_verified=false` (Official · Public, not Official · Verified)
- does **not** rehost media
- does **not** create resident truth or affect Truth Score

## Why dataset import instead of one hardcoded actor

Apify actors differ in input/output shape. The importer accepts common field
names (`website`, `instagram`, `socialLinks`, `images`, `matterport`, etc.) so
we can use whichever actor produces the best data/cost ratio.

## Next product step

Once seeded pages have official/public channels, email property staff:

> Your public Periscope property page is live. Claim it to verify official
> content, connect your videos/socials, invite residents, and improve your page
> completeness.
