import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";
import { authErrorResponse, corsHeaders, requireAdmin } from "../_shared/auth.ts";

type ChannelKind = "website" | "instagram" | "facebook" | "tiktok" | "youtube" | "matterport" | "gallery";
type Channel = { kind: ChannelKind; url: string; label?: string };
type Candidate = { name: string | null; address: string | null; city: string | null; state: string | null; channels: Channel[] };

const SOCIAL_PATTERNS: [ChannelKind, RegExp][] = [
  ["instagram", /instagram\.com/i],
  ["facebook", /facebook\.com|fb\.com/i],
  ["tiktok", /tiktok\.com/i],
  ["youtube", /youtube\.com|youtu\.be/i],
  ["matterport", /matterport\.com/i],
];
const BLOCKED_URL_HOSTS = new Set(["app.getflex.com", "stream.mux.com"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function normalizeUrl(v: string): string | null {
  let s = v.trim();
  if (s.startsWith("/url?")) {
    try {
      const parsed = new URL(s, "https://www.google.com");
      s = parsed.searchParams.get("q") ?? s;
    } catch {
      // Keep original string; validation below will reject it if unusable.
    }
  }
  if (!s || s.startsWith("mailto:") || s.startsWith("tel:")) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(s)) return `https://${s}`;
  return null;
}

function addUrl(channels: Channel[], v: unknown, label?: string) {
  if (Array.isArray(v)) {
    for (const item of v) addUrl(channels, item, label);
    return;
  }
  const raw = str(v);
  if (!raw) return;
  const url = normalizeUrl(raw);
  if (!url || channels.some((c) => c.url === url)) return;
  try {
    if (BLOCKED_URL_HOSTS.has(new URL(url).hostname.replace(/^www\./, ""))) return;
  } catch { /* ignore */ }
  if (/^https?:\/\/(www\.)?google\.com\/maps\//i.test(url)) return;
  const kind = SOCIAL_PATTERNS.find(([, re]) => re.test(url))?.[0] ??
    (/vapi\.apartments\.com\/video\/play/i.test(url) ? "gallery" : /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url) ? "gallery" : "website");
  channels.push({ kind, url, label });
}

function collect(channels: Channel[], v: unknown, label?: string) {
  if (!v) return;
  if (typeof v === "string") return addUrl(channels, v, label);
  if (Array.isArray(v)) return v.forEach((item) => collect(channels, item, label));
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    for (const key of ["url", "link", "href", "profileUrl", "profile", "sourceUrl", "imageUrl", "thumbnailUrl"]) {
      addUrl(channels, obj[key], label ?? key);
    }
    for (const [key, nested] of Object.entries(obj)) {
      if (typeof nested === "string") addUrl(channels, nested, key);
    }
  }
}

function nested(row: Record<string, unknown>, path: string): string | null {
  let current: unknown = row;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[part];
  }
  return str(current);
}

function first(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = key.includes(".") ? nested(row, key) : str(row[key]);
    if (value) return value;
  }
  return null;
}

function normalizeRow(row: Record<string, unknown>): Candidate {
  const channels: Channel[] = [];
  for (const key of ["website", "propertyWebsite", "site", "domain", "instagram", "facebook", "tiktok", "youtube", "matterport", "virtualTour", "virtual_tour", "tourUrl"]) {
    addUrl(channels, row[key], key);
  }
  collect(channels, row.url, "source");
  for (const key of ["socials", "socialLinks", "socialProfiles", "profiles", "images", "gallery", "media"]) {
    collect(channels, row[key], key);
  }
  const virtualTours = Array.isArray(row.virtualTours) ? row.virtualTours.slice(0, 3) : row.virtualTours;
  if (virtualTours) collect(channels, virtualTours, "virtualTours");
  const virtualTourExtended = Array.isArray(row.virtualTourExtended) ? row.virtualTourExtended.slice(0, 3) : row.virtualTourExtended;
  if (virtualTourExtended) collect(channels, virtualTourExtended, "virtualTourExtended");
  const photos = Array.isArray(row.photos) ? row.photos.slice(0, 3) : row.photos;
  if (photos) collect(channels, photos, "gallery");
  const rawAddress = first(row, ["address", "street", "fullAddress", "Billing Street"]);
  const addressParts = rawAddress?.split(",").map((x) => x.trim()).filter(Boolean) ?? [];
  const addressLine = addressParts[0] ?? rawAddress;
  const cityFromAddress = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : null;
  const stateZip = addressParts.length >= 1 ? addressParts[addressParts.length - 1] : null;
  const stateFromAddress = stateZip?.match(/\b([A-Z]{2})\b/)?.[1] ?? null;

  return {
    name: first(row, ["propertyName", "title", "name", "placeName", "businessName", "Account Name"]),
    address: addressLine,
    city: first(row, ["city", "Billing City"]) ?? cityFromAddress,
    state: first(row, ["state", "stateCode", "location.state", "region", "Billing State/Province"]) ?? stateFromAddress,
    channels,
  };
}

function like(s: string) {
  return `%${s.replace(/[%_]/g, "")}%`;
}

async function findProperty(supabase: ReturnType<typeof createClient>, candidate: Candidate): Promise<string | null> {
  if (candidate.address) {
    let query = supabase.from("canonical_property").select("id").ilike("address_line1", like(candidate.address)).limit(1);
    if (candidate.city) query = query.ilike("city", like(candidate.city));
    if (candidate.state) query = query.ilike("state", like(candidate.state));
    const { data } = await query.maybeSingle();
    if (data?.id) return data.id as string;
  }
  if (candidate.name) {
    let query = supabase.from("canonical_property").select("id").ilike("name", like(candidate.name)).limit(1);
    if (candidate.city) query = query.ilike("city", like(candidate.city));
    if (candidate.state) query = query.ilike("state", like(candidate.state));
    const { data } = await query.maybeSingle();
    if (data?.id) return data.id as string;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    await requireAdmin(req);
  } catch (err) {
    return authErrorResponse(err);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Supabase service credentials not configured" }, 500);
  const supabase = createClient(supabaseUrl, serviceKey);

  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Number(body.limit ?? 500), 5000);
  let rows: Record<string, unknown>[];

  if (Array.isArray(body.items)) {
    rows = body.items.slice(0, limit);
  } else if (body.datasetId) {
    const token = Deno.env.get("APIFY_TOKEN");
    if (!token) return json({ error: "APIFY_TOKEN not configured" }, 500);
    const url = `https://api.apify.com/v2/datasets/${encodeURIComponent(String(body.datasetId))}/items?clean=true&format=json&limit=${limit}&token=${encodeURIComponent(token)}`;
    const response = await fetch(url);
    if (!response.ok) return json({ error: "Apify dataset fetch failed", status: response.status, detail: await response.text() }, 502);
    rows = await response.json();
  } else {
    return json({ error: "Provide datasetId or items[]" }, 400);
  }

  const candidates = rows.map(normalizeRow).filter((c) => c.channels.length > 0);
  let matched = 0;
  let attached = 0;
  let unmatched = 0;
  const samples: unknown[] = [];

  for (const candidate of candidates) {
    const propertyId = await findProperty(supabase, candidate);
    if (!propertyId) {
      unmatched++;
      if (samples.length < 20) samples.push({ unmatched: candidate.name, city: candidate.city, state: candidate.state, channels: candidate.channels.length });
      continue;
    }
    matched++;
    for (const channel of candidate.channels) {
      const { data: existing } = await supabase
        .from("property_channel")
        .select("id")
        .eq("canonical_property_id", propertyId)
        .eq("url", channel.url)
        .maybeSingle();
      if (existing?.id) continue;
      const { error } = await supabase.from("property_channel").insert({
        canonical_property_id: propertyId,
        kind: channel.kind,
        url: channel.url,
        label: channel.label ?? "Apify public source",
        is_verified: false,
        source: "seed",
      });
      if (error) return json({ error: "Insert failed", detail: error.message }, 500);
      attached++;
    }
  }

  return json({ ok: true, rows: rows.length, candidates: candidates.length, matched, attached, unmatched, samples });
});
