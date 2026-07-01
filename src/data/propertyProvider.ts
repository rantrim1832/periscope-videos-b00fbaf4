// Property data provider — interface-driven so the UI is fully functional with
// mock data now, and switches to the canonical Supabase graph (set
// VITE_USE_CANONICAL=true) with no component changes once migrations are live.

import type { PropertyView } from '@/domain/property';
import { FIXTURE_PROPERTIES, findFixture } from './fixtures';
import { getEnv } from '@/services/env';

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

// Placeholder for the canonical-graph-backed provider. Wired once the canonical
// tables + reviews are live; falls back to mock until then.
export class CanonicalPropertyProvider implements PropertyDataProvider {
  readonly name = 'canonical';
  private fallback = new MockPropertyProvider();
  async getProperty(id: string): Promise<PropertyView | null> {
    // TODO: compose from propertyService + reviews once reviews are on the
    // canonical graph. Until then, keep the experience functional.
    return this.fallback.getProperty(id);
  }
  async listSummaries(): Promise<PropertyView[]> {
    return this.fallback.listSummaries();
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
