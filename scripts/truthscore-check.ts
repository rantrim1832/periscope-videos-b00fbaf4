/* Self-test for the Truth Score algorithm. Run: npx tsx scripts/truthscore-check.ts */
import { computeTruthScore, type ReviewSignal } from '../src/domain/truthScore';

let failures = 0;
function assert(name: string, cond: boolean, detail = '') {
  if (cond) console.log(`  ✓ ${name}`);
  else { failures++; console.error(`  ✗ ${name} ${detail}`); }
}

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();
const r = (ratings: ReviewSignal['ratings'], trustTier: ReviewSignal['trustTier'], ageDays = 5, hasVideo = false): ReviewSignal =>
  ({ ratings, trustTier, createdAt: daysAgo(ageDays), hasVideo });

console.log('Truth Score algorithm checks:');

// 1. Empty → gated
{
  const res = computeTruthScore([], now);
  assert('empty → null score, insufficient', res.score === null && res.confidence === 'insufficient');
}

// 2. Single unverified → still insufficient (weight 0.5 < 2)
{
  const res = computeTruthScore([r({ management: 5, value: 5 }, 'unverified')], now);
  assert('single unverified → gated (null)', res.score === null, `got ${res.score}`);
}

// 3. Several recent verified positives → established, high
{
  const res = computeTruthScore([
    r({ management: 5, maintenance: 5, safety: 5, value: 5 }, 'verified_resident'),
    r({ management: 4, maintenance: 5, safety: 4, value: 5 }, 'verified_resident'),
    r({ management: 5, maintenance: 4, safety: 5, value: 4 }, 'verified_resident'),
  ], now);
  assert('verified positives → established', res.confidence === 'established', `conf=${res.confidence}`);
  assert('verified positives → high score', (res.score ?? 0) >= 80, `score=${res.score}`);
}

// 4. Anti-astroturf: many unverified 5s cannot overwhelm verified 1s
{
  const unverified5s = Array.from({ length: 25 }, () => r({ management: 5, value: 5 }, 'unverified'));
  const verified1s = Array.from({ length: 4 }, () => r({ management: 1, value: 1 }, 'verified_resident'));
  const res = computeTruthScore([...unverified5s, ...verified1s], now);
  assert('astroturf 5s do NOT yield near-perfect score', (res.score ?? 0) < 75, `score=${res.score}`);
}

// 5. Recency: recent negatives outweigh old positives
{
  const oldPos = Array.from({ length: 4 }, () => r({ management: 5, value: 5 }, 'verified_resident', 1200));
  const recentNeg = Array.from({ length: 4 }, () => r({ management: 1, value: 1 }, 'verified_resident', 10));
  const res = computeTruthScore([...oldPos, ...recentNeg], now);
  assert('recent negatives pull score below neutral', (res.score ?? 100) < 55, `score=${res.score}`);
}

// 6. Counts
{
  const res = computeTruthScore([
    r({ safety: 4 }, 'verified_resident', 5, true),
    r({ safety: 3 }, 'likely_resident', 5, false),
  ], now);
  assert('verifiedResidentCount', res.verifiedResidentCount === 1);
  assert('videoCount', res.videoCount === 1);
  assert('reviewCount', res.reviewCount === 2);
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
