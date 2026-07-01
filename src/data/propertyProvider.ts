// Property data provider — interface-driven so the UI is fully functional with
// mock data now, and switches to the canonical Supabase graph (set
// VITE_USE_CANONICAL=true) with no component changes once migrations are live.

import type { PropertyView, ReviewView, MediaItem, LifeStage } from '@/domain/property';
import type { CategoryKey } from '@/domain/truthScore';
import type { PropertyClass } from '@/domain/types';
import { FIXTURE_PROPERTIES, findFixture } from './fixtures';
import { getEnv } from '@/services/env';
import { supabase } from '@/integrations/supabase/client';

export interface PropertyDataProvider {
  readonly name: string;
  getProperty(id: string): Promise<PropertyView | null>;
  listSummaries(): Promise<PropertyView[]>;
}

export class MockPropertyProvider implements PropertyDataProvider {
  readonly name = 'mock';
  async getProperty(id: string): Promise<PropertyView | null> {
    return findFixture(id);
  }
  async listSummaries(): Promise<PropertyView[]> {
    return FIXTURE_PROPERTIES;
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
      .filter((r: any) => r.media_asset_id)
      .map((r: any) => ({
        id: r.id,
        source: r.source === 'official' ? 'official' : 'resident',
        title: r.title,
        isPositive: undefined,
        verified: r.trust_tier === 'verified_resident',
      }));

    return {
      id: prop.id,
      name: prop.name ?? 'Unnamed property',
      addressLine1: prop.address_line1 ?? null,
      city: prop.city ?? null,
      state: prop.state ?? null,
      propertyClass: (prop.property_class ?? 'unknown') as PropertyClass,
      unitsCount: prop.units_count ?? null,
      claimedByManager: false,
      reviews,
      media,
      timeline: [],
    };
  }

  async listSummaries(): Promise<PropertyView[]> {
    const { data } = await this.db
      .from('canonical_property').select('*').eq('status', 'active').limit(24);
    return (data ?? []).map((prop: any) => ({
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
    }));
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
