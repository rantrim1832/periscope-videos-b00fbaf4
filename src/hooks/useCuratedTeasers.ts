import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CuratedTeaser = {
  id: string;              // seeded_videos.id — used to link to /watch/:id
  youtubeId: string | null;
  title: string;
  channel: string;         // maps to "property" slot on the landing card
  location: string;
  thumbnail: string;       // real YouTube thumbnail URL
  category: string;        // cat:<slug> — used to group into rails
};

function extractYouTubeId(embedUrl: string, hashtags: string[] | null): string | null {
  const yt = (hashtags ?? []).find((t) => typeof t === 'string' && t.startsWith('yt:'));
  if (yt) return yt.slice(3);
  const m = embedUrl?.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/**
 * Public fetch of approved curated videos for the landing marquee.
 * RLS on `seeded_videos` already permits anon SELECT of approved rows.
 * Returns [] until admins seed content — Landing falls back to static teasers.
 */
export function useCuratedTeasers(limit = 60) {
  const [teasers, setTeasers] = useState<CuratedTeaser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('seeded_videos')
          .select('id, title, embed_url, hashtags, city, caption')
          .eq('moderation_status', 'approved')
          .eq('source', 'youtube')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        if (cancelled) return;
        const mapped: CuratedTeaser[] = (data ?? []).flatMap((r: any) => {
          const tags: string[] = Array.isArray(r.hashtags) ? r.hashtags : [];
          const ytId = extractYouTubeId(r.embed_url, tags);
          if (!ytId) return [];
          const catTag = tags.find((t: string) => t.startsWith('cat:'));
          const chTag = tags.find((t: string) => t.startsWith('ch:'));
          return [{
            id: r.id,
            youtubeId: ytId,
            title: r.title,
            channel: chTag ? chTag.slice(3) : (r.caption?.split('·')[0]?.trim() || 'YouTube'),
            location: r.city ?? '',
            thumbnail: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
            category: catTag ? catTag.slice(4) : 'reviews',
          }];
        });
        setTeasers(mapped);
      } catch {
        if (!cancelled) setTeasers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [limit]);

  return { teasers, loading };
}