// The Truth Score — the product spine.
//
// A single 0–100 verdict computed as a trust-weighted, recency-decayed,
// confidence-gated composite of category ratings. Design guarantees:
//   - a thousand fake 5-stars cannot move a trust-weighted score
//   - stale reviews fade (a building under new management isn't condemned forever)
//   - below a confidence threshold we return NULL ("Not enough data") — we NEVER
//     fabricate precision
//   - every output exposes its inputs (sample size) — transparency is the shield
//
// This is pure and deterministic so it runs identically on server, client, and
// in the comparison experience.

import type { ResidentTrustTier } from './types';

export type CategoryKey =
  | 'management'
  | 'maintenance'
  | 'noise'
  | 'safety'
  | 'parking'
  | 'amenities'
  | 'moveIn'
  | 'moveOut'
  | 'depositReturn'
  | 'value';

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  management: 'Management',
  maintenance: 'Maintenance',
  noise: 'Noise',
  safety: 'Safety',
  parking: 'Parking',
  amenities: 'Amenities',
  moveIn: 'Move-in',
  moveOut: 'Move-out',
  depositReturn: 'Deposit Return',
  value: 'Value',
};

export const CATEGORY_ORDER: CategoryKey[] = [
  'management', 'maintenance', 'depositReturn', 'safety', 'noise',
  'value', 'parking', 'amenities', 'moveIn', 'moveOut',
];

// Composite weights: what most affects a leasing decision weighs more.
const CATEGORY_WEIGHT: Record<CategoryKey, number> = {
  safety: 1.3, management: 1.3, depositReturn: 1.3, maintenance: 1.2,
  value: 1.1, noise: 1.0, moveIn: 0.9, moveOut: 0.9, parking: 0.8, amenities: 0.8,
};

// Trust weighting: verified residents dominate; anonymous barely counts.
const TRUST_WEIGHT: Record<ResidentTrustTier, number> = {
  verified_resident: 3,
  likely_resident: 1.5,
  unverified: 0.5,
};

// Recency: half-life of 18 months keeps the score current and alive.
const RECENCY_HALF_LIFE_DAYS = 548;

export interface ReviewSignal {
  ratings: Partial<Record<CategoryKey, number>>; // 1..5
  trustTier: ResidentTrustTier;
  createdAt: string; // ISO
  hasVideo?: boolean;
}

export type ConfidenceTier = 'insufficient' | 'early' | 'established';

export interface CategoryScore {
  score: number | null; // 1..5, null if no signal
  count: number; // raw contributions
}

export interface TruthScoreResult {
  score: number | null; // 0..100, null when confidence is insufficient
  confidence: ConfidenceTier;
  categories: Record<CategoryKey, CategoryScore>;
  reviewCount: number;
  verifiedResidentCount: number;
  videoCount: number;
  effectiveWeight: number; // total trust×recency weight (sample strength)
}

function recencyWeight(createdAt: string, now: number): number {
  const ageDays = Math.max(0, (now - new Date(createdAt).getTime()) / 86_400_000);
  return Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
}

const CONFIDENCE_MIN_EARLY = 2; // effective weight below this → insufficient
const CONFIDENCE_MIN_ESTABLISHED = 8;

export function computeTruthScore(
  reviews: ReviewSignal[],
  now: number = Date.now(),
): TruthScoreResult {
  const categories = {} as Record<CategoryKey, CategoryScore>;
  const acc: Record<CategoryKey, { wSum: number; wScore: number; count: number }> = {} as never;
  for (const key of CATEGORY_ORDER) {
    acc[key] = { wSum: 0, wScore: 0, count: 0 };
  }

  let effectiveWeight = 0;
  let verifiedResidentCount = 0;
  let videoCount = 0;

  for (const r of reviews) {
    const w = TRUST_WEIGHT[r.trustTier] * recencyWeight(r.createdAt, now);
    effectiveWeight += w;
    if (r.trustTier === 'verified_resident') verifiedResidentCount++;
    if (r.hasVideo) videoCount++;
    for (const key of CATEGORY_ORDER) {
      const rating = r.ratings[key];
      if (rating == null) continue;
      acc[key].wSum += w;
      acc[key].wScore += w * rating;
      acc[key].count += 1;
    }
  }

  let compositeWSum = 0;
  let compositeWScore = 0;
  for (const key of CATEGORY_ORDER) {
    const a = acc[key];
    const score = a.wSum > 0 ? a.wScore / a.wSum : null;
    categories[key] = { score: score == null ? null : round1(score), count: a.count };
    if (score != null) {
      const cw = CATEGORY_WEIGHT[key];
      compositeWSum += cw;
      compositeWScore += cw * score;
    }
  }

  const confidence: ConfidenceTier =
    effectiveWeight < CONFIDENCE_MIN_EARLY
      ? 'insufficient'
      : effectiveWeight < CONFIDENCE_MIN_ESTABLISHED
        ? 'early'
        : 'established';

  const composite5 = compositeWSum > 0 ? compositeWScore / compositeWSum : null;
  const score =
    confidence === 'insufficient' || composite5 == null
      ? null
      : Math.round(composite5 * 20); // 1..5 → 0..100

  return {
    score,
    confidence,
    categories,
    reviewCount: reviews.length,
    verifiedResidentCount,
    videoCount,
    effectiveWeight: round1(effectiveWeight),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// --- Presentation helpers (shared by gauge, report card, comparison) ---

export function scoreBand(score: number): 'poor' | 'mixed' | 'good' | 'excellent' {
  if (score < 40) return 'poor';
  if (score < 60) return 'mixed';
  if (score < 80) return 'good';
  return 'excellent';
}

export function scoreLabel(result: TruthScoreResult): string {
  if (result.score == null) {
    return result.confidence === 'insufficient' ? 'Not enough data yet' : 'Early signal';
  }
  switch (scoreBand(result.score)) {
    case 'poor': return 'Residents warn against this place';
    case 'mixed': return 'Mixed reputation';
    case 'good': return 'Generally well-regarded';
    case 'excellent': return 'Residents love it here';
  }
}

// HSL color for the gauge (red → amber → green). Never the only signal.
export function scoreColorVar(score: number | null): string {
  if (score == null) return 'hsl(var(--muted-foreground))';
  if (score < 40) return 'hsl(0 72% 51%)';
  if (score < 60) return 'hsl(38 92% 50%)';
  if (score < 80) return 'hsl(84 60% 45%)';
  return 'hsl(142 66% 42%)';
}

/** 1..5 category score → 0..100 for bar widths. */
export function categoryPct(score: number | null): number {
  return score == null ? 0 : Math.round((score / 5) * 100);
}
