// Official-channel discovery — finds a property's own public presence
// (website, socials, Google Business, virtual tours) and scores ownership
// confidence. Interface-driven: a deterministic MOCK produces plausible
// candidates offline; a real provider (search API + domain/name matching +
// verified-badge signals) plugs in behind the same interface.

import type { ChannelKind } from '@/domain/property';
import { getEnv } from '../env';

export interface DiscoveryInput {
  name: string;
  city?: string | null;
  state?: string | null;
}

export interface DiscoveredChannel {
  kind: ChannelKind;
  url: string;
  embedUrl?: string;
  confidence: number; // 0..1 ownership confidence
  method: string;     // how it was found (for auditing)
}

export interface ChannelDiscoveryProvider {
  readonly name: string;
  discover(input: DiscoveryInput): Promise<DiscoveredChannel[]>;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Deterministic mock: generates plausible candidate channels + confidences so
// the seeding pipeline and prioritization can run with no external API.
export class MockChannelDiscovery implements ChannelDiscoveryProvider {
  readonly name = 'mock';
  async discover(input: DiscoveryInput): Promise<DiscoveredChannel[]> {
    const s = slug(input.name);
    if (!s) return [];
    return [
      { kind: 'website', url: `https://www.${s}.com`, confidence: 0.7, method: 'domain-name-match' },
      { kind: 'instagram', url: `https://instagram.com/${s}`, confidence: 0.6, method: 'handle-name-match' },
      { kind: 'youtube', url: `https://youtube.com/@${s}`, confidence: 0.45, method: 'handle-name-match' },
      { kind: 'facebook', url: `https://facebook.com/${s}`, confidence: 0.5, method: 'handle-name-match' },
    ];
  }
}

// Real provider (search API). Stub until a key is configured; documented.
export class SearchChannelDiscovery implements ChannelDiscoveryProvider {
  readonly name = 'search';
  constructor(private apiKey: string) {}
  async discover(_input: DiscoveryInput): Promise<DiscoveredChannel[]> {
    // TODO: query a search API, match domain/handle against name+city+state,
    // boost verified badges & Google Business match. Returns [] until wired.
    void this.apiKey;
    return [];
  }
}

let cached: ChannelDiscoveryProvider | null = null;

export function getChannelDiscoveryProvider(): ChannelDiscoveryProvider {
  if (cached) return cached;
  const key = getEnv('SEARCH_API_KEY');
  cached = key ? new SearchChannelDiscovery(key) : new MockChannelDiscovery();
  return cached;
}

export function __setChannelDiscoveryProvider(p: ChannelDiscoveryProvider | null): void {
  cached = p;
}

// Confidence threshold above which a discovered channel is auto-attached as
// "Official · Public"; below it, queued for human review.
export const AUTO_ATTACH_CONFIDENCE = 0.6;
