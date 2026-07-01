import { describe, it, expect } from 'vitest';
import { computeTruthScore, scoreBand, type ReviewSignal } from './truthScore';

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();
const r = (ratings: ReviewSignal['ratings'], trustTier: ReviewSignal['trustTier'], ageDays = 5, hasVideo = false): ReviewSignal =>
  ({ ratings, trustTier, createdAt: daysAgo(ageDays), hasVideo });

describe('computeTruthScore', () => {
  it('gates empty input (null score, insufficient)', () => {
    const res = computeTruthScore([], now);
    expect(res.score).toBeNull();
    expect(res.confidence).toBe('insufficient');
  });

  it('gates a single unverified review', () => {
    const res = computeTruthScore([r({ management: 5, value: 5 }, 'unverified')], now);
    expect(res.score).toBeNull();
  });

  it('produces a high, established score for several recent verified positives', () => {
    const res = computeTruthScore([
      r({ management: 5, maintenance: 5, safety: 5, value: 5 }, 'verified_resident'),
      r({ management: 4, maintenance: 5, safety: 4, value: 5 }, 'verified_resident'),
      r({ management: 5, maintenance: 4, safety: 5, value: 4 }, 'verified_resident'),
    ], now);
    expect(res.confidence).toBe('established');
    expect(res.score!).toBeGreaterThanOrEqual(80);
  });

  it('resists astroturfing (many unverified 5s cannot beat verified 1s)', () => {
    const unverified5s = Array.from({ length: 25 }, () => r({ management: 5, value: 5 }, 'unverified'));
    const verified1s = Array.from({ length: 4 }, () => r({ management: 1, value: 1 }, 'verified_resident'));
    const res = computeTruthScore([...unverified5s, ...verified1s], now);
    expect(res.score!).toBeLessThan(75);
  });

  it('weights recent negatives over old positives', () => {
    const oldPos = Array.from({ length: 4 }, () => r({ management: 5, value: 5 }, 'verified_resident', 1200));
    const recentNeg = Array.from({ length: 4 }, () => r({ management: 1, value: 1 }, 'verified_resident', 10));
    const res = computeTruthScore([...oldPos, ...recentNeg], now);
    expect(res.score!).toBeLessThan(55);
  });

  it('counts verified residents, videos, reviews', () => {
    const res = computeTruthScore([
      r({ safety: 4 }, 'verified_resident', 5, true),
      r({ safety: 3 }, 'likely_resident', 5, false),
    ], now);
    expect(res.verifiedResidentCount).toBe(1);
    expect(res.videoCount).toBe(1);
    expect(res.reviewCount).toBe(2);
  });

  it('scoreBand thresholds', () => {
    expect(scoreBand(30)).toBe('poor');
    expect(scoreBand(50)).toBe('mixed');
    expect(scoreBand(70)).toBe('good');
    expect(scoreBand(90)).toBe('excellent');
  });
});
