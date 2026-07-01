// Resident repository — the second side of the trust graph.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ResidentProfile, ResidencyClaim } from '@/domain/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

function rowToProfile(r: any): ResidentProfile {
  return {
    id: r.id,
    displayName: r.display_name ?? null,
    pseudonym: r.pseudonym ?? null,
    bio: r.bio ?? null,
    avatarUrl: r.avatar_url ?? null,
    trustTier: r.trust_tier,
    contributorReputation: r.contributor_reputation ?? 0,
  };
}

function rowToClaim(r: any): ResidencyClaim {
  return {
    id: r.id,
    residentId: r.resident_id,
    canonicalPropertyId: r.canonical_property_id,
    tenureStart: r.tenure_start ?? null,
    tenureEnd: r.tenure_end ?? null,
    isCurrent: r.is_current,
    verificationTier: r.verification_tier,
    verificationMethod: r.verification_method,
    wouldLeaseAgain: r.would_lease_again ?? null,
  };
}

export function createResidentRepository(client: SupabaseClient) {
  return {
    async getProfile(id: string): Promise<ResidentProfile | null> {
      const { data, error } = await client
        .from('resident_profile')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToProfile(data) : null;
    },

    async updateProfile(id: string, patch: Partial<ResidentProfile>): Promise<void> {
      const { error } = await client
        .from('resident_profile')
        .update({
          display_name: patch.displayName,
          pseudonym: patch.pseudonym,
          bio: patch.bio,
          avatar_url: patch.avatarUrl,
        })
        .eq('id', id);
      if (error) throw error;
    },

    async addResidencyClaim(
      residentId: string,
      canonicalPropertyId: string,
      opts: Partial<Omit<ResidencyClaim, 'id' | 'residentId' | 'canonicalPropertyId'>> = {},
    ): Promise<ResidencyClaim> {
      const { data, error } = await client
        .from('residency_claim')
        .insert({
          resident_id: residentId,
          canonical_property_id: canonicalPropertyId,
          tenure_start: opts.tenureStart ?? null,
          tenure_end: opts.tenureEnd ?? null,
          is_current: opts.isCurrent ?? false,
          would_lease_again: opts.wouldLeaseAgain ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return rowToClaim(data);
    },

    async listClaims(residentId: string): Promise<ResidencyClaim[]> {
      const { data, error } = await client
        .from('residency_claim')
        .select('*')
        .eq('resident_id', residentId);
      if (error) throw error;
      return (data ?? []).map(rowToClaim);
    },
  };
}

export type ResidentRepository = ReturnType<typeof createResidentRepository>;
