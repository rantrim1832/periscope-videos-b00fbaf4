// Inventory ingestion pipeline: sanitize → repair → geocode → entity-resolve
// → load, with quarantine for unrecoverable rows. Deterministic and sink-
// abstracted so it runs fully offline (dry-run) or against Supabase.

import type { GeocodingProvider } from '../services/providers/geocoding';
import { classifyByUnits } from '../domain/types';
import { nameSimilarity } from '../services/normalize';
import { mapRow, isHeaderRow, type RawProperty } from './mapRow';
import type { IngestSink } from './sink';
import type { FactInput } from '../services/repositories/propertyRepository';

export interface IngestionStats {
  totalRows: number;
  created: number;
  mergedExact: number;
  mergedNearby: number;
  needsReview: number;
  quarantined: number;
  quarantineReasons: Record<string, number>;
}

export interface IngestionOptions {
  sourceKey: string;
  geocoder: GeocodingProvider;
  sink: IngestSink;
  // Entity-resolution thresholds (tuned to the inventory analysis).
  autoMergeMeters?: number; // default 25m
  reviewMeters?: number; // default 100m
  reviewNameSimilarity?: number; // default 0.6
  onProgress?: (done: number, total: number) => void;
}

function factsFor(record: RawProperty, sourceKey: string): FactInput[] {
  const now = new Date().toISOString();
  const facts: FactInput[] = [];
  const push = (attribute: string, value: unknown, isPublic = true) => {
    if (value != null && value !== '') {
      facts.push({ attribute, value, sourceKey, confidence: 0.6, isPublic, observedAt: now });
    }
  };
  push('name', record.name);
  push('units_count', record.unitsCount);
  // Phone is treated as PRIVATE (management-contact data, per privacy strategy).
  push('phone', record.phoneE164, false);
  return facts;
}

export async function runIngestion(
  tokenRows: string[][],
  opts: IngestionOptions,
): Promise<IngestionStats> {
  const autoMergeMeters = opts.autoMergeMeters ?? 25;
  const reviewMeters = opts.reviewMeters ?? 100;
  const reviewNameSim = opts.reviewNameSimilarity ?? 0.6;

  const stats: IngestionStats = {
    totalRows: 0,
    created: 0,
    mergedExact: 0,
    mergedNearby: 0,
    needsReview: 0,
    quarantined: 0,
    quarantineReasons: {},
  };

  const dataRows = tokenRows.filter((r, i) => !(i === 0 && isHeaderRow(r)) && r.some((c) => c.trim() !== ''));
  const total = dataRows.length;
  let done = 0;

  for (const tokens of dataRows) {
    stats.totalRows++;
    const record = mapRow(tokens);

    // Quarantine unrecoverable rows (held, never dropped).
    if (!record.valid) {
      stats.quarantined++;
      const reason = record.quarantineReason ?? 'unknown';
      stats.quarantineReasons[reason] = (stats.quarantineReasons[reason] ?? 0) + 1;
      await opts.sink.recordSource(opts.sourceKey, tokens, record, 'quarantined', null, reason);
      done++;
      opts.onProgress?.(done, total);
      continue;
    }

    // 1. Exact canonical-key match → merge.
    const exact = await opts.sink.findByKey(record.zip5, record.normalizedAddress);
    if (exact) {
      await opts.sink.addAlias(exact.id, record.name, record.addressLine1, opts.sourceKey);
      await opts.sink.addFacts(exact.id, factsFor(record, opts.sourceKey));
      await opts.sink.recordSource(opts.sourceKey, tokens, record, 'merged', exact.id);
      stats.mergedExact++;
      done++;
      opts.onProgress?.(done, total);
      continue;
    }

    // 2. Geocode for proximity resolution.
    const geo = await opts.geocoder.geocode({
      addressLine1: record.addressLine1,
      city: record.city,
      state: record.state,
      zip5: record.zip5,
    });

    // 3. Proximity resolution.
    if (geo) {
      const nearby = await opts.sink.findNearby(geo.latitude, geo.longitude, reviewMeters);
      // Auto-merge: very close + same normalized address.
      const auto = nearby.find(
        (p) => p.normalizedAddress === record.normalizedAddress,
      );
      if (auto) {
        await opts.sink.addAlias(auto.id, record.name, record.addressLine1, opts.sourceKey);
        await opts.sink.addFacts(auto.id, factsFor(record, opts.sourceKey));
        await opts.sink.recordSource(opts.sourceKey, tokens, record, 'merged', auto.id);
        stats.mergedNearby++;
        done++;
        opts.onProgress?.(done, total);
        continue;
      }
      // Needs review: close + similar name (queue, do not auto-merge).
      const candidate = nearby.find(
        (p) => p.name && record.name && nameSimilarity(p.name, record.name) >= reviewNameSim,
      );
      if (candidate) {
        await opts.sink.recordSource(opts.sourceKey, tokens, record, 'needs_review', candidate.id);
        stats.needsReview++;
        done++;
        opts.onProgress?.(done, total);
        continue;
      }
    }

    // 4. Create new canonical entity + alias + facts.
    const created = await opts.sink.insertCanonical({
      name: record.name,
      normalizedAddress: record.normalizedAddress,
      addressLine1: record.addressLine1,
      city: record.city,
      state: record.state,
      zip5: record.zip5,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      geoConfidence: geo?.confidence ?? null,
      geocodeStatus: geo ? 'geocoded' : 'failed',
      propertyClass: classifyByUnits(record.unitsCount),
      unitsCount: record.unitsCount,
      phoneE164: record.phoneE164,
      confidenceScore: geo ? geo.confidence : 0.2,
    });
    await opts.sink.addAlias(created.id, record.name, record.addressLine1, opts.sourceKey);
    await opts.sink.addFacts(created.id, factsFor(record, opts.sourceKey));
    await opts.sink.recordSource(opts.sourceKey, tokens, record, 'created', created.id);
    stats.created++;
    done++;
    opts.onProgress?.(done, total);
  }

  return stats;
}
