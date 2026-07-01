// Dynamic sitemap.xml for SEO — lists core pages, city hubs, and property pages
// from the canonical graph. Public (verify_jwt=false). Point sitemap.xml at this
// function (or copy its output) in production.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

serve(async (req) => {
  const origin = new URL(req.url).searchParams.get('origin') ?? 'https://pariscope.app';
  const urls: string[] = ['/', '/feed', '/discover', '/browse', '/search', '/contribute', '/welcome', '/help'];

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: props } = await supabase
      .from('canonical_property').select('id, city, state').eq('status', 'active').limit(45000);
    const cities = new Set<string>();
    for (const p of props ?? []) {
      urls.push(`/property/${(p as { id: string }).id}`);
      const c = p as { city?: string; state?: string };
      if (c.city && c.state) cities.add(`/city/${encodeURIComponent(c.state)}/${encodeURIComponent(c.city)}`);
    }
    cities.forEach((c) => urls.push(c));
  } catch {
    // fall back to core pages only
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    urls.map((u) => `  <url><loc>${origin}${u}</loc></url>`).join('\n')
  }\n</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' },
  });
});
