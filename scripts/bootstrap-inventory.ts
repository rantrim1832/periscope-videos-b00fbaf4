/**
 * Fast canonical inventory bootstrap.
 *
 * Purpose: quickly get a broad national property graph into canonical_property
 * so search, claim, Apify channel imports, and PM outreach can function.
 *
 * This complements the provenance-heavy ingestion pipeline. It batches core
 * identity fields and aliases; later enrichment can add facts/channels.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { parseCsv } from '../src/ingestion/csv';
import { mapRow, isHeaderRow, type RawProperty } from '../src/ingestion/mapRow';
import { normalizeAddressLine1, normalizePhoneE164, normalizeState, normalizeZip5 } from '../src/services/normalize';

type Row = RawProperty & {
  source: string;
  propertyUrl?: string | null;
  yearBuilt?: number | null;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const files: string[] = [];
  let dryRun = false;
  let limit = Infinity;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') dryRun = true;
    else if (args[i] === '--limit') limit = Number(args[++i]);
    else files.push(args[i]);
  }
  return { files, dryRun, limit };
}

function toInt(v: unknown): number | null {
  const n = parseInt(String(v ?? '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function sourceName(path: string) {
  return path.split('/').pop() ?? path;
}

function dictRows(csvRows: string[][]): Record<string, string>[] {
  const rows = csvRows.filter((r) => r.some((c) => c.trim()));
  const start = rows[0]?.length === 1 && /^table/i.test(rows[0][0] ?? '') ? 1 : 0;
  const headers = rows[start] ?? [];
  return rows.slice(start + 1).map((r) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => { o[h] = r[i] ?? ''; });
    return o;
  });
}

function fromNationalCsv(path: string, rows: string[][]): Row[] {
  return dictRows(rows).map((r) => {
    const address = r['Billing Street'];
    const state = normalizeState(r['Billing State/Province']);
    const zip5 = normalizeZip5(r['Billing Zip/Postal Code']);
    const normalizedAddress = normalizeAddressLine1(address);
    return {
      name: r['Account Name'] || null,
      addressLine1: address || null,
      normalizedAddress,
      city: r['Billing City'] || null,
      state,
      zip5,
      phoneE164: normalizePhoneE164(r.Phone),
      unitsCount: null,
      valid: !!normalizedAddress && !!state && !!zip5,
      quarantineReason: !normalizedAddress ? 'missing_address' : !state ? 'invalid_state' : !zip5 ? 'missing_zip' : undefined,
      source: sourceName(path),
      propertyUrl: r.Website || null,
    };
  });
}

function fromLegacyCsv(path: string, rows: string[][]): Row[] {
  return rows
    .filter((r) => !isHeaderRow(r))
    .map((r) => ({ ...mapRow(r), source: sourceName(path) }));
}

function fromJson(path: string): Row[] {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const list = Array.isArray(data) ? data : (data.data ?? data.properties ?? []);
  return list.map((r: any) => {
    const address = r.address;
    const state = normalizeState(r.state);
    const zip5 = normalizeZip5(r.zip_code ?? r.zip);
    const normalizedAddress = normalizeAddressLine1(address);
    return {
      name: r.title ?? r.name ?? null,
      addressLine1: address ?? null,
      normalizedAddress,
      city: r.city ?? null,
      state,
      zip5,
      phoneE164: normalizePhoneE164(r.phone),
      unitsCount: toInt(r.units),
      valid: !!normalizedAddress && !!state && !!zip5,
      quarantineReason: !normalizedAddress ? 'missing_address' : !state ? 'invalid_state' : !zip5 ? 'missing_zip' : undefined,
      source: sourceName(path),
      propertyUrl: r.property_url ?? null,
      yearBuilt: toInt(r.year_built),
    };
  });
}

function load(path: string): Row[] {
  if (path.endsWith('.json')) return fromJson(path);
  const rows = parseCsv(readFileSync(path, 'utf8'));
  const first = rows.find((r) => r.some((c) => c.trim())) ?? [];
  const second = rows.filter((r) => r.some((c) => c.trim()))[1] ?? [];
  const header = first.length === 1 && /^table/i.test(first[0] ?? '') ? second : first;
  if (header.includes('Account Name') || header.includes('Billing Street')) return fromNationalCsv(path, rows);
  return fromLegacyCsv(path, rows);
}

function propertyClass(units: number | null): string {
  if (units == null) return 'unknown';
  if (units <= 4) return 'single_family';
  if (units <= 49) return 'small_multifamily';
  if (units <= 199) return 'midsize';
  return 'large_community';
}

async function main() {
  const { files, dryRun, limit } = parseArgs();
  if (files.length === 0) throw new Error('Usage: npm run bootstrap:inventory -- [--dry-run] [--limit N] <files...>');

  const seen = new Set<string>();
  const rows: Row[] = [];
  let invalid = 0;
  for (const file of files) {
    const loaded = load(file);
    console.log(`Loaded ${loaded.length} rows from ${file}`);
    for (const r of loaded) {
      if (rows.length >= limit) break;
      if (!r.valid) { invalid++; continue; }
      const key = `${r.zip5}|${r.normalizedAddress}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(r);
    }
  }

  console.log(`Valid unique rows: ${rows.length}`);
  console.log(`Invalid skipped: ${invalid}`);
  if (dryRun) {
    console.log('Sample:', rows.slice(0, 5).map((r) => ({ name: r.name, address: r.addressLine1, city: r.city, state: r.state, zip5: r.zip5 })));
    return;
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const batchSize = 1000;
  let insertedProps = 0;
  let insertedAliases = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const propRows = batch.map((r) => ({
      name: r.name,
      normalized_address: r.normalizedAddress,
      address_line1: r.addressLine1,
      city: r.city,
      state: r.state,
      zip5: r.zip5,
      geocode_status: 'pending',
      property_class: propertyClass(r.unitsCount),
      units_count: r.unitsCount,
      year_built: r.yearBuilt ?? null,
      phone_e164: r.phoneE164,
      confidence_score: 0.55,
      status: 'active',
    }));
    const { data, error } = await supabase
      .from('canonical_property')
      .insert(propRows)
      .select('id,zip5,normalized_address');
    if (error) throw new Error(`canonical batch ${i / batchSize + 1}: ${error.message}`);
    insertedProps += data?.length ?? 0;

    const byKey = new Map((data ?? []).map((p: any) => [`${p.zip5}|${p.normalized_address}`, p.id]));
    const aliasRows = batch.map((r) => ({
      canonical_property_id: byKey.get(`${r.zip5}|${r.normalizedAddress}`),
      alias_name: r.name,
      alias_address: r.addressLine1,
      source: r.source,
    })).filter((r) => r.canonical_property_id);
    if (aliasRows.length) {
      const { error: aliasError } = await supabase.from('property_alias').insert(aliasRows);
      if (aliasError) throw new Error(`alias batch ${i / batchSize + 1}: ${aliasError.message}`);
      insertedAliases += aliasRows.length;
    }
    console.log(`Inserted ${insertedProps}/${rows.length} properties...`);
  }
  console.log(`Inserted properties: ${insertedProps}`);
  console.log(`Inserted aliases: ${insertedAliases}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
