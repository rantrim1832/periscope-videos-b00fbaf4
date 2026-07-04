/**
 * Import official/public channels from an Apify dataset/export.
 *
 * Supports:
 *   APIFY_TOKEN=... npm run import:apify -- --dataset <datasetId> --dry-run
 *   npm run import:apify -- --file apify-output.json --dry-run
 *
 * Live writes require SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * This importer only links/embeds source URLs into property_channel; it does not
 * rehost media and does not create resident reviews.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';

type ChannelKind = 'website' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'matterport' | 'gallery';

type Candidate = {
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  sourceProfileUrl?: string | null;
  channels: { kind: ChannelKind; url: string; label?: string }[];
};

type Args = {
  dataset?: string;
  file?: string;
  dryRun: boolean;
  limit: number;
};

const SOCIAL_PATTERNS: [ChannelKind, RegExp][] = [
  ['instagram', /instagram\.com/i],
  ['facebook', /facebook\.com|fb\.com/i],
  ['tiktok', /tiktok\.com/i],
  ['youtube', /youtube\.com|youtu\.be/i],
  ['matterport', /matterport\.com/i],
];

const BLOCKED_URL_HOSTS = new Set(['app.getflex.com', 'stream.mux.com']);

function cleanText(value: string): string {
  return value.replace(/[\uD800-\uDFFF]/g, '').trim();
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    dataset: get('--dataset'),
    file: get('--file'),
    dryRun: args.includes('--dry-run'),
    limit: Number(get('--limit') ?? 500),
  };
}

function asString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s || null;
}

function normalizeUrl(url: string): string | null {
  let s = cleanText(url);
  if (s.startsWith('/url?')) {
    try {
      const parsed = new URL(s, 'https://www.google.com');
      s = parsed.searchParams.get('q') ?? s;
    } catch {
      // Keep original string; validation below will reject it if unusable.
    }
  }
  if (!s || s.startsWith('mailto:') || s.startsWith('tel:')) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(s)) return `https://${s}`;
  return null;
}

function pushUrl(channels: Candidate['channels'], urlLike: unknown, label?: string) {
  if (Array.isArray(urlLike)) {
    for (const u of urlLike) pushUrl(channels, u, label);
    return;
  }
  const raw = asString(urlLike);
  if (!raw) return;
  const url = normalizeUrl(raw);
  if (!url) return;
  try {
    if (BLOCKED_URL_HOSTS.has(new URL(url).hostname.replace(/^www\./, ''))) return;
  } catch { /* ignore */ }
  if (/^https?:\/\/(www\.)?google\.com\/maps\//i.test(url)) return;
  const kind = SOCIAL_PATTERNS.find(([, re]) => re.test(url))?.[0] ??
    (/vapi\.apartments\.com\/video\/play/i.test(url) ? 'gallery' : /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url) ? 'gallery' : 'website');
  if (!channels.some((c) => c.url === url)) channels.push({ kind, url, label: label ? cleanText(label) : undefined });
}

function collectNestedUrls(channels: Candidate['channels'], value: unknown, label?: string) {
  if (!value) return;
  if (typeof value === 'string') {
    pushUrl(channels, value, label);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectNestedUrls(channels, item, label);
    return;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['url', 'link', 'href', 'profileUrl', 'profile', 'sourceUrl', 'imageUrl', 'thumbnailUrl']) {
      pushUrl(channels, obj[key], label ?? key);
    }
    for (const [key, nested] of Object.entries(obj)) {
      if (typeof nested === 'string') pushUrl(channels, nested, key);
    }
  }
}

function nestedString(row: Record<string, unknown>, path: string): string | null {
  let current: unknown = row;
  for (const part of path.split('.')) {
    if (!current || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[part];
  }
  return asString(current);
}

function firstString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = key.includes('.') ? nestedString(row, key) : asString(row[key]);
    if (value) return value;
  }
  return null;
}

function normalizeRow(row: Record<string, unknown>): Candidate {
  const channels: Candidate['channels'] = [];
  const scrapedUsername = firstString(row, ['scraped_username', 'username', 'ownerUsername']);
  const postUrl = firstString(row, ['post_url', 'url', 'permalink', 'shortCodeUrl']);
  if (scrapedUsername) {
    pushUrl(channels, `https://www.instagram.com/${scrapedUsername}`, 'profile-source');
  }
  if (postUrl && /instagram\.com\/(p|reel|tv)\//i.test(postUrl)) {
    const caption = firstString(row, ['caption.text', 'caption', 'text']);
    const label = caption ? `Instagram post · ${caption.slice(0, 80)}${caption.length > 80 ? '...' : ''}` : 'Instagram post';
    pushUrl(channels, postUrl, label);
  }

  for (const key of [
    'website', 'propertyWebsite', 'site', 'domain', 'instagram', 'facebook', 'tiktok', 'youtube',
    'matterport', 'virtualTour', 'virtual_tour', 'tourUrl', 'bookingUrl',
  ]) {
    pushUrl(channels, row[key], key);
  }
  collectNestedUrls(channels, row.url, 'source');
  for (const key of ['socials', 'socialLinks', 'socialProfiles', 'profiles', 'images', 'gallery', 'media']) {
    collectNestedUrls(channels, row[key], key);
  }
  collectNestedUrls(channels, row.allSocialLinks, 'allSocialLinks');
  const virtualTours = Array.isArray(row.virtualTours) ? row.virtualTours.slice(0, 3) : row.virtualTours;
  if (virtualTours) collectNestedUrls(channels, virtualTours, 'virtualTours');
  const virtualTourExtended = Array.isArray(row.virtualTourExtended) ? row.virtualTourExtended.slice(0, 3) : row.virtualTourExtended;
  if (virtualTourExtended) collectNestedUrls(channels, virtualTourExtended, 'virtualTourExtended');
  const photos = Array.isArray(row.photos) ? row.photos.slice(0, 3) : row.photos;
  if (photos) {
    collectNestedUrls(channels, photos, 'gallery');
  }

  const rawAddress = firstString(row, ['address', 'street', 'fullAddress', 'location.address', 'Billing Street']);
  const addressParts = rawAddress?.split(',').map((x) => x.trim()).filter(Boolean) ?? [];
  const addressLine = addressParts[0] ?? rawAddress;
  const cityFromAddress = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : null;
  const stateZip = addressParts.length >= 1 ? addressParts[addressParts.length - 1] : null;
  const stateFromAddress = stateZip?.match(/\b([A-Z]{2})\b/)?.[1] ?? null;

  return {
    name: firstString(row, ['propertyName', 'title', 'name', 'placeName', 'businessName', 'Account Name']),
    address: addressLine,
    city: firstString(row, ['city', 'location.city', 'Billing City']) ?? cityFromAddress,
    state: firstString(row, ['state', 'stateCode', 'location.state', 'region', 'Billing State/Province']) ?? stateFromAddress,
    sourceProfileUrl: scrapedUsername ? `https://www.instagram.com/${scrapedUsername}` : null,
    channels,
  };
}

async function loadItems(args: Args): Promise<Record<string, unknown>[]> {
  if (args.file) {
    const text = await readFile(args.file, 'utf8');
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : (parsed.items ?? parsed.data ?? []);
  }
  if (!args.dataset) throw new Error('Provide --dataset <Apify dataset ID> or --file <json export>');
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('APIFY_TOKEN is required when using --dataset');
  const url = `https://api.apify.com/v2/datasets/${encodeURIComponent(args.dataset)}/items?clean=true&format=json&limit=${args.limit}&token=${encodeURIComponent(token)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Apify dataset fetch failed: ${response.status} ${await response.text()}`);
  return await response.json();
}

function like(s: string): string {
  return `%${s.replace(/[%_]/g, '')}%`;
}

async function findProperty(client: SupabaseClient, c: Candidate): Promise<string | null> {
  const sourceUrls = [
    ...(c.sourceProfileUrl ? [c.sourceProfileUrl] : []),
    ...c.channels.filter((ch) => ch.label === 'source' || ch.label === 'profile-source' || ch.kind === 'website').map((ch) => ch.url),
  ];
  for (const url of sourceUrls) {
    const stripped = url.replace(/[?#].*$/, '').replace(/\/$/, '');
    const { data } = await client
      .from('property_channel')
      .select('canonical_property_id')
      .ilike('url', `${stripped}%`)
      .limit(1)
      .maybeSingle();
    if (data?.canonical_property_id) return data.canonical_property_id as string;
  }

  if (c.address) {
    let query = client.from('canonical_property').select('id').ilike('address_line1', like(c.address)).limit(1);
    if (c.city) query = query.ilike('city', like(c.city));
    if (c.state) query = query.ilike('state', like(c.state));
    const { data } = await query.maybeSingle();
    if (data?.id) return data.id;
  }
  if (c.name) {
    let query = client.from('canonical_property').select('id').ilike('name', like(c.name)).limit(1);
    if (c.city) query = query.ilike('city', like(c.city));
    if (c.state) query = query.ilike('state', like(c.state));
    const { data } = await query.maybeSingle();
    if (data?.id) return data.id;
  }
  return null;
}

async function main() {
  const args = parseArgs();
  const rawItems = (await loadItems(args)).slice(0, args.limit);
  const candidates = rawItems.map(normalizeRow).filter((c) => c.channels.length > 0);
  console.log(`Loaded ${rawItems.length} Apify rows; ${candidates.length} have channel URLs.`);

  if (args.dryRun) {
    for (const c of candidates.slice(0, 20)) {
      console.log(`\n${c.name ?? '(unknown)'} — ${c.city ?? ''} ${c.state ?? ''}`);
      for (const ch of c.channels) console.log(`  ${ch.kind.padEnd(10)} ${ch.url}`);
    }
    return;
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for live import');
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  let matched = 0;
  let unmatched = 0;
  const channelRows: Array<{
    canonical_property_id: string;
    kind: ChannelKind;
    url: string;
    label: string;
    is_verified: boolean;
    source: string;
  }> = [];
  for (const c of candidates) {
    const propertyId = await findProperty(client, c);
    if (!propertyId) {
      unmatched++;
      continue;
    }
    matched++;
    for (const ch of c.channels) {
      channelRows.push({
        canonical_property_id: propertyId,
        kind: ch.kind,
        url: ch.url,
        label: cleanText(ch.label ?? 'Apify public source'),
        is_verified: false,
        source: 'seed',
      });
    }
  }
  const unique = Array.from(new Map(channelRows.map((r) => [`${r.canonical_property_id}|${r.url}`, r])).values());
  let attached = 0;
  for (let i = 0; i < unique.length; i += 1000) {
    const batch = unique.slice(i, i + 1000);
    const { data, error } = await client
      .from('property_channel')
      .upsert(batch, { onConflict: 'canonical_property_id,url', ignoreDuplicates: true })
      .select('id');
    if (error) throw error;
    attached += data?.length ?? 0;
  }
  console.log(`Matched properties: ${matched}`);
  console.log(`Channels attached: ${attached}`);
  console.log(`Unmatched rows: ${unmatched}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
