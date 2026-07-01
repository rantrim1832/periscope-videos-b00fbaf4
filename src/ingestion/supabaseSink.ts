// Production ingestion sink backed by Supabase (admin client + repository).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CanonicalProperty } from '../domain/types';
import {
  createPropertyRepository,
  type NewCanonicalProperty,
  type FactInput,
} from '../services/repositories/propertyRepository';
import type { IngestSink } from './sink';

/* eslint-disable @typescript-eslint/no-explicit-any */

export class SupabaseSink implements IngestSink {
  private repo: ReturnType<typeof createPropertyRepository>;
  constructor(private client: SupabaseClient) {
    this.repo = createPropertyRepository(client);
  }

  findByKey(zip5: string | null, normalizedAddress: string): Promise<CanonicalProperty | null> {
    return this.repo.findByCanonicalKey(zip5, normalizedAddress);
  }
  findNearby(lat: number, lng: number, radiusMeters: number): Promise<CanonicalProperty[]> {
    return this.repo.findNearby(lat, lng, radiusMeters);
  }
  insertCanonical(input: NewCanonicalProperty): Promise<CanonicalProperty> {
    return this.repo.insertCanonical(input);
  }
  addAlias(id: string, name: string | null, address: string | null, source: string): Promise<void> {
    return this.repo.addAlias(id, name, address, source);
  }
  addFacts(id: string, facts: FactInput[]): Promise<void> {
    return this.repo.addFacts(id, facts);
  }
  async recordSource(
    sourceKey: string,
    raw: unknown,
    normalized: unknown,
    matchStatus: string,
    canonicalId: string | null,
    notes?: string,
  ): Promise<void> {
    const { error } = await this.client.from('property_source_record').insert({
      source_key: sourceKey,
      raw: raw as any,
      normalized: normalized as any,
      match_status: matchStatus,
      canonical_property_id: canonicalId,
      notes: notes ?? null,
    });
    if (error) throw error;
  }
}
