// Content moderation provider abstraction. FAIL-CLOSED by contract:
// on any uncertainty the result is not approved (held for review).

import { getEnv } from '../env';

export interface ModerationResult {
  approved: boolean;
  score: number; // 0 safe .. 1 toxic
  flags: string[];
  reason?: string;
}

export interface ModerationProvider {
  readonly name: string;
  moderate(text: string): Promise<ModerationResult>;
}

const BLOCKLIST = [
  'kill', 'rape', 'nigger', 'faggot', 'terrorist attack',
];

// Offline heuristic moderator: safe default for development. Conservative and
// fail-closed — unknown/empty input is held rather than approved.
export class MockModerationProvider implements ModerationProvider {
  readonly name = 'mock';
  async moderate(text: string): Promise<ModerationResult> {
    if (!text || !text.trim()) {
      return { approved: false, score: 1, flags: ['empty'], reason: 'Empty content' };
    }
    const lower = text.toLowerCase();
    const hits = BLOCKLIST.filter((w) => lower.includes(w));
    if (hits.length > 0) {
      return { approved: false, score: 0.95, flags: hits, reason: 'Blocklisted terms' };
    }
    return { approved: true, score: 0.05, flags: [] };
  }
}

// Real provider (Lovable AI gateway / Gemini). Fail-closed on any error.
export class LovableModerationProvider implements ModerationProvider {
  readonly name = 'lovable';
  constructor(private apiKey: string) {}

  async moderate(text: string): Promise<ModerationResult> {
    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Moderate apartment-review content. Return toxicity_score (0-1), flags[], approved.' },
            { role: 'user', content: text },
          ],
        }),
      });
      if (!res.ok) {
        return { approved: false, score: 1, flags: ['moderation_error'], reason: 'Service error' };
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      return {
        approved: !!parsed.approved && parsed.toxicity_score <= 0.7,
        score: parsed.toxicity_score ?? 1,
        flags: parsed.flags ?? [],
        reason: parsed.reason,
      };
    } catch {
      return { approved: false, score: 1, flags: ['moderation_exception'], reason: 'Exception' };
    }
  }
}

let cached: ModerationProvider | null = null;

export function getModerationProvider(): ModerationProvider {
  if (cached) return cached;
  const key = getEnv('LOVABLE_API_KEY');
  cached = key ? new LovableModerationProvider(key) : new MockModerationProvider();
  return cached;
}

export function __setModerationProvider(p: ModerationProvider | null): void {
  cached = p;
}
