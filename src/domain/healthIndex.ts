// Property Health Index — the TRAJECTORY (leading indicator), distinct from the
// Truth Score (reputation, lagging). Answers "is this place getting better or
// worse?" by comparing recent vs older resident experience. The divergence
// between a high Truth Score and a declining Health Index is the killer signal.

import type { ReviewSignal, CategoryKey } from './truthScore';

export type HealthTrend = 'improving' | 'stable' | 'declining' | 'new' | 'insufficient';

export interface HealthSignal { label: string; direction: 'up' | 'down' }

export interface HealthResult {
  trend: HealthTrend;
  delta: number | null;       // recent minus older, on a 0..100 scale
  recentScore: number | null; // 0..100
  olderScore: number | null;  // 0..100
  signals: HealthSignal[];
}

const RECENT_WINDOW_DAYS = 270; // ~9 months
const TRUST_WEIGHT: Record<string, number> = { verified_resident: 3, likely_resident: 1.5, unverified: 0.5 };
const WATCH: CategoryKey[] = ['maintenance', 'management', 'depositReturn', 'safety', 'noise', 'value'];

function meanScore(reviews: ReviewSignal[]): { score: number | null; weight: number; perCat: Partial<Record<CategoryKey, number>> } {
  let wSum = 0, wScore = 0;
  const catW: Partial<Record<CategoryKey, number>> = {};
  const catWS: Partial<Record<CategoryKey, number>> = {};
  for (const r of reviews) {
    const w = TRUST_WEIGHT[r.trustTier] ?? 0.5;
    for (const [k, v] of Object.entries(r.ratings)) {
      if (v == null) continue;
      wSum += w; wScore += w * v;
      const key = k as CategoryKey;
      catW[key] = (catW[key] ?? 0) + w;
      catWS[key] = (catWS[key] ?? 0) + w * v;
    }
  }
  const perCat: Partial<Record<CategoryKey, number>> = {};
  for (const k of Object.keys(catW) as CategoryKey[]) perCat[k] = (catWS[k]! / catW[k]!);
  return { score: wSum > 0 ? (wScore / wSum) * 20 : null, weight: wSum, perCat };
}

export function computeHealth(reviews: ReviewSignal[], now: number = Date.now()): HealthResult {
  const cutoff = now - RECENT_WINDOW_DAYS * 86_400_000;
  const recent = reviews.filter((r) => new Date(r.createdAt).getTime() >= cutoff);
  const older = reviews.filter((r) => new Date(r.createdAt).getTime() < cutoff);

  const rec = meanScore(recent);
  const old = meanScore(older);

  if (rec.weight < 1 && old.weight < 1) return { trend: 'insufficient', delta: null, recentScore: null, olderScore: null, signals: [] };
  if (old.weight < 1) return { trend: 'new', delta: null, recentScore: rec.score, olderScore: null, signals: [] };
  if (rec.weight < 1) return { trend: 'insufficient', delta: null, recentScore: null, olderScore: old.score, signals: [] };

  const delta = Math.round((rec.score! - old.score!));
  const trend: HealthTrend = delta > 5 ? 'improving' : delta < -5 ? 'declining' : 'stable';

  // Category-level signals (which specific things moved).
  const signals: HealthSignal[] = [];
  for (const cat of WATCH) {
    const rv = rec.perCat[cat]; const ov = old.perCat[cat];
    if (rv == null || ov == null) continue;
    const d = rv - ov;
    if (Math.abs(d) >= 0.6) signals.push({ label: CAT_LABEL[cat], direction: d > 0 ? 'up' : 'down' });
  }
  return { trend, delta, recentScore: rec.score, olderScore: old.score, signals: signals.slice(0, 4) };
}

const CAT_LABEL: Record<CategoryKey, string> = {
  management: 'Management', maintenance: 'Maintenance', noise: 'Noise', safety: 'Safety',
  parking: 'Parking', amenities: 'Amenities', moveIn: 'Move-in', moveOut: 'Move-out',
  depositReturn: 'Deposit return', value: 'Value',
};

export function healthLabel(trend: HealthTrend): string {
  switch (trend) {
    case 'improving': return 'Improving';
    case 'declining': return 'Declining';
    case 'stable': return 'Stable';
    case 'new': return 'Newly rated';
    default: return 'Not enough history';
  }
}
