// Social source providers — discover a connected channel's recent content.
//
// Interface-driven & mock-safe: mock providers return deterministic content so
// the connect→discover→preview→approve→sync flow works with no OAuth apps. Real
// providers (Meta Graph, TikTok, YouTube Data API) plug in behind the same
// interface once app approvals + tokens exist (server-side, tokens in Vault).

import { parseEmbed } from './embed';

export type SourceKind = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'website' | 'matterport';

export interface SyncedItem {
  externalId: string;
  kind: SourceKind;
  title: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  permalink: string;   // attribution/source link
  publishedAt: string;
}

export interface SocialSourceProvider {
  readonly kind: SourceKind;
  readonly name: string;
  listRecent(handle: string): Promise<SyncedItem[]>;
}

function iso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString();
}

// Deterministic mock content per platform.
class MockYouTube implements SocialSourceProvider {
  readonly kind = 'youtube' as const; readonly name = 'youtube-mock';
  async listRecent(handle: string): Promise<SyncedItem[]> {
    return [
      { externalId: `${handle}-yt1`, kind: 'youtube', title: 'Official amenities tour', permalink: `https://youtube.com/watch?v=aqz-KE-bpKQ`, embedUrl: 'https://www.youtube.com/embed/aqz-KE-bpKQ', publishedAt: iso(6) },
      { externalId: `${handle}-yt2`, kind: 'youtube', title: 'Renovated 2BR walkthrough', permalink: `https://youtube.com/watch?v=aqz-KE-bpKQ`, embedUrl: 'https://www.youtube.com/embed/aqz-KE-bpKQ', publishedAt: iso(20) },
    ];
  }
}

class MockInstagram implements SocialSourceProvider {
  readonly kind = 'instagram' as const; readonly name = 'instagram-mock';
  async listRecent(handle: string): Promise<SyncedItem[]> {
    const url = `https://instagram.com/reel/ABC123${handle.slice(0, 3)}`;
    const p = parseEmbed(url);
    return [{ externalId: `${handle}-ig1`, kind: 'instagram', title: 'Resident event recap', permalink: url, embedUrl: p?.embedUrl, publishedAt: iso(3) }];
  }
}

class MockTikTok implements SocialSourceProvider {
  readonly kind = 'tiktok' as const; readonly name = 'tiktok-mock';
  async listRecent(handle: string): Promise<SyncedItem[]> {
    const url = `https://www.tiktok.com/@${handle}/video/7300000000000000000`;
    const p = parseEmbed(url);
    return [{ externalId: `${handle}-tt1`, kind: 'tiktok', title: 'Pool day at the community', permalink: url, embedUrl: p?.embedUrl, publishedAt: iso(1) }];
  }
}

class MockGeneric implements SocialSourceProvider {
  constructor(public readonly kind: SourceKind) {}
  readonly name = 'generic-mock';
  async listRecent(handle: string): Promise<SyncedItem[]> {
    return [{ externalId: `${handle}-g1`, kind: this.kind, title: `New ${this.kind} content`, permalink: handle.startsWith('http') ? handle : `https://${handle}`, publishedAt: iso(2) }];
  }
}

export function getSourceProvider(kind: SourceKind): SocialSourceProvider {
  switch (kind) {
    case 'youtube': return new MockYouTube();
    case 'instagram': return new MockInstagram();
    case 'tiktok': return new MockTikTok();
    default: return new MockGeneric(kind);
  }
}
