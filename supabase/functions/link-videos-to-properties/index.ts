// Match seeded YouTube videos to properties by fuzzy comparing the video
// title / caption / channel against each property's name, address_line1,
// management_company, and city. Inserts high/medium-confidence rows into
// public.property_videos. Admin-only.
//
// Confidence rubric (0..1):
//   0.95  building name (>= 2 tokens) or address_line1 appears verbatim
//         AND city matches
//   0.80  building name (>= 2 tokens) appears verbatim, city missing/unknown
//   0.60  management_company appears AND city matches
//   0.40  city + a strong building keyword (name token >= 5 chars)
// Anything below 0.4 is dropped. Rows insert with is_approved = confidence >= 0.8
// so admins only have to review the middle band.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { corsHeaders } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const admin = createClient(supaUrl, serviceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.id) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;

    const { data: role } = await admin.from('user_roles').select('role')
      .eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (!role) return json({ error: 'Admin only' }, 403);

    const body = await req.json().catch(() => ({}));
    const dryRun = Boolean(body.dryRun);
    const propertyLimit = Math.min(Math.max(Number(body.propertyLimit) || 5000, 1), 20000);
    const videoLimit    = Math.min(Math.max(Number(body.videoLimit)    || 5000, 1), 20000);

    // Pull the working sets. We DO NOT select PII columns (owner, contact_*,
    // phone, email, tax_assessments, property_taxes, last_sale_price,
    // legal_description) — this function only needs matching fields.
    const [{ data: props, error: pErr }, { data: vids, error: vErr }] = await Promise.all([
      admin.from('properties')
        .select('id, name, address, address_line1, city, state, management_company')
        .limit(propertyLimit),
      admin.from('seeded_videos')
        .select('id, title, caption, city, hashtags')
        .eq('moderation_status', 'approved')
        .eq('source', 'youtube')
        .limit(videoLimit),
    ]);
    if (pErr) return json({ error: 'properties fetch failed', detail: pErr.message }, 500);
    if (vErr) return json({ error: 'videos fetch failed', detail: vErr.message }, 500);

    // Skip video/property pairs we've already linked.
    const { data: existing } = await admin.from('property_videos')
      .select('property_id, seeded_video_id');
    const already = new Set(
      (existing ?? []).map((r: any) => `${r.property_id}::${r.seeded_video_id}`)
    );

    // Group properties by city for O(V * P_city) matching instead of O(V*P).
    const byCity = new Map<string, any[]>();
    for (const p of props ?? []) {
      const key = norm(p.city ?? '');
      if (!byCity.has(key)) byCity.set(key, []);
      byCity.get(key)!.push(p);
    }

    const inserts: any[] = [];
    const previews: any[] = [];
    let considered = 0;

    for (const v of vids ?? []) {
      considered++;
      const haystack = norm(`${v.title ?? ''} ${v.caption ?? ''}`);
      if (!haystack) continue;
      const vCity = norm(v.city ?? '');
      const candidatePools: any[][] = [];
      if (vCity && byCity.has(vCity)) candidatePools.push(byCity.get(vCity)!);
      // Also let a property match if the video didn't specify a city
      // — but limit that pool so we don't O(N^2) on unfiltered videos.
      if (!vCity) candidatePools.push((props ?? []).slice(0, 500));

      let best: { propertyId: string; confidence: number; reason: string } | null = null;
      for (const pool of candidatePools) {
        for (const p of pool) {
          const scored = scorePair(p, haystack, vCity);
          if (scored && (!best || scored.confidence > best.confidence)) {
            best = { propertyId: p.id, confidence: scored.confidence, reason: scored.reason };
          }
        }
      }
      if (!best || best.confidence < 0.4) continue;
      const key = `${best.propertyId}::${v.id}`;
      if (already.has(key)) continue;
      already.add(key);

      const row = {
        property_id: best.propertyId,
        seeded_video_id: v.id,
        confidence: Number(best.confidence.toFixed(2)),
        match_reason: best.reason,
        is_approved: best.confidence >= 0.8,
      };
      inserts.push(row);
      if (previews.length < 25) previews.push({ ...row, video_title: v.title });
    }

    let inserted = 0;
    if (!dryRun && inserts.length > 0) {
      // Batch to avoid oversized single insert
      for (let i = 0; i < inserts.length; i += 500) {
        const batch = inserts.slice(i, i + 500);
        const { error, count } = await admin.from('property_videos').insert(batch, { count: 'exact' });
        if (!error) inserted += count ?? batch.length;
      }
    }

    return json({
      ok: true,
      dryRun,
      videosConsidered: considered,
      propertiesConsidered: props?.length ?? 0,
      matched: inserts.length,
      inserted,
      autoApproved: inserts.filter((r) => r.is_approved).length,
      needsReview: inserts.filter((r) => !r.is_approved).length,
      preview: previews,
    });
  } catch (e) {
    return json({ error: 'Unhandled', detail: String(e) }, 500);
  }
});

function norm(s: string): string {
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scorePair(
  p: { id: string; name?: string | null; address_line1?: string | null; city?: string | null; management_company?: string | null },
  haystack: string,
  vCity: string,
): { confidence: number; reason: string } | null {
  const pCity = norm(p.city ?? '');
  const cityMatch = pCity && vCity && pCity === vCity;
  const name = norm(p.name ?? '');
  const addr = norm((p as any).address_line1 ?? (p as any).address ?? '');
  const mgmt = norm(p.management_company ?? '');

  // Strong: multi-token building name OR full address line in haystack
  const nameTokens = name.split(' ').filter((t) => t.length >= 3);
  const nameStrong = nameTokens.length >= 2 && haystack.includes(name);
  const addrStrong = addr && addr.length >= 6 && haystack.includes(addr);

  if ((nameStrong || addrStrong) && cityMatch) {
    return { confidence: 0.95, reason: nameStrong ? 'name+city' : 'address+city' };
  }
  if (nameStrong || addrStrong) {
    return { confidence: 0.8, reason: nameStrong ? 'name only' : 'address only' };
  }
  if (mgmt && mgmt.length >= 4 && haystack.includes(mgmt) && cityMatch) {
    return { confidence: 0.6, reason: 'management_company+city' };
  }
  // Weak signal: a distinctive name token >= 5 chars + city match
  const distinctive = nameTokens.find((t) => t.length >= 5 && haystack.includes(t));
  if (distinctive && cityMatch) {
    return { confidence: 0.4, reason: `keyword:${distinctive}+city` };
  }
  return null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}