/**
 * Inventory ingestion CLI.
 *
 * Dry-run (offline, no DB/secrets — uses mock geocoder + in-memory sink):
 *   npx tsx scripts/ingest.ts --dry-run path/to/list1.csv path/to/list2.csv
 *
 * Live (writes to Supabase — requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY;
 * uses Mapbox if MAPBOX_TOKEN is set, otherwise the mock geocoder):
 *   npx tsx scripts/ingest.ts --source csv_import path/to/list.csv
 *
 * Flags: --dry-run, --limit N, --source KEY
 */
import { readFileSync } from 'node:fs';
import { parseCsv } from '../src/ingestion/csv';
import { runIngestion } from '../src/ingestion/pipeline';
import { InMemorySink, type IngestSink } from '../src/ingestion/sink';
import { getGeocodingProvider } from '../src/services/providers/geocoding';

function parseArgs(argv: string[]) {
  const files: string[] = [];
  let dryRun = false;
  let limit = Infinity;
  let source = 'csv_import';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') dryRun = true;
    else if (a === '--limit') limit = parseInt(argv[++i], 10);
    else if (a === '--source') source = argv[++i];
    else files.push(a);
  }
  return { files, dryRun, limit, source };
}

async function main() {
  const { files, dryRun, limit, source } = parseArgs(process.argv.slice(2));
  if (files.length === 0) {
    console.error('Usage: tsx scripts/ingest.ts [--dry-run] [--limit N] [--source KEY] <file.csv...>');
    process.exit(1);
  }

  // Gather rows.
  let rows: string[][] = [];
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    const parsed = parseCsv(text);
    console.log(`Parsed ${parsed.length} rows from ${f}`);
    rows = rows.concat(parsed);
  }
  if (Number.isFinite(limit)) rows = rows.slice(0, limit + 1); // +1 for header

  // Choose sink.
  let sink: IngestSink;
  const inMemory = new InMemorySink();
  const hasCreds = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (dryRun || !hasCreds) {
    if (!dryRun) console.warn('No Supabase credentials found — running in-memory (dry-run).');
    sink = inMemory;
  } else {
    const { SupabaseSink } = await import('../src/ingestion/supabaseSink');
    const { createAdminClient } = await import('../src/services/clients');
    sink = new SupabaseSink(createAdminClient());
  }

  const geocoder = getGeocodingProvider();
  console.log(`Geocoder: ${geocoder.name} | Sink: ${sink === inMemory ? 'in-memory' : 'supabase'}\n`);

  const start = Date.now();
  const stats = await runIngestion(rows, {
    sourceKey: source,
    geocoder,
    sink,
    onProgress: (done, total) => {
      if (done % 5000 === 0) console.log(`  ...${done}/${total}`);
    },
  });
  const secs = ((Date.now() - start) / 1000).toFixed(1);

  console.log('\n===== INGESTION REPORT =====');
  console.log(`Source:          ${source}`);
  console.log(`Data rows:       ${stats.totalRows}`);
  console.log(`Created:         ${stats.created}`);
  console.log(`Merged (exact):  ${stats.mergedExact}`);
  console.log(`Merged (nearby): ${stats.mergedNearby}`);
  console.log(`Needs review:    ${stats.needsReview}`);
  console.log(`Quarantined:     ${stats.quarantined}`);
  console.log('Quarantine reasons:', stats.quarantineReasons);
  if (sink === inMemory) {
    console.log(`Canonical props: ${inMemory.canonicalCount}`);
    console.log(`Aliases:         ${inMemory.aliases}`);
    console.log(`Facts:           ${inMemory.facts}`);
  }
  console.log(`Elapsed:         ${secs}s`);
  console.log('============================');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
