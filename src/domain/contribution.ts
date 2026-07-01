// Contribution (the "Add your truth" flow) domain model.
import type { CategoryKey } from './truthScore';
import type { LifeStage } from './property';
import type { ResidentTrustTier, VerificationMethod } from './types';

export type ContributionType = 'video' | 'photo' | 'text';

export interface ContributionDraft {
  propertyId: string;
  propertyName: string;
  type: ContributionType;
  lifeStage: LifeStage;
  title: string;
  body: string;
  ratings: Partial<Record<CategoryKey, number>>;
  wouldLeaseAgain: boolean | null;
  trustTier: ResidentTrustTier;
  verificationMethod: VerificationMethod;
  anonymous: boolean;
  mediaAssetId?: string;
}

export type SubmissionStatus = 'published' | 'pending' | 'rejected';

export interface SubmissionResult {
  status: SubmissionStatus;
  reviewId: string;
  reason?: string;
}

// Curate the ratings shown per life stage to minimize friction — ask only what's
// relevant to the experience the resident is describing.
export const LIFE_STAGE_CATEGORIES: Record<LifeStage, CategoryKey[]> = {
  moveIn: ['moveIn', 'management', 'value'],
  living: ['management', 'maintenance', 'noise', 'safety', 'amenities', 'parking', 'value'],
  maintenance: ['maintenance', 'management', 'safety'],
  moveOut: ['moveOut', 'management', 'value'],
  deposit: ['depositReturn', 'management', 'value'],
};

export function emptyDraft(propertyId: string, propertyName: string): ContributionDraft {
  return {
    propertyId,
    propertyName,
    type: 'text',
    lifeStage: 'living',
    title: '',
    body: '',
    ratings: {},
    wouldLeaseAgain: null,
    trustTier: 'unverified',
    verificationMethod: 'none',
    anonymous: true,
  };
}
