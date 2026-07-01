import { describe, it, expect } from 'vitest';
import { computeHealth } from './healthIndex';
import type { ReviewSignal } from './truthScore';

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();
const r = (val: number, ageDays: number): ReviewSignal => ({
  ratings: { management: val, maintenance: val, value: val }, trustTier: 'verified_resident', createdAt: daysAgo(ageDays),
});

describe('computeHealth', () => {
  it('insufficient when empty', () => {
    expect(computeHealth([], now).trend).toBe('insufficient');
  });

  it('new when only recent reviews', () => {
    expect(computeHealth([r(4, 10), r(4, 20)], now).trend).toBe('new');
  });

  it('declining when recent worse than older', () => {
    const res = computeHealth([r(5, 500), r(5, 450), r(1, 20), r(1, 30)], now);
    expect(res.trend).toBe('declining');
    expect(res.delta!).toBeLessThan(0);
    expect(res.signals.some((s) => s.direction === 'down')).toBe(true);
  });

  it('improving when recent better than older', () => {
    const res = computeHealth([r(1, 500), r(1, 450), r(5, 20), r(5, 30)], now);
    expect(res.trend).toBe('improving');
    expect(res.delta!).toBeGreaterThan(0);
  });

  it('stable when consistent', () => {
    const res = computeHealth([r(4, 500), r(4, 450), r(4, 20), r(4, 30)], now);
    expect(res.trend).toBe('stable');
  });
});
