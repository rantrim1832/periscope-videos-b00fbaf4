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
  embedUrl?: string;      // iframe src for embedded social video (no re-host)
  platform?: string;      // 'youtube' | 'tiktok' | 'instagram'
  city?: string;
  category?: string;      // entertainment feed category
  isPositive?: boolean;
  verified?: boolean;
}

// A media item with its property context, for the entertainment feed.
export interface FeedItem extends MediaItem {
  propertyId: string;
  propertyName: string;
  location: string;
}

export const FEED_CATEGORIES = [
  'All',
  'Horror stories',
  'Deposit nightmares',
  'Maintenance disasters',
  'Luxury tours',
  'Investigations',
  'Apartment hacks',
  'Would you live here?',
] as const;
export type FeedCategory = (typeof FEED_CATEGORIES)[number];

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

export type ChannelKind =
  | 'website' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'matterport' | 'gallery';

export interface OfficialChannel {
  id: string;
  kind: ChannelKind;
  url: string;
  embedUrl?: string;
  label?: string;
  verified: boolean; // true once the property is claimed & verified
}

export interface PropertyView {
  id: string;
  name: string;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  latitude?: number | null;
  longitude?: number | null;
  propertyClass: PropertyClass;
  unitsCount: number | null;
  claimedByManager: boolean;
  heroVideoUrl?: string;
  reviews: ReviewView[];
  media: MediaItem[];
  timeline: TimelineEvent[];
  officialChannels?: OfficialChannel[];
}
