// Property data provider — interface-driven so the UI is fully functional with
// mock data now, and switches to the canonical Supabase graph (set
// VITE_USE_CANONICAL=true) with no component changes once migrations are live.

import type { PropertyView, ReviewView, MediaItem, LifeStage, TimelineEvent } from '@/domain/property';
import type { CategoryKey } from '@/domain/truthScore';
import type { PropertyClass } from '@/domain/types';
import { FIXTURE_PROPERTIES, findFixture } from './fixtures';
import { getEnv } from '@/services/env';
import { supabase } from '@/integrations/supabase/client';

export interface LocationCount {
  state?: string;
  city?: string;
  count: number;
}

export interface PropertyDataProvider {
  readonly name: string;
  getProperty(id: string): Promise<PropertyView | null>;
  listSummaries(): Promise<PropertyView[]>;
  search(query: string): Promise<PropertyView[]>;
  listStates(): Promise<LocationCount[]>;
  listCities(state: string): Promise<LocationCount[]>;
  listByLocation(state: string, city: string): Promise<PropertyView[]>;
}

function tally<T>(rows: T[], key: (r: T) => string | null | undefined): { value: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export class MockPropertyProvider implements PropertyDataProvider {
  readonly name = 'mock';
  async getProperty(id: string): Promise<PropertyView | null> {
    return findFixture(id);
  }
  async listSummaries(): Promise<PropertyView[]> {
    return FIXTURE_PROPERTIES;
  }
  async search(query: string): Promise<PropertyView[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return FIXTURE_PROPERTIES.filter((p) =>
      [p.name, p.city, p.state, p.addressLine1]
        .filter(Boolean)
        .some((f) => (f as string).toLowerCase().includes(q)),
    );
  }
  async listStates(): Promise<LocationCount[]> {
    return tally(FIXTURE_PROPERTIES, (p) => p.state).map((t) => ({ state: t.value, count: t.count }));
  }
  async listCities(state: string): Promise<LocationCount[]> {
    return tally(FIXTURE_PROPERTIES.filter((p) => p.state === state), (p) => p.city).map((t) => ({ city: t.value, count: t.count }));
  }
  async listByLocation(state: string, city: string): Promise<PropertyView[]> {
    return FIXTURE_PROPERTIES.filter((p) => p.state === state && p.city === city);
  }
}

// Canonical-graph-backed provider: reads canonical_property + public facts +
// approved canonical_review and maps to the PropertyView the UI speaks.
// Active when VITE_USE_CANONICAL=true (after migrations are applied).
/* eslint-disable @typescript-eslint/no-explicit-any */
export class CanonicalPropertyProvider implements PropertyDataProvider {
  readonly name = 'canonical';
  private db = supabase as any;

  private mapReview(r: any): ReviewView {
    return {
      id: r.id,
      authorPseudonym: r.author_pseudonym ?? 'resident',
      trustTier: r.trust_tier,
      createdAt: r.created_at,
      lifeStage: r.life_stage as LifeStage,
      title: r.title,
      body: r.body ?? undefined,
      ratings: (r.ratings ?? {}) as Partial<Record<CategoryKey, number>>,
      hasVideo: !!r.has_video,
    };
  }

  async getProperty(id: string): Promise<PropertyView | null> {
    const { data: prop, error } = await this.db
      .from('canonical_property').select('*').eq('id', id).maybeSingle();
    if (error || !prop) return null;

    const { data: reviewRows } = await this.db
      .from('canonical_review').select('*')
      .eq('canonical_property_id', id)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false });

    const reviews = (reviewRows ?? []).map((r: any) => this.mapReview(r));
    const media: MediaItem[] = (reviewRows ?? [])
      .filter((r: any) => r.media_asset_id || r.embed_url)
      .map((r: any) => ({
        id: r.id,
        source: r.embed_url ? 'imported' : (r.source === 'official' ? 'official' : 'resident'),
        title: r.title,
        embedUrl: r.embed_url ?? undefined,
        platform: r.embed_platform ?? undefined,
        isPositive: undefined,
        verified: r.trust_tier === 'verified_resident',
      }));

    const { data: eventRows } = await this.db
      .from('property_event').select('*')
      .eq('canonical_property_id', id)
      .order('event_date', { ascending: true });
    const timeline: TimelineEvent[] = (eventRows ?? []).map((e: any) => ({
      id: e.id,
      date: e.event_date,
      kind: e.kind,
      label: e.label,
      delta: e.delta ?? undefined,
    }));

    return {
      id: prop.id,
      name: prop.name ?? 'Unnamed property',
      addressLine1: prop.address_line1 ?? null,
      city: prop.city ?? null,
      state: prop.state ?? null,
      latitude: prop.latitude ?? null,
      longitude: prop.longitude ?? null,
      propertyClass: (prop.property_class ?? 'unknown') as PropertyClass,
      unitsCount: prop.units_count ?? null,
      claimedByManager: false,
      reviews,
      media,
      timeline,
    };
  }

  private mapSummary(prop: any): PropertyView {
    return {
      id: prop.id,
      name: prop.name ?? 'Unnamed property',
      addressLine1: prop.address_line1 ?? null,
      city: prop.city ?? null,
      state: prop.state ?? null,
      propertyClass: (prop.property_class ?? 'unknown') as PropertyClass,
      unitsCount: prop.units_count ?? null,
      claimedByManager: false,
      reviews: [],
      media: [],
      timeline: [],
    };
  }

  async listSummaries(): Promise<PropertyView[]> {
    const { data } = await this.db
      .from('canonical_property').select('*').eq('status', 'active').limit(24);
    return (data ?? []).map((p: any) => this.mapSummary(p));
  }

  // Alias-aware search: direct match on canonical fields OR any alias name,
  // so "Willow Creek Apts" resolves the same canonical entity as "Willow Creek".
  async search(query: string): Promise<PropertyView[]> {
    const q = query.trim();
    if (!q) return [];
    const term = `%${q}%`;

    const { data: direct } = await this.db
      .from('canonical_property').select('*')
      .eq('status', 'active')
      .or(`name.ilike.${term},address_line1.ilike.${term},city.ilike.${term}`)
      .limit(20);
    const results: any[] = direct ?? [];
    const seen = new Set(results.map((r) => r.id));

    const { data: aliasRows } = await this.db
      .from('property_alias').select('canonical_property_id')
      .ilike('alias_name', term).limit(20);
    const aliasIds = [...new Set((aliasRows ?? []).map((a: any) => a.canonical_property_id))]
      .filter((id) => !seen.has(id));
    if (aliasIds.length > 0) {
      const { data: viaAlias } = await this.db
        .from('canonical_property').select('*').in('id', aliasIds).eq('status', 'active');
      results.push(...(viaAlias ?? []));
    }
    return results.map((p) => this.mapSummary(p));
  }

  async listStates(): Promise<LocationCount[]> {
    const { data } = await this.db.from('canonical_property').select('state').eq('status', 'active');
    return tally(data ?? [], (r: any) => r.state).map((t) => ({ state: t.value, count: t.count }));
  }
  async listCities(state: string): Promise<LocationCount[]> {
    const { data } = await this.db.from('canonical_property').select('city').eq('status', 'active').eq('state', state);
    return tally(data ?? [], (r: any) => r.city).map((t) => ({ city: t.value, count: t.count }));
  }
  async listByLocation(state: string, city: string): Promise<PropertyView[]> {
    const { data } = await this.db
      .from('canonical_property').select('*').eq('status', 'active').eq('state', state).eq('city', city).limit(60);
    return (data ?? []).map((p: any) => this.mapSummary(p));
  }
}

let cached: PropertyDataProvider | null = null;

export function getPropertyProvider(): PropertyDataProvider {
  if (cached) return cached;
  cached = getEnv('VITE_USE_CANONICAL') === 'true'
    ? new CanonicalPropertyProvider()
    : new MockPropertyProvider();
  return cached;
}
