// Collaborative storytelling engine — Periscope is not a review site, it's a
// collaborative story about a physical place. This models a property's "story
// completeness" as content slots and generates audience-aware suggestions,
// framed as "help complete this property's story" (not "leave a review").

import type { PropertyView } from './property';

export type StoryAudience = 'management' | 'resident' | 'creator';

export interface StorySlot {
  key: string;
  label: string;
  filledBy: StoryAudience; // who typically fills it
  filled: boolean;
}

export interface StoryCompleteness {
  pct: number;
  filled: number;
  total: number;
  slots: StorySlot[];
}

export function computeStory(property: PropertyView): StoryCompleteness {
  const channels = property.officialChannels ?? [];
  const hasKind = (k: string) => channels.some((c) => c.kind === k);
  const officialMedia = property.media.some((m) => m.source === 'official');
  const importedMedia = property.media.some((m) => m.source === 'imported');
  const cat = (name: string) => property.media.some((m) => m.category === name);

  const slots: StorySlot[] = [
    { key: 'exterior', label: 'Exterior', filledBy: 'management', filled: property.latitude != null || hasKind('gallery') },
    { key: 'amenities', label: 'Amenities', filledBy: 'management', filled: officialMedia || hasKind('youtube') },
    { key: 'pool', label: 'Pool', filledBy: 'management', filled: cat('Property tours') },
    { key: 'clubhouse', label: 'Clubhouse', filledBy: 'management', filled: false },
    { key: 'floorplans', label: 'Floorplans', filledBy: 'management', filled: hasKind('matterport') || hasKind('website') },
    { key: 'resident_events', label: 'Resident Events', filledBy: 'management', filled: false },
    { key: 'neighborhood_guide', label: 'Neighborhood Guide', filledBy: 'creator', filled: importedMedia },
    { key: 'staff_intro', label: 'Staff Introduction', filledBy: 'management', filled: channels.some((c) => c.verified) },
    { key: 'maintenance_updates', label: 'Maintenance Updates', filledBy: 'management', filled: false },
    { key: 'resident_truth', label: 'Resident Truth', filledBy: 'resident', filled: property.reviews.length > 0 },
  ];

  const filled = slots.filter((s) => s.filled).length;
  return { pct: Math.round((filled / slots.length) * 100), filled, total: slots.length, slots };
}

export interface ContentSuggestion {
  label: string;
  slotKey?: string;
  priority: number; // lower = higher priority (tied to a missing slot)
}

// Audience-specific suggestion catalogs (from founder guidance).
const MANAGEMENT_SUGGESTIONS: Record<string, string> = {
  exterior: 'Record a property overview',
  pool: 'Record a pool tour',
  amenities: 'Record a gym/amenities tour',
  clubhouse: 'Record a clubhouse tour',
  floorplans: 'Record a 1BR & 2BR walkthrough',
  resident_events: 'Record a resident event',
  neighborhood_guide: 'Record a neighborhood guide',
  staff_intro: 'Record a staff introduction',
  maintenance_updates: 'Record maintenance improvements',
};
const MANAGEMENT_EXTRA = [
  'Record a pet amenities tour', 'Record a parking/security walkthrough', 'Record renovation updates',
];

const RESIDENT_SUGGESTIONS = [
  'Show your actual unit', 'Show your view', 'Show parking', 'Show package lockers',
  'Show your move-in experience', 'Show your move-out experience', 'Show a maintenance experience',
  'Show your deposit charges', 'Show your favorite amenity', 'Show what surprised you most',
  'Show what nobody tells you before renting',
];

const CREATOR_SUGGESTIONS = [
  'Apartment reality check', 'Community verdicts', 'Luxury versus reality',
  'Deposit horror stories', 'Best apartments under $X', 'Hidden fees',
  'Management changes', 'Maintenance investigation', 'Neighborhood guide',
];

export function suggestContent(property: PropertyView, audience: StoryAudience): ContentSuggestion[] {
  const story = computeStory(property);
  const missing = story.slots.filter((s) => !s.filled);

  if (audience === 'management') {
    const tied = missing
      .filter((s) => MANAGEMENT_SUGGESTIONS[s.key])
      .map((s, i) => ({ label: MANAGEMENT_SUGGESTIONS[s.key], slotKey: s.key, priority: i }));
    const extra = MANAGEMENT_EXTRA.map((label, i) => ({ label, priority: 100 + i }));
    return [...tied, ...extra].slice(0, 8);
  }
  if (audience === 'creator') {
    return CREATOR_SUGGESTIONS.map((label, i) => ({ label, priority: i })).slice(0, 8);
  }
  // resident — prioritize resident_truth if missing
  const residentTied = missing.some((s) => s.key === 'resident_truth')
    ? [{ label: 'Show your actual unit', slotKey: 'resident_truth', priority: 0 }]
    : [];
  return [...residentTied, ...RESIDENT_SUGGESTIONS.map((label, i) => ({ label, priority: 10 + i }))]
    .filter((s, i, arr) => arr.findIndex((x) => x.label === s.label) === i)
    .slice(0, 8);
}
