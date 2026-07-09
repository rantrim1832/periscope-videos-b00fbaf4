# Stock state photos, top cities, smart search

## 1. State tiles → stock photos

Replace the SVG silhouettes in `src/components/StateTile.tsx` with themed stock photos (Unsplash CDN).

- New `src/data/stateArt.ts` maps each of the 50 states + DC to a **theme** (beach, mountains, desert, city, forest, farm, tropical, bayou, snow, plains) and each theme resolves to a known-stable Unsplash photo ID. ~10 reusable regional photos, ~5–7 states per theme (California→beach, Colorado→mountains, Arizona→desert, Illinois→city skyline, Oregon→forest, Iowa→farm, Florida→tropical, Louisiana→bayou, Alaska→snow, etc.).
- `StateTile` renders `<img src=... loading="lazy">` filling the tile, with a dark gradient wash so the white state code + name + count stay readable. Removes the SVG path rendering path entirely; keeps the size/highlight props.
- Silhouette JSON (`src/data/usStates.json`) is no longer referenced by the tile — leaves it in place (harmless) so we don't churn other files.

## 2. Top cities section on Browse

Add a **"Top cities"** section above the state grid on `/browse`.

- New `src/data/topCities.ts` — curated list of 50 major US metros (New York, Los Angeles, Chicago, Houston, Phoenix, Philadelphia, San Antonio, San Diego, Dallas, Austin, Jacksonville, Fort Worth, Columbus, Charlotte, Indianapolis, San Francisco, Seattle, Denver, Boston, Nashville, Portland, Las Vegas, Atlanta, Miami, Minneapolis, D.C., Detroit, Baltimore, Milwaukee, Sacramento, Kansas City, Raleigh, Tampa, Orlando, Cleveland, Pittsburgh, Cincinnati, St. Louis, Louisville, New Orleans, Salt Lake City, Providence, Richmond, Buffalo, Hartford, Oklahoma City, Memphis, Albuquerque, Tucson, Omaha). Each has `{ city, state, image }` using themed Unsplash photos from the same pool.
- Rendered as a horizontal poster rail using the existing `PromptTileRail` styling patterns (or a simple `overflow-x-auto` grid) with photo covers. Each tile links to `/city/:state/:city`.
- Count badges are optional and omitted for now (adding a per-city count query would require a new provider method + N queries).

## 3. Smart search with autofill + cascading filters

Upgrade `src/pages/Search.tsx` in place; the Header search icon continues to route here.

- **Cascading filters row** above the search input: `State` select (populated from `provider.listStates()`) → when a state is chosen, `City` select (populated from `provider.listCities(state)`). Selecting either narrows the query.
- **Autofill dropdown** anchored to the text input, opens as user types (≥2 chars), debounced 150ms. Shows up to 12 grouped suggestions:
  - **Properties** — matched by name / address (from `provider.search(q)` filtered by state/city if set).
  - **Cities** — matched from the top-cities list + provider's cities.
  - **States** — matched from the state list.
- Clicking a property row → `/property/:id`. Clicking a city → `/city/:state/:city`. Clicking a state → sets the state filter. Pressing Enter runs the current text search (existing behavior) scoped by the filters.
- Uses shadcn `Command` (already installed via cmdk) for the popover list — keyboard nav free.

Header stays as-is: its search icon still opens `/search`, which now has the full smart experience. No new global command palette in this pass.

## Files touched

```text
src/components/StateTile.tsx         # img-based tile
src/data/stateArt.ts                 # NEW: state → theme → photo
src/data/topCities.ts                # NEW: 50 curated cities
src/pages/Browse.tsx                 # Top cities rail above state grid
src/pages/Search.tsx                 # Filters + autofill popover
```

## Explicitly out of scope

- No new provider methods (no per-city counts, no server-side FTS).
- No global cmd-k palette in the Header — only the Search page is upgraded.
- No changes to auth/routes/schema.
- Old `usStates.json` silhouette data left in place, unused.

## Risk / assumptions

- Unsplash photo IDs are hand-picked from well-known stable photos; if any 404, swapping an ID is a one-line fix.
- Top-50 city list is editorial — you can trim/reorder later without code changes.
- Autofill queries reuse existing `provider.search()` — response time depends on the current data source.
