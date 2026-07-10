import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { parseVideoMeta } from '@/lib/videoMeta';

export type TrendingVideo = {
  id: string;
  youtubeId: string | null;
  title: string;
  thumbnail: string;
  channel: string;
  city: string | null;
  views: number;
  category: string;
  summary: string | null;
  angle: string | null;
};

// Slugs of the viral / funny / hot-take curated categories. Anything tagged
// `cat:<slug>` on a seeded video shows up in the trending rail.
export const VIRAL_CATEGORY_SLUGS = [
  // Current import slugs
  'viral-hits',
  'funny-fails',
  'hot-takes',
  'tiktok-famous',
  // Older admin slugs kept for already-approved rows
  'viral-apartment-hits',
  'funny-apartment-fails',
  'hot-takes-rants',
  'tiktok-famous-buildings',
];

function extractYouTubeId(embedUrl: string, hashtags: string[] | null): string | null {
  const yt = (hashtags ?? []).find((t) => typeof t === 'string' && t.startsWith('yt:'));
  if (yt) return yt.slice(3);
  const m = embedUrl?.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function parseViews(caption: string | null): number {
  if (!caption) return 0;
  // Caption often looks like "ChannelName · 1.2M views" — pull the number.
  const m = caption.match(/([\d.,]+)\s*([KMB]?)\s*views?/i);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/,/g, ''));
  const mult = m[2] === 'B' ? 1e9 : m[2] === 'M' ? 1e6 : m[2] === 'K' ? 1e3 : 1;
  return Math.round(n * mult);
}

type Options = { limit?: number; nearCity?: string | null };

/**
 * Approved YouTube seeded videos tagged with one of the viral categories.
 * Sorted by parsed view count (biggest first). Anon-safe; RLS lets everyone
 * SELECT approved rows on `seeded_videos`.
 */
export function useTrendingVideos({ limit = 12, nearCity = null }: Options = {}) {
  const [videos, setVideos] = useState<TrendingVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let q = supabase
          .from('seeded_videos')
          .select('id, title, embed_url, hashtags, city, caption')
          .eq('moderation_status', 'approved')
          .eq('source', 'youtube')
          .order('created_at', { ascending: false })
          .limit(200);
        if (nearCity) q = q.ilike('city', `%${nearCity}%`);
        const { data, error } = await q;
        if (error) throw error;
        if (cancelled) return;

        const tagSet = new Set(VIRAL_CATEGORY_SLUGS.map((s) => `cat:${s}`));
        const mapped: TrendingVideo[] = (data ?? []).flatMap((r: any) => {
          const tags: string[] = Array.isArray(r.hashtags) ? r.hashtags : [];
          // For "near me" we don't filter by category — anything in the city works.
          if (!nearCity && !tags.some((t: string) => tagSet.has(t))) return [];
          const ytId = extractYouTubeId(r.embed_url, tags);
          if (!ytId) return [];
          const catTag = tags.find((t: string) => t.startsWith('cat:'));
          const chTag = tags.find((t: string) => t.startsWith('ch:'));
          const meta = parseVideoMeta(tags, r.caption);
          return [{
            id: r.id,
            youtubeId: ytId,
            title: r.title,
            thumbnail: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
            channel: meta.channel || (chTag ? chTag.slice(3) : 'YouTube'),
            city: r.city ?? null,
            views: parseViews(r.caption),
            category: catTag ? catTag.slice(4) : 'trending',
            summary: meta.summary,
            angle: meta.angle,
          }];
        });
        mapped.sort((a, b) => b.views - a.views);
        setVideos(mapped.slice(0, limit));
      } catch {
        if (!cancelled) setVideos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [limit, nearCity]);

  return { videos, loading };
}

export function formatViews(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M views`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K views`;
  if (n > 0) return `${n} views`;
  return '';
}