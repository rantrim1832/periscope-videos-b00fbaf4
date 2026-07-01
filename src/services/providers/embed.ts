// Social embed parsing — the legal, high-density content lever.
//
// We EMBED publicly-posted social video (YouTube/TikTok/Instagram) via each
// platform's official iframe, attaching it to a canonical property. We never
// re-host bytes (that would violate copyright/ToS); embedding is ToS-compliant
// and preserves attribution to the original creator.

export type EmbedPlatform = 'youtube' | 'tiktok' | 'instagram' | 'unknown';

export interface ParsedEmbed {
  platform: EmbedPlatform;
  embedUrl: string; // iframe src
  sourceUrl: string;
}

function youtubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function tiktokId(url: string): string | null {
  const m = url.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|v\/)(\d+)/);
  return m ? m[1] : null;
}

function instagramCode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:reel|p|tv)\/([\w-]+)/);
  return m ? m[1] : null;
}

/** Parse a social URL into an embeddable iframe source, or null if unsupported. */
export function parseEmbed(rawUrl: string): ParsedEmbed | null {
  const url = rawUrl.trim();
  if (!url) return null;

  const yt = youtubeId(url);
  if (yt) return { platform: 'youtube', embedUrl: `https://www.youtube.com/embed/${yt}`, sourceUrl: url };

  const tt = tiktokId(url);
  if (tt) return { platform: 'tiktok', embedUrl: `https://www.tiktok.com/embed/v2/${tt}`, sourceUrl: url };

  const ig = instagramCode(url);
  if (ig) return { platform: 'instagram', embedUrl: `https://www.instagram.com/reel/${ig}/embed`, sourceUrl: url };

  return null;
}

export function isSupportedSocialUrl(url: string): boolean {
  return parseEmbed(url) != null;
}
