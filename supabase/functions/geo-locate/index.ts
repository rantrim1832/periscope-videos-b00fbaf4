// Silent IP-based geolocation. Reads x-forwarded-for from the incoming
// request, hits ipapi.co (no key, free tier ~1k/day per IP), and returns
// a small JSON blob. No storage — the browser caches per session.
import { corsHeaders } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const xff = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '';
    const ip = xff.split(',')[0]?.trim();

    // Cloudflare hint headers (free, no API call needed) — try them first.
    const cfCity = req.headers.get('cf-ipcity');
    const cfCountry = req.headers.get('cf-ipcountry');
    const cfRegion = req.headers.get('cf-region');
    if (cfCity) {
      return json({ city: cfCity, region: cfRegion, country: cfCountry, source: 'cf' });
    }

    if (!ip || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('127.')) {
      return json({ city: null, region: null, country: null, source: 'private' });
    }

    const r = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      headers: { 'User-Agent': 'periscope-geolocate/1.0' },
    });
    if (!r.ok) return json({ city: null, region: null, country: null, source: 'error' });
    const j = await r.json();
    return json({
      city: j.city ?? null,
      region: j.region ?? null,
      country: j.country_code ?? null,
      source: 'ipapi',
    });
  } catch (e) {
    return json({ city: null, region: null, country: null, source: 'exception', detail: String(e) });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}