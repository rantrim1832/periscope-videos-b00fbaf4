// Dynamic Open Graph image for link-unfurl previews (Slack, iMessage, X, etc.).
// Renders a 1200×630 SVG Report Card for a property from public data.
// Public (verify_jwt=false) — it's a public image. Reads only public tables.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const CATEGORY_LABELS: Record<string, string> = {
  management: 'Management', maintenance: 'Maintenance', depositReturn: 'Deposit Return',
  safety: 'Safety', noise: 'Noise', value: 'Value',
};
const TOP = ['management', 'maintenance', 'depositReturn', 'safety', 'noise', 'value'];

function esc(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!));
}
function color(score: number | null): string {
  if (score == null) return '#64748b';
  if (score < 40) return '#ef4444';
  if (score < 60) return '#f59e0b';
  if (score < 80) return '#84cc16';
  return '#22c55e';
}

serve(async (req) => {
  const url = new URL(req.url);
  const propertyId = url.searchParams.get('propertyId') ?? url.searchParams.get('id');

  let name = 'Pariscope';
  let location = 'The trust layer for renting';
  let score: number | null = null;
  let categories: Record<string, { score: number | null }> = {};
  let counts = { verified: 0, reviews: 0, videos: 0 };

  if (propertyId) {
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { data: prop } = await supabase.from('canonical_property').select('name, city, state').eq('id', propertyId).maybeSingle();
      if (prop) { name = prop.name ?? name; location = [prop.city, prop.state].filter(Boolean).join(', '); }
      const { data: agg } = await supabase.from('property_rating_aggregate').select('*').eq('canonical_property_id', propertyId).maybeSingle();
      if (agg) {
        score = agg.truth_score;
        categories = agg.categories ?? {};
        counts = { verified: agg.verified_resident_count ?? 0, reviews: agg.review_count ?? 0, videos: agg.video_count ?? 0 };
      }
    } catch { /* fall through to default card */ }
  }

  const accent = color(score);
  const bars = TOP.map((k, i) => {
    const s = categories[k]?.score ?? null;
    const pct = s == null ? 0 : (s / 5) * 380;
    const y = 300 + i * 48;
    return `
      <text x="60" y="${y + 6}" fill="#cbd5e1" font-size="22" font-family="sans-serif">${CATEGORY_LABELS[k]}</text>
      <rect x="240" y="${y - 12}" width="380" height="16" rx="8" fill="#1e293b"/>
      ${s == null ? '' : `<rect x="240" y="${y - 12}" width="${pct}" height="16" rx="8" fill="${color(s * 20)}"/>`}
      <text x="640" y="${y + 4}" fill="#94a3b8" font-size="18" font-family="sans-serif">${s == null ? '—' : s.toFixed(1)}</text>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0b0f17"/>
  <rect width="1200" height="8" fill="${accent}"/>
  <text x="60" y="70" fill="#94a3b8" font-size="24" font-weight="600" font-family="sans-serif">PARISCOPE · APARTMENT REPORT CARD</text>
  <text x="60" y="140" fill="#f8fafc" font-size="52" font-weight="700" font-family="sans-serif">${esc(name).slice(0, 34)}</text>
  <text x="60" y="180" fill="#94a3b8" font-size="26" font-family="sans-serif">${esc(location)}</text>
  <circle cx="1000" cy="200" r="110" fill="none" stroke="#1e293b" stroke-width="20"/>
  ${score == null ? '' : `<circle cx="1000" cy="200" r="110" fill="none" stroke="${accent}" stroke-width="20" stroke-linecap="round" stroke-dasharray="${(score / 100) * 691} 691" transform="rotate(-90 1000 200)"/>`}
  <text x="1000" y="215" fill="${accent}" font-size="80" font-weight="700" font-family="sans-serif" text-anchor="middle">${score ?? '—'}</text>
  <text x="1000" y="250" fill="#94a3b8" font-size="20" font-weight="600" font-family="sans-serif" text-anchor="middle">TRUTH SCORE</text>
  ${bars}
  <text x="60" y="590" fill="#94a3b8" font-size="24" font-family="sans-serif">${counts.verified} verified residents · ${counts.reviews} reviews · ${counts.videos} videos</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
