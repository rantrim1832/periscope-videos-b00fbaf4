// View models for the property experience. These describe what the HUMAN sees,
// not the database shape — the service/provider layer maps DB → these.

import type { PropertyClass } from './types';
import type { CategoryKey, ReviewSignal } from './truthScore';

export type LifeStage = 'moveIn' | 'living' | 'maintenance' | 'moveOut' | 'deposit';

export const LIFE_STAGE_LABELS: Record<LifeStage, string> = {
  moveIn: 'Move-in',
  living: 'Living here',
  maintenance: 'Maintenance',
  moveOut: 'Move-out',
  deposit: 'Deposit',
};

export type MediaSource = 'resident' | 'official' | 'imported';

export interface MediaItem {
  id: string;
  source: MediaSource;
  title: string;
  thumbnailUrl?: string;
  playbackUrl?: string;
  city?: string;
  isPositive?: boolean;
  verified?: boolean;
}

export interface ReviewView extends ReviewSignal {
  id: string;
  authorPseudonym: string;
  tenureLabel?: string; // e.g. "Resident 2023–2024"
  lifeStage: LifeStage;
  title: string;
  body?: string;
  ratings: Partial<Record<CategoryKey, number>>;
  hasVideo?: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string; // ISO or year
  kind: 'management_change' | 'renovation' | 'score_change' | 'incident' | 'note';
  label: string;
  delta?: number; // score delta if applicable
}

export interface PropertyView {
  id: string;
  name: string;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  propertyClass: PropertyClass;
  unitsCount: number | null;
  claimedByManager: boolean;
  heroVideoUrl?: string;
  reviews: ReviewView[];
  media: MediaItem[];
  timeline: TimelineEvent[];
}
