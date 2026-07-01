// Property repository — typed data access over the canonical graph.
// Accepts an injected Supabase client (browser anon client or Node admin
// client) so it works in every context. Rows are mapped to domain types at
// the boundary, keeping the rest of the app strongly typed even before the
// generated Supabase types are regenerated post-migration.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CanonicalProperty, PropertyClass, PropertyFact } from '@/domain/types';
import { distanceMeters } from '../normalize';

/* eslint-disable @typescript-eslint/no-explicit-any */

function rowToCanonical(r: any): CanonicalProperty {
  return {
    id: r.id,
    name: r.name ?? null,
    normalizedAddress: r.normalized_address,
    addressLine1: r.address_line1 ?? null,
    city: r.city ?? null,
    state: r.state ?? null,
    zip5: r.zip5 ?? null,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    geoConfidence: r.geo_confidence ?? null,
    geocodeStatus: r.geocode_status,
    propertyClass: r.property_class,
    unitsCount: r.units_count ?? null,
    yearBuilt: r.year_built ?? null,
    phoneE164: r.phone_e164 ?? null,
    status: r.status,
    mergedInto: r.merged_into ?? null,
    confidenceScore: r.confidence_score ?? 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface NewCanonicalProperty {
  name?: string | null;
  normalizedAddress: string;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  zip5?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geoConfidence?: number | null;
  geocodeStatus?: string;
  propertyClass?: PropertyClass;
  unitsCount?: number | null;
  yearBuilt?: number | null;
  phoneE164?: string | null;
  confidenceScore?: number;
}

export interface FactInput {
  attribute: string;
  value: unknown;
  sourceKey: string;
  confidence?: number;
  isPublic?: boolean;
  observedAt?: string;
}

export function createPropertyRepository(client: SupabaseClient) {
  const T = 'canonical_property';

  return {
    async findByCanonicalKey(
      zip5: string | null,
      normalizedAddress: string,
    ): Promise<CanonicalProperty | null> {
      let q = client.from(T).select('*').eq('normalized_address', normalizedAddress).neq('status', 'merged');
      q = zip5 == null ? q.is('zip5', null) : q.eq('zip5', zip5);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data ? rowToCanonical(data) : null;
    },

    // Bounding-box candidate fetch for entity resolution; caller filters by
    // exact haversine distance.
    async findNearby(
      lat: number,
      lng: number,
      radiusMeters: number,
    ): Promise<CanonicalProperty[]> {
      const dLat = radiusMeters / 111_320;
      const dLng = radiusMeters / (111_320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
      const { data, error } = await client
        .from(T)
        .select('*')
        .gte('latitude', lat - dLat)
        .lte('latitude', lat + dLat)
        .gte('longitude', lng - dLng)
        .lte('longitude', lng + dLng)
        .neq('status', 'merged')
        .limit(50);
      if (error) throw error;
      return (data ?? [])
        .map(rowToCanonical)
        .filter((p) =>
          p.latitude != null &&
          p.longitude != null &&
          distanceMeters(lat, lng, p.latitude, p.longitude) <= radiusMeters,
        );
    },

    async insertCanonical(input: NewCanonicalProperty): Promise<CanonicalProperty> {
      const { data, error } = await client
        .from(T)
        .insert({
          name: input.name ?? null,
          normalized_address: input.normalizedAddress,
          address_line1: input.addressLine1 ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          zip5: input.zip5 ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          geo_confidence: input.geoConfidence ?? null,
          geocode_status: input.geocodeStatus ?? 'pending',
          property_class: input.propertyClass ?? 'unknown',
          units_count: input.unitsCount ?? null,
          year_built: input.yearBuilt ?? null,
          phone_e164: input.phoneE164 ?? null,
          confidence_score: input.confidenceScore ?? 0,
        })
        .select('*')
        .single();
      if (error) throw error;
      return rowToCanonical(data);
    },

    async addAlias(
      canonicalPropertyId: string,
      aliasName: string | null,
      aliasAddress: string | null,
      source: string | null,
    ): Promise<void> {
      const { error } = await client.from('property_alias').insert({
        canonical_property_id: canonicalPropertyId,
        alias_name: aliasName,
        alias_address: aliasAddress,
        source,
      });
      if (error) throw error;
    },

    async addFacts(canonicalPropertyId: string, facts: FactInput[]): Promise<void> {
      if (facts.length === 0) return;
      const rows = facts.map((f) => ({
        canonical_property_id: canonicalPropertyId,
        attribute: f.attribute,
        value: f.value as any,
        source_key: f.sourceKey,
        confidence: f.confidence ?? 0.5,
        is_public: f.isPublic ?? true,
        observed_at: f.observedAt ?? new Date().toISOString(),
      }));
      const { error } = await client.from('property_fact').insert(rows);
      if (error) throw error;
    },

    async getPublicFacts(canonicalPropertyId: string): Promise<PropertyFact[]> {
      const { data, error } = await client
        .from('property_fact')
        .select('*')
        .eq('canonical_property_id', canonicalPropertyId)
        .eq('is_public', true);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        canonicalPropertyId: r.canonical_property_id,
        attribute: r.attribute,
        value: r.value,
        sourceKey: r.source_key,
        confidence: r.confidence,
        isPublic: r.is_public,
        observedAt: r.observed_at,
      }));
    },

    async getById(id: string): Promise<CanonicalProperty | null> {
      const { data, error } = await client.from(T).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? rowToCanonical(data) : null;
    },

    // App-facing search: resolve by alias/name (trigram) + city/state.
    async searchByText(query: string, limit = 20): Promise<CanonicalProperty[]> {
      const term = `%${query}%`;
      const { data, error } = await client
        .from(T)
        .select('*')
        .eq('status', 'active')
        .or(`name.ilike.${term},address_line1.ilike.${term},city.ilike.${term}`)
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(rowToCanonical);
    },
  };
}

export type PropertyRepository = ReturnType<typeof createPropertyRepository>;
