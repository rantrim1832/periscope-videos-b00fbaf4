// Sample properties spanning every experience state (rich / sparse / empty).
// Used by the mock provider so the UI is fully functional before the canonical
// graph is live. Realistic but clearly illustrative.

import type { PropertyView, ReviewView, MediaItem, TimelineEvent } from '@/domain/property';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const richReviews: ReviewView[] = [
  {
    id: 'r1', authorPseudonym: 'nightowl_tenant', trustTier: 'verified_resident',
    tenureLabel: 'Resident 2023–2024', createdAt: daysAgo(40), lifeStage: 'deposit',
    title: 'Charged $1,900 of my $2,400 deposit for "cleaning"', hasVideo: true,
    body: 'Left the unit spotless, filmed it on move-out. Still got hit with vague charges.',
    ratings: { depositReturn: 1, management: 2, value: 2 },
  },
  {
    id: 'r2', authorPseudonym: 'maria_h', trustTier: 'verified_resident',
    tenureLabel: 'Resident 2022–2024', createdAt: daysAgo(120), lifeStage: 'maintenance',
    title: 'Two weeks for a leaking ceiling', hasVideo: true,
    body: 'Maintenance requests pile up. Nice building, slow response.',
    ratings: { maintenance: 2, management: 2, safety: 3, noise: 3, amenities: 4 },
  },
  {
    id: 'r3', authorPseudonym: 'dtla_dan', trustTier: 'likely_resident',
    tenureLabel: 'Resident 2024', createdAt: daysAgo(15), lifeStage: 'moveIn',
    title: 'Smooth move-in, gorgeous amenities', hasVideo: false,
    body: 'Pool and gym are genuinely great. Move-in was easy.',
    ratings: { moveIn: 5, amenities: 5, parking: 3, value: 3 },
  },
  {
    id: 'r4', authorPseudonym: 'quiet_please', trustTier: 'verified_resident',
    tenureLabel: 'Resident 2023–2024', createdAt: daysAgo(70), lifeStage: 'living',
    title: 'Thin walls, loud hallways', hasVideo: false,
    ratings: { noise: 2, safety: 3, management: 2, value: 2 },
  },
  {
    id: 'r5', authorPseudonym: 'ex_resident_88', trustTier: 'verified_resident',
    tenureLabel: 'Resident 2021–2023', createdAt: daysAgo(400), lifeStage: 'moveOut',
    title: 'Was great before the 2024 management change', hasVideo: true,
    body: 'Honestly loved it under the old team. Went downhill after the handover.',
    ratings: { management: 4, maintenance: 4, value: 4, moveOut: 3 },
  },
];

const richMedia: MediaItem[] = [
  { id: 'm1', source: 'resident', title: 'Move-out deposit dispute walkthrough', city: 'Los Angeles, CA', verified: true, isPositive: false },
  { id: 'm2', source: 'resident', title: 'Ceiling leak — 2 weeks unfixed', city: 'Los Angeles, CA', verified: true, isPositive: false },
  { id: 'm3', source: 'resident', title: 'The pool & gym are unreal', city: 'Los Angeles, CA', isPositive: true },
  { id: 'm4', source: 'official', title: 'Official amenity tour', city: 'Los Angeles, CA' },
  { id: 'm5', source: 'official', title: 'Renovated 2BR walkthrough', city: 'Los Angeles, CA' },
];

const richTimeline: TimelineEvent[] = [
  { id: 't1', date: '2021', kind: 'note', label: 'Building opens under original management' },
  { id: 't2', date: '2024-02', kind: 'management_change', label: 'Management company changed' },
  { id: 't3', date: '2024-06', kind: 'score_change', label: 'Truth Score fell after management change', delta: -12 },
];

export const FIXTURE_PROPERTIES: PropertyView[] = [
  {
    id: 'avalon-hollywood',
    name: 'Avalon Hollywood',
    addressLine1: '1600 Vine St',
    city: 'Los Angeles',
    state: 'CA',
    propertyClass: 'large_community',
    unitsCount: 371,
    claimedByManager: false,
    reviews: richReviews,
    media: richMedia,
    timeline: richTimeline,
  },
  {
    id: 'the-quarry-sparse',
    name: 'The Quarry Apartments',
    addressLine1: '210 Mill Rd',
    city: 'Austin',
    state: 'TX',
    propertyClass: 'midsize',
    unitsCount: 140,
    claimedByManager: true,
    reviews: [
      {
        id: 's1', authorPseudonym: 'first_voice', trustTier: 'likely_resident',
        tenureLabel: 'Resident 2024', createdAt: daysAgo(10), lifeStage: 'moveIn',
        title: 'Good so far — quiet and clean', hasVideo: false,
        ratings: { moveIn: 4, noise: 4, safety: 4 },
      },
    ],
    media: [],
    timeline: [],
  },
  {
    id: 'willow-creek-empty',
    name: 'Willow Creek',
    addressLine1: '88 Creekside Dr',
    city: 'Columbus',
    state: 'OH',
    propertyClass: 'small_multifamily',
    unitsCount: 24,
    claimedByManager: false,
    reviews: [],
    media: [],
    timeline: [],
  },
];

export function findFixture(id: string): PropertyView | null {
  return FIXTURE_PROPERTIES.find((p) => p.id === id) ?? FIXTURE_PROPERTIES[0] ?? null;
}
