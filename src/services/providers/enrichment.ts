// Property enrichment provider abstraction (RentCast/ATTOM/Census).
// Backfills unit mix, year built, beds/baths, coordinates, etc.

import { getEnv } from '../env';

export interface EnrichmentInput {
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  zip5?: string | null;
}

export interface EnrichmentResult {
  beds?: number | null;
  baths?: number | null;
  yearBuilt?: number | null;
  unitsCount?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  raw?: unknown;
  provider: string;
}

export interface EnrichmentProvider {
  readonly name: string;
  enrich(input: EnrichmentInput): Promise<EnrichmentResult | null>;
}

// Mock: returns nothing (no fabricated data — enrichment is optional).
export class MockEnrichmentProvider implements EnrichmentProvider {
  readonly name = 'mock';
  async enrich(): Promise<EnrichmentResult | null> {
    return { provider: this.name };
  }
}

export class RentcastEnrichmentProvider implements EnrichmentProvider {
  readonly name = 'rentcast';
  constructor(private apiKey: string) {}

  async enrich(input: EnrichmentInput): Promise<EnrichmentResult | null> {
    const url =
      `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(input.addressLine1 ?? '')}` +
      `&city=${encodeURIComponent(input.city ?? '')}&state=${encodeURIComponent(input.state ?? '')}`;
    const res = await fetch(url, { headers: { 'X-Api-Key': this.apiKey, accept: 'application/json' } });
    if (!res.ok) return { provider: this.name };
    const data = await res.json();
    const p = Array.isArray(data) ? data[0] : data;
    if (!p) return { provider: this.name };
    return {
      beds: p.bedrooms ?? null,
      baths: p.bathrooms ?? null,
      yearBuilt: p.yearBuilt ?? null,
      unitsCount: p.features?.unitCount ?? null,
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
      raw: p,
      provider: this.name,
    };
  }
}

let cached: EnrichmentProvider | null = null;

export function getEnrichmentProvider(): EnrichmentProvider {
  if (cached) return cached;
  const key = getEnv('RENTCAST_API_KEY');
  cached = key ? new RentcastEnrichmentProvider(key) : new MockEnrichmentProvider();
  return cached;
}

export function __setEnrichmentProvider(p: EnrichmentProvider | null): void {
  cached = p;
}
