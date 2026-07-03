/**
 * Go-live readiness check. Reports which env vars / secrets are set and which
 * features they unlock. Non-destructive.
 *   npx tsx scripts/setup-check.ts
 */
const CHECKS: { key: string; fallback?: string; enables: string; required: boolean }[] = [
  { key: 'VITE_EXTERNAL_SUPABASE_URL', fallback: 'VITE_SUPABASE_URL', enables: 'App → Supabase connection', required: true },
  { key: 'VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY', fallback: 'VITE_SUPABASE_PUBLISHABLE_KEY', enables: 'App → Supabase (anon)', required: true },
  { key: 'VITE_EXTERNAL_SUPABASE_PROJECT_ID', fallback: 'VITE_SUPABASE_PROJECT_ID', enables: 'App → Supabase project id', required: true },
  { key: 'SUPABASE_URL', enables: 'Server/ingestion → Supabase', required: true },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', enables: 'Ingestion, edge functions (admin)', required: true },
  { key: 'VITE_USE_CANONICAL', enables: 'Frontend reads canonical graph (set "true" for live data)', required: false },
  { key: 'MAPBOX_TOKEN', enables: 'Real geocoding (else mock)', required: false },
  { key: 'RENTCAST_API_KEY', enables: 'Property enrichment (else mock)', required: false },
  { key: 'LOVABLE_API_KEY', enables: 'AI moderation (else fail-closed heuristic)', required: false },
  { key: 'WEBHOOK_SECRET', enables: 'seed-review / taggbox webhooks', required: false },
  { key: 'APIFY_TOKEN', enables: 'Apify visual/source seeding', required: false },
  { key: 'CLOUDFLARE_ACCOUNT_ID', enables: 'Cloudflare Stream video upload', required: false },
  { key: 'CLOUDFLARE_STREAM_TOKEN', enables: 'Cloudflare Stream video upload', required: false },
  { key: 'SEARCH_API_KEY', enables: 'Live official-channel discovery (else mock)', required: false },
];

const has = (k: string) => !!process.env[k] && process.env[k] !== '';

console.log('\nPariscope — go-live readiness\n' + '='.repeat(40));
let missingRequired = 0;
for (const c of CHECKS) {
  const ok = has(c.key) || (c.fallback ? has(c.fallback) : false);
  if (!ok && c.required) missingRequired++;
  const mark = ok ? '✓' : c.required ? '✗' : '○';
  const label = c.fallback ? `${c.key} / ${c.fallback}` : c.key;
  console.log(`  ${mark} ${label.padEnd(62)} ${ok ? 'set' : c.required ? 'MISSING (required)' : 'not set → mock/fallback'}`);
  if (!ok) console.log(`      ↳ ${c.enables}`);
}
console.log('='.repeat(40));
console.log(missingRequired === 0
  ? 'Core config present. Remaining unset keys just fall back to mock providers.'
  : `${missingRequired} required var(s) missing — the app will run in demo/mock mode only.`);
console.log('\nNext: apply migrations, regenerate types, deploy edge functions, then `npm run ingest` + `npm run seed:channels`. See docs/GO_LIVE.md.\n');
