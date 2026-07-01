// Higher-level property operations composed over the repository.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CanonicalProperty, PropertyFact } from '@/domain/types';
import { createPropertyRepository } from './repositories/propertyRepository';

export interface PropertyPage {
  property: CanonicalProperty;
  facts: PropertyFact[];
}

export function createPropertyService(client: SupabaseClient) {
  const repo = createPropertyRepository(client);

  return {
    /** App-facing search. Alias-aware, tolerant. */
    async search(query: string): Promise<CanonicalProperty[]> {
      const trimmed = query.trim();
      if (!trimmed) return [];
      return repo.searchByText(trimmed);
    },

    /** Everything needed to render a property page (public data only). */
    async getPropertyPage(id: string): Promise<PropertyPage | null> {
      const property = await repo.getById(id);
      if (!property) return null;
      const facts = await repo.getPublicFacts(id);
      return { property, facts };
    },
  };
}

export type PropertyService = ReturnType<typeof createPropertyService>;
