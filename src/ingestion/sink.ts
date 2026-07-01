// Ingestion sink abstraction: where resolved properties are written.
// - InMemorySink: dry-run / tests, no DB or secrets required.
// - SupabaseSink: production, via the admin client + property repository.

import type { CanonicalProperty } from '../domain/types';
import { canonicalKey, distanceMeters } from '../services/normalize';
import type { NewCanonicalProperty, FactInput } from '../services/repositories/propertyRepository';

export interface IngestSink {
  findByKey(zip5: string | null, normalizedAddress: string): Promise<CanonicalProperty | null>;
  findNearby(lat: number, lng: number, radiusMeters: number): Promise<CanonicalProperty[]>;
  insertCanonical(input: NewCanonicalProperty): Promise<CanonicalProperty>;
  addAlias(id: string, name: string | null, address: string | null, source: string): Promise<void>;
  addFacts(id: string, facts: FactInput[]): Promise<void>;
  recordSource(sourceKey: string, raw: unknown, normalized: unknown, matchStatus: string, canonicalId: string | null, notes?: string): Promise<void>;
}

// In-memory implementation for offline dry-runs and unit tests.
// Uses a ~1.1km spatial grid (0.01° cells) so findNearby stays O(1)-ish
// instead of scanning every property (which is O(n^2) over a full ingest).
export class InMemorySink implements IngestSink {
  private byKey = new Map<string, CanonicalProperty>();
  private grid = new Map<string, CanonicalProperty[]>();
  private all: CanonicalProperty[] = [];
  public aliases = 0;
  public facts = 0;
  public sourceRecords: Array<{ matchStatus: string; canonicalId: string | null }> = [];

  private cellKey(lat: number, lng: number): string {
    return `${Math.floor(lat * 100)}:${Math.floor(lng * 100)}`;
  }

  async findByKey(zip5: string | null, normalizedAddress: string): Promise<CanonicalProperty | null> {
    return this.byKey.get(canonicalKey(zip5, normalizedAddress)) ?? null;
  }

  async findNearby(lat: number, lng: number, radiusMeters: number): Promise<CanonicalProperty[]> {
    // Search the 3x3 block of cells around the point (radius << cell size).
    const clat = Math.floor(lat * 100);
    const clng = Math.floor(lng * 100);
    const out: CanonicalProperty[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const bucket = this.grid.get(`${clat + dy}:${clng + dx}`);
        if (!bucket) continue;
        for (const p of bucket) {
          if (
            p.latitude != null &&
            p.longitude != null &&
            distanceMeters(lat, lng, p.latitude, p.longitude) <= radiusMeters
          ) {
            out.push(p);
          }
        }
      }
    }
    return out;
  }

  async insertCanonical(input: NewCanonicalProperty): Promise<CanonicalProperty> {
    const now = new Date().toISOString();
    const prop: CanonicalProperty = {
      id: `mem_${this.all.length}`,
      name: input.name ?? null,
      normalizedAddress: input.normalizedAddress,
      addressLine1: input.addressLine1 ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      zip5: input.zip5 ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      geoConfidence: input.geoConfidence ?? null,
      geocodeStatus: (input.geocodeStatus as CanonicalProperty['geocodeStatus']) ?? 'pending',
      propertyClass: input.propertyClass ?? 'unknown',
      unitsCount: input.unitsCount ?? null,
      yearBuilt: input.yearBuilt ?? null,
      phoneE164: input.phoneE164 ?? null,
      status: 'active',
      mergedInto: null,
      confidenceScore: input.confidenceScore ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this.all.push(prop);
    this.byKey.set(canonicalKey(prop.zip5, prop.normalizedAddress), prop);
    if (prop.latitude != null && prop.longitude != null) {
      const key = this.cellKey(prop.latitude, prop.longitude);
      const bucket = this.grid.get(key);
      if (bucket) bucket.push(prop);
      else this.grid.set(key, [prop]);
    }
    return prop;
  }

  async addAlias(): Promise<void> { this.aliases++; }
  async addFacts(_id: string, facts: FactInput[]): Promise<void> { this.facts += facts.length; }
  async recordSource(_s: string, _r: unknown, _n: unknown, matchStatus: string, canonicalId: string | null): Promise<void> {
    this.sourceRecords.push({ matchStatus, canonicalId });
  }

  get canonicalCount(): number { return this.all.length; }
}
