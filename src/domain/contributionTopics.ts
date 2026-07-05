// Prompt-tile "topics" that pre-configure the contribute upload flow.
// A tile click on Feed/Contribute lands on `/contribute?topic=<key>` (or
// `/contribute/:propertyId?topic=<key>`) and the upload flow jumps straight
// into the video step with the right tags, life-stage, and title placeholder.

import type { LifeStage } from './property';

export interface ContributionTopic {
  key: string;
  label: string;              // shown as a pill banner
  audience: 'resident' | 'manager';
  tags: string[];             // saved on the review for search + filtering
  lifeStage: LifeStage;
  titlePlaceholder: string;
  hint: string;
}

export const CONTRIBUTION_TOPICS: Record<string, ContributionTopic> = {
  'record-review': {
    key: 'record-review', label: 'Video review', audience: 'resident',
    tags: ['review', 'video-tour'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Honest take after 8 months — the good and the bad',
    hint: 'Great experience or bad — a 60-second walkthrough is worth a thousand words.',
  },
  'pricing': {
    key: 'pricing', label: 'Pricing surprise', audience: 'resident',
    tags: ['pricing', 'fees'], lifeStage: 'moveIn',
    titlePlaceholder: 'e.g. What renewal, fees and deposits actually cost me',
    hint: 'Rent, fees, deposits, utilities, move-out charges — surprises or fair play.',
  },
  'management': {
    key: 'management', label: 'Management issue', audience: 'resident',
    tags: ['management', 'communication'], lifeStage: 'living',
    titlePlaceholder: 'e.g. How the office actually handled my requests',
    hint: 'Responsiveness, communication, promises kept or broken — either way.',
  },
  'maintenance': {
    key: 'maintenance', label: 'Maintenance issue', audience: 'resident',
    tags: ['maintenance', 'repairs'], lifeStage: 'maintenance',
    titlePlaceholder: 'e.g. How maintenance handled my last request',
    hint: 'Repair speed and quality — praise the fast ones, flag the slow ones.',
  },
  'property-condition': {
    key: 'property-condition', label: 'Property condition', audience: 'resident',
    tags: ['property', 'condition', 'common-areas'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Elevators down every other week',
    hint: 'Hallways, elevators, parking, common areas, cleanliness.',
  },
  'local-vibe': {
    key: 'local-vibe', label: 'Local vibe', audience: 'resident',
    tags: ['neighborhood', 'vibe'], lifeStage: 'living',
    titlePlaceholder: 'e.g. What the block feels like at night',
    hint: 'Transit, groceries, restaurants, safety, weekend life.',
  },
  'application': {
    key: 'application', label: 'Application process', audience: 'resident',
    tags: ['application', 'leasing'], lifeStage: 'moveIn',
    titlePlaceholder: 'e.g. What screening, fees and approval actually looked like',
    hint: 'Screening, fees, approval timing, lease terms — smooth or painful.',
  },
  'loved-it': {
    key: 'loved-it', label: 'What you loved', audience: 'resident',
    tags: ['positive', 'recommend'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Why I re-signed my lease here',
    hint: 'The unit, the team, the neighbors — what makes this place worth it.',
  },
  'full-tour': {
    key: 'full-tour', label: 'Full property tour', audience: 'resident',
    tags: ['tour', 'walkthrough', 'video-tour'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Unfiltered tour: unit, amenities, halls, parking',
    hint: 'Unit + amenities + halls + street — the honest version.',
  },
  // Manager-side topics reuse the same flow; the audience field lets us tune
  // copy later if we split manager uploads to a claim-gated route.
  'leasing-tour': {
    key: 'leasing-tour', label: 'Leasing tour', audience: 'manager',
    tags: ['official', 'leasing-tour'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Official leasing tour — 2-bed on the 4th floor',
    hint: 'Walk renters through as if they just arrived.',
  },
  'interiors': {
    key: 'interiors', label: 'Interior walkthrough', audience: 'manager',
    tags: ['official', 'interior'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Inside a real 1-bed — finishes, light, storage',
    hint: 'Show real units — finishes, windows, layout flow.',
  },
  'amenities': {
    key: 'amenities', label: 'Amenities', audience: 'manager',
    tags: ['official', 'amenities'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Rooftop, gym, coworking, pet spa',
    hint: 'Gym, pool, lounge, coworking, rooftop, pet areas.',
  },
  'area': {
    key: 'area', label: 'Neighborhood', audience: 'manager',
    tags: ['official', 'neighborhood'], lifeStage: 'living',
    titlePlaceholder: 'e.g. What is within a 5-minute walk',
    hint: 'The block, transit, restaurants, parks, daily convenience.',
  },
};

export function getContributionTopic(key: string | null | undefined): ContributionTopic | null {
  if (!key) return null;
  return CONTRIBUTION_TOPICS[key] ?? null;
}