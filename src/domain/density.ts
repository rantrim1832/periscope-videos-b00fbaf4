// Property Density Score — "no property page feels abandoned".
//
// Measures PERCEIVED density across the layered content model, not truth
// completeness. Powers the on-page density bar and the seeding prioritization
// (lowest-density properties are the highest-value seeding opportunities).

import type { PropertyView } from './property';

export interface DensityItem {
  key: string;
  label: string;
  present: boolean;
}

export interface DensityScore {
  pct: number;        // 0..100
  present: number;
  total: number;
  items: DensityItem[];
  isAlive: boolean;   // clears the minimum "alive" bar
}

export function computeDensity(property: PropertyView): DensityScore {
  const channels = property.officialChannels ?? [];
  const hasChannel = (k: string) => channels.some((c) => c.kind === k);
  const media = property.media;

  const items: DensityItem[] = [
    { key: 'map', label: 'Map', present: property.latitude != null && property.longitude != null },
    { key: 'photos', label: 'Photos', present: hasChannel('gallery') || media.some((m) => m.thumbnailUrl) },
    { key: 'website', label: 'Website', present: hasChannel('website') },
    { key: 'instagram', label: 'Instagram', present: hasChannel('instagram') },
    { key: 'youtube', label: 'YouTube', present: hasChannel('youtube') || media.some((m) => m.platform === 'youtube') },
    { key: 'virtual_tour', label: 'Virtual tour', present: hasChannel('matterport') },
    { key: 'resident_truth', label: 'Resident reviews', present: property.reviews.length > 0 || media.some((m) => m.source === 'resident') },
    { key: 'creator_content', label: 'Creator content', present: media.some((m) => m.source === 'imported') },
    { key: 'official_verification', label: 'Official verification', present: channels.some((c) => c.verified) },
  ];

  const present = items.filter((i) => i.present).length;
  const pct = Math.round((present / items.length) * 100);

  // "Alive" = Layer 1 (map) + at least one media/content signal.
  const mapPresent = items[0].present;
  const anyContent = items.slice(1, 8).some((i) => i.present);
  const isAlive = mapPresent && anyContent;

  return { pct, present, total: items.length, items, isAlive };
}
