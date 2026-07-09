// Shared category catalog for curated (seeded) videos. The slug is stored
// in `seeded_videos.hashtags[0]` as `cat:<slug>` so we can filter in SQL
// without a schema change, and mapped to a FEED_CATEGORIES value for the
// entertainment feed.

import type { FeedCategory } from '@/domain/property';

export interface CuratedCategory {
  slug: string;
  label: string;
  hint: string;
  feedCategory: FeedCategory;
  suggestedQueries: string[];
}

export const CURATED_CATEGORIES: CuratedCategory[] = [
  {
    slug: 'maintenance',
    label: 'Maintenance nightmares',
    hint: 'Real repair horror stories, leaks, mold, AC failures.',
    feedCategory: 'Maintenance issues',
    suggestedQueries: [
      'apartment maintenance nightmare',
      'apartment mold problem',
      'apartment ceiling leak story',
      'bad landlord maintenance',
    ],
  },
  {
    slug: 'application',
    label: 'Application & lease drama',
    hint: 'Screening, deposits, hidden fees, denial stories.',
    feedCategory: 'Deposit disputes',
    suggestedQueries: [
      'apartment application fees hidden',
      'apartment security deposit scam',
      'apartment lease surprise fees',
      'apartment denied application story',
    ],
  },
  {
    slug: 'local-vibe',
    label: 'Local area vibe',
    hint: 'Neighborhood walks, safety, transit, coffee/bars.',
    feedCategory: 'Renter tips',
    suggestedQueries: [
      'brooklyn apartment neighborhood walk',
      'best apartment neighborhoods nyc',
      'apartment neighborhood safety review',
      'downtown la apartment area vibe',
    ],
  },
  {
    slug: 'amenities',
    label: 'Amenities — the real story',
    hint: 'Gym, pool, coworking, lounge — real footage.',
    feedCategory: 'Property tours',
    suggestedQueries: [
      'luxury apartment amenities tour',
      'apartment gym pool tour',
      'apartment rooftop amenity',
      'apartment coworking lounge tour',
    ],
  },
  {
    slug: 'tours',
    label: 'Property tours',
    hint: 'Full building & unit tours from real renters and pros.',
    feedCategory: 'Property tours',
    suggestedQueries: [
      'nyc apartment tour',
      'la luxury apartment tour',
      'chicago high rise apartment tour',
      'apartment tour before signing',
    ],
  },
  {
    slug: 'design-tips',
    label: 'Design & decor tips',
    hint: 'Small-space design, IKEA hacks, rental-friendly upgrades.',
    feedCategory: 'Renter tips',
    suggestedQueries: [
      'small apartment design tips',
      'rental apartment decor ideas',
      'ikea apartment hacks',
      'studio apartment makeover',
    ],
  },
  {
    slug: 'leasing-gurus',
    label: 'Leasing gurus & tips',
    hint: 'Renter influencers, negotiation, red flags before signing.',
    feedCategory: 'Renter tips',
    suggestedQueries: [
      'apartment leasing agent tips',
      'how to negotiate rent',
      'apartment red flags before signing',
      'renters rights explained',
    ],
  },
  {
    slug: 'reviews',
    label: 'Real renter reviews',
    hint: 'Honest apartment reviews from real tenants.',
    feedCategory: 'Resident warnings',
    suggestedQueries: [
      'honest apartment review',
      'moving out apartment review',
      'worst apartment i lived in',
      'apartment complex review',
    ],
  },
  {
    slug: 'viral-hits',
    label: '🔥 Viral apartment hits',
    hint: 'Big-view apartment videos exploding on YouTube right now.',
    feedCategory: 'Property tours',
    suggestedQueries: [
      'apartment tour viral',
      'insane apartment tour',
      'craziest apartment i ever toured',
      'apartment tour gone viral',
      'you won\'t believe this apartment',
    ],
  },
  {
    slug: 'funny-fails',
    label: '😂 Funny apartment fails',
    hint: 'Comedy sketches, apartment fails, tenant vs landlord bits.',
    feedCategory: 'Renter tips',
    suggestedQueries: [
      'apartment fails compilation',
      'funny apartment tour',
      'landlord vs tenant comedy',
      'apartment hunting comedy sketch',
      'roommate fails funny',
    ],
  },
  {
    slug: 'hot-takes',
    label: '🌶️ Hot takes & rants',
    hint: 'Renter rants, angry tenant stories, spicy landlord call-outs.',
    feedCategory: 'Resident warnings',
    suggestedQueries: [
      'apartment rant',
      'never rent here rant',
      'angry tenant story',
      'slumlord expose',
      'renting horror story',
    ],
  },
  {
    slug: 'tiktok-famous',
    label: '📱 TikTok-famous buildings',
    hint: 'Buildings that blew up on social — the ones everyone is talking about.',
    feedCategory: 'Property tours',
    suggestedQueries: [
      'famous apartment building tiktok',
      'viral luxury apartment nyc',
      'famous la apartment building',
      'tiktok famous apartment tour',
    ],
  },
];

export function categoryBySlug(slug: string): CuratedCategory | undefined {
  return CURATED_CATEGORIES.find((c) => c.slug === slug);
}

export function feedCategoryForSlug(slug: string): FeedCategory {
  return categoryBySlug(slug)?.feedCategory ?? 'Renter tips';
}
