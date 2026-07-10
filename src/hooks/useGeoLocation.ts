import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type GeoLocation = { city: string | null; region: string | null; country: string | null };

const CACHE_KEY = 'periscope:geo:v1';

/**
 * Silent IP-based location lookup. Calls the `geo-locate` edge function once
 * per browser session and caches the result. Never prompts the user — this is
 * intentionally quiet. Disclosed in the privacy policy.
 *
 * VPN users / private IPs return nulls; callers should fall back gracefully.
 */
export function useGeoLocation(): { geo: GeoLocation | null; loading: boolean } {
  const [geo, setGeo] = useState<GeoLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          setGeo(JSON.parse(cached));
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke('geo-locate');
        if (error) throw error;
        if (cancelled) return;
        const g: GeoLocation = {
          city: data?.city ?? null,
          region: data?.region ?? null,
          country: data?.country ?? null,
        };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(g));
        setGeo(g);
      } catch {
        if (!cancelled) setGeo({ city: null, region: null, country: null });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { geo, loading };
}