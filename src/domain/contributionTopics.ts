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
  'unit-tour': {
    key: 'unit-tour', label: 'Inside my unit', audience: 'resident',
    tags: ['tour', 'unit', 'video-tour'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Real 1-bed — light, storage, layout',
    hint: 'Room-by-room tour: kitchen, bath, closets, windows, storage.',
  },
  'amenities-real': {
    key: 'amenities-real', label: 'Amenities in real life', audience: 'resident',
    tags: ['amenities', 'real-use'], lifeStage: 'living',
    titlePlaceholder: 'e.g. The gym at 6pm, not in the brochure',
    hint: 'Gym, pool, lounge, coworking, rooftop — how they actually get used.',
  },
  'noise': {
    key: 'noise', label: 'Noise & neighbors', audience: 'resident',
    tags: ['noise', 'neighbors', 'walls'], lifeStage: 'living',
    titlePlaceholder: 'e.g. What you actually hear through the walls',
    hint: 'Walls, floors, hallways, street noise, upstairs footsteps.',
  },
  'safety': {
    key: 'safety', label: 'Safety & security', audience: 'resident',
    tags: ['safety', 'security', 'access'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Walking home at night and getting into the building',
    hint: 'Lobby access, cameras, lighting, walk home, package theft.',
  },
  'pests': {
    key: 'pests', label: 'Pests & bugs', audience: 'resident',
    tags: ['pests', 'roaches', 'mice'], lifeStage: 'living',
    titlePlaceholder: 'e.g. What showed up in my kitchen after move-in',
    hint: 'Roaches, mice, bedbugs, ants — and how management responded.',
  },
  'hvac': {
    key: 'hvac', label: 'Heat, AC & utilities', audience: 'resident',
    tags: ['hvac', 'utilities', 'heating', 'cooling'], lifeStage: 'living',
    titlePlaceholder: 'e.g. First winter here — did the heat actually work?',
    hint: 'Heating, cooling, water pressure, hot water, utility bills.',
  },
  'wifi-signal': {
    key: 'wifi-signal', label: 'Wifi & cell signal', audience: 'resident',
    tags: ['wifi', 'internet', 'cell-signal'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Which provider actually works in this building',
    hint: 'Internet options, speeds, cell reception, dead spots.',
  },
  'parking': {
    key: 'parking', label: 'Parking & garage', audience: 'resident',
    tags: ['parking', 'garage', 'guest-parking'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Parking price, guest rules, EV charging',
    hint: 'Assigned spots, guest access, EV charging, garage condition.',
  },
  'pets': {
    key: 'pets', label: 'Pet-friendly reality', audience: 'resident',
    tags: ['pets', 'dogs', 'pet-fees'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Living here with a big dog — the real deal',
    hint: 'Pet fees, breed rules, pet relief, elevator etiquette, dog park.',
  },
  'packages': {
    key: 'packages', label: 'Packages & mail', audience: 'resident',
    tags: ['packages', 'mail', 'delivery'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Where packages actually end up',
    hint: 'Package room, lockers, theft, mail delivery, food delivery access.',
  },
  'laundry': {
    key: 'laundry', label: 'Laundry situation', audience: 'resident',
    tags: ['laundry', 'in-unit', 'shared'], lifeStage: 'living',
    titlePlaceholder: 'e.g. In-unit vs shared — what it costs and how it works',
    hint: 'In-unit, hallway, basement, cost per load, reliability.',
  },
  'move-in-day': {
    key: 'move-in-day', label: 'Move-in day', audience: 'resident',
    tags: ['move-in', 'day-one'], lifeStage: 'moveIn',
    titlePlaceholder: 'e.g. What move-in day was actually like',
    hint: 'Keys, elevators, loading dock, walkthrough, first-day surprises.',
  },
  'move-out': {
    key: 'move-out', label: 'Move-out story', audience: 'resident',
    tags: ['move-out', 'cleaning'], lifeStage: 'moveOut',
    titlePlaceholder: 'e.g. What move-out really cost me',
    hint: 'Notice, cleaning, walkthrough, damage claims, timing.',
  },
  'deposit-return': {
    key: 'deposit-return', label: 'Deposit return', audience: 'resident',
    tags: ['deposit', 'fees', 'move-out'], lifeStage: 'deposit',
    titlePlaceholder: 'e.g. What they charged and what I got back',
    hint: 'What was withheld, itemization, timeline, disputes.',
  },
  'renewal-negotiation': {
    key: 'renewal-negotiation', label: 'Renewal & negotiation', audience: 'resident',
    tags: ['renewal', 'negotiation', 'pricing'], lifeStage: 'living',
    titlePlaceholder: 'e.g. How I negotiated my renewal rent down',
    hint: 'Renewal offers, concessions, what worked when negotiating.',
  },
  'red-flags': {
    key: 'red-flags', label: 'Red flags on tour', audience: 'resident',
    tags: ['tour', 'red-flags', 'warning'], lifeStage: 'moveIn',
    titlePlaceholder: 'e.g. Things I wish I noticed on my tour',
    hint: 'What to look for before signing — the stuff tours skip.',
  },
  'day-in-life': {
    key: 'day-in-life', label: 'Day in the life', audience: 'resident',
    tags: ['lifestyle', 'day-in-life'], lifeStage: 'living',
    titlePlaceholder: 'e.g. A weekday morning at my building',
    hint: 'Commute, coffee, workout, work-from-home, evening — real life here.',
  },
  'commute': {
    key: 'commute', label: 'Commute & transit', audience: 'resident',
    tags: ['commute', 'transit', 'walkability'], lifeStage: 'living',
    titlePlaceholder: 'e.g. My commute from door to desk',
    hint: 'Walk to transit, drive time, bike routes, rideshare access.',
  },
  'families-schools': {
    key: 'families-schools', label: 'Families & schools', audience: 'resident',
    tags: ['families', 'kids', 'schools'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Living here with kids — the honest take',
    hint: 'Schools, parks, stroller access, kid-friendly amenities, noise.',
  },
  'wfh-setup': {
    key: 'wfh-setup', label: 'Work-from-home', audience: 'resident',
    tags: ['wfh', 'coworking', 'wifi'], lifeStage: 'living',
    titlePlaceholder: 'e.g. WFH here — coworking, wifi, quiet',
    hint: 'Home office space, coworking lounge, wifi reliability, noise.',
  },
  'accessibility': {
    key: 'accessibility', label: 'Accessibility', audience: 'resident',
    tags: ['accessibility', 'ada', 'elevator'], lifeStage: 'living',
    titlePlaceholder: 'e.g. What accessibility here is really like',
    hint: 'Elevators, ramps, doorways, bath access, ADA units.',
  },
  'staff-shoutout': {
    key: 'staff-shoutout', label: 'Staff shoutout', audience: 'resident',
    tags: ['staff', 'positive', 'recognition'], lifeStage: 'living',
    titlePlaceholder: 'e.g. The maintenance tech who saved my week',
    hint: 'Recognize a team member who made your experience better.',
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
  'floorplans': {
    key: 'floorplans', label: 'Floorplan walkthrough', audience: 'manager',
    tags: ['official', 'floorplans'], lifeStage: 'living',
    titlePlaceholder: 'e.g. All available floorplans in one video',
    hint: 'Studio through 3-bed — layout, sqft, price ranges.',
  },
  'model-unit': {
    key: 'model-unit', label: 'Model unit', audience: 'manager',
    tags: ['official', 'model-unit'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Fully staged model — what renters see first',
    hint: 'The staged model — finishes, appliances, closet space.',
  },
  'staff-intro': {
    key: 'staff-intro', label: 'Meet the team', audience: 'manager',
    tags: ['official', 'team', 'staff'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Meet your leasing and maintenance team',
    hint: 'Faces behind the front desk — leasing, maintenance, concierge.',
  },
  'resident-testimonial': {
    key: 'resident-testimonial', label: 'Resident testimonial', audience: 'manager',
    tags: ['official', 'testimonial'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Why a real resident chose to renew',
    hint: 'Short, on-camera resident story (with their permission).',
  },
  'events': {
    key: 'events', label: 'Community events', audience: 'manager',
    tags: ['official', 'events', 'community'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Rooftop happy hour — monthly resident event',
    hint: 'Resident events, holiday parties, fitness classes, community perks.',
  },
  'pet-friendly': {
    key: 'pet-friendly', label: 'Pet-friendly features', audience: 'manager',
    tags: ['official', 'pets'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Pet spa, dog run, and pet policy',
    hint: 'Pet policy, dog run, pet spa, waste stations, fees.',
  },
  'sustainability': {
    key: 'sustainability', label: 'Sustainability & tech', audience: 'manager',
    tags: ['official', 'sustainability', 'smart-home'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Smart thermostats, EV chargers, LEED features',
    hint: 'Energy, smart-home features, EV chargers, recycling, certifications.',
  },
  'safety-features': {
    key: 'safety-features', label: 'Safety & security', audience: 'manager',
    tags: ['official', 'safety', 'security'], lifeStage: 'living',
    titlePlaceholder: 'e.g. 24/7 access, cameras, secure package room',
    hint: 'Access control, cameras, on-site security, package room.',
  },
  'incentives': {
    key: 'incentives', label: 'Current specials', audience: 'manager',
    tags: ['official', 'specials', 'incentives'], lifeStage: 'moveIn',
    titlePlaceholder: 'e.g. This month — 6 weeks free on select units',
    hint: 'Concessions, promotions, move-in specials, referral bonuses.',
  },
  'faq': {
    key: 'faq', label: 'Renter FAQ', audience: 'manager',
    tags: ['official', 'faq'], lifeStage: 'moveIn',
    titlePlaceholder: 'e.g. Top 5 questions we get on every tour',
    hint: 'Answer the questions every prospect asks — on camera.',
  },
  'renovation-update': {
    key: 'renovation-update', label: 'Renovation updates', audience: 'manager',
    tags: ['official', 'renovation', 'updates'], lifeStage: 'living',
    titlePlaceholder: 'e.g. Renovated lobby — before & after',
    hint: 'Show recent upgrades: lobby, gym, hallways, units.',
  },
};

export function getContributionTopic(key: string | null | undefined): ContributionTopic | null {
  if (!key) return null;
  return CONTRIBUTION_TOPICS[key] ?? null;
}