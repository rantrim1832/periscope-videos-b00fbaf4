// Domain types for the canonical Pariscope graph.
//
// These are intentionally decoupled from the Supabase-generated
// `integrations/supabase/types.ts`. The generated types should be
// regenerated from the live database after migrations are applied
// (`supabase gen types typescript`), but the application code depends
// on these stable domain types so the two can evolve independently.

export type PropertyStatus = 'active' | 'closed' | 'quarantined' | 'merged';

export type PropertyClass =
  | 'single_family'
  | 'small_multifamily'
  | 'midsize'
  | 'large_community'
  | 'unknown';

export type GeocodeStatus = 'pending' | 'geocoded' | 'failed' | 'manual';

export type MatchStatus = 'created' | 'merged' | 'needs_review' | 'quarantined';

export type ResidentTrustTier =
  | 'unverified'
  | 'likely_resident'
  | 'verified_resident';

export type VerificationMethod =
  | 'none'
  | 'gps_dwell'
  | 'lease'
  | 'utility'
  | 'payment'
  | 'community'
  | 'historical'
  | 'email';

/** Trust tiers for data sources; higher wins in conflict resolution. */
export const SOURCE_TRUST: Record<string, number> = {
  verified_claim: 900,
  enrichment_api: 700,
  csv_import: 500,
  resident_report: 400,
  user_suggestion: 300,
};

export interface CanonicalProperty {
  id: string;
  name: string | null;
  normalizedAddress: string;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zip5: string | null;
  latitude: number | null;
  longitude: number | null;
  geoConfidence: number | null;
  geocodeStatus: GeocodeStatus;
  propertyClass: PropertyClass;
  unitsCount: number | null;
  yearBuilt: number | null;
  phoneE164: string | null;
  status: PropertyStatus;
  mergedInto: string | null;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyAlias {
  id: string;
  canonicalPropertyId: string;
  aliasName: string | null;
  aliasAddress: string | null;
  source: string | null;
}

export interface PropertyFact {
  id: string;
  canonicalPropertyId: string;
  attribute: string;
  value: unknown;
  sourceKey: string;
  confidence: number;
  isPublic: boolean;
  observedAt: string;
}

export interface ResidentProfile {
  id: string;
  displayName: string | null;
  pseudonym: string | null;
  bio: string | null;
  avatarUrl: string | null;
  trustTier: ResidentTrustTier;
  contributorReputation: number;
}

export interface ResidencyClaim {
  id: string;
  residentId: string;
  canonicalPropertyId: string;
  tenureStart: string | null;
  tenureEnd: string | null;
  isCurrent: boolean;
  verificationTier: ResidentTrustTier;
  verificationMethod: VerificationMethod;
  wouldLeaseAgain: boolean | null;
}

/** Classify a property by unit count (the inventory spans 2→780 units). */
export function classifyByUnits(units: number | null | undefined): PropertyClass {
  if (units == null || units <= 0) return 'unknown';
  if (units <= 4) return 'single_family';
  if (units < 50) return 'small_multifamily';
  if (units < 200) return 'midsize';
  return 'large_community';
}
