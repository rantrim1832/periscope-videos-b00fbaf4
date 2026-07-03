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
  let s = url.trim();
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
  const kind = SOCIAL_PATTERNS.find(([, re]) => re.test(url))?.[0] ?? (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url) ? 'gallery' : 'website');
  if (!channels.some((c) => c.url === url)) channels.push({ kind, url, label });
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

function firstString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return null;
}

function normalizeRow(row: Record<string, unknown>): Candidate {
  const channels: Candidate['channels'] = [];

  for (const key of [
    'website', 'url', 'site', 'domain', 'instagram', 'facebook', 'tiktok', 'youtube',
    'matterport', 'virtualTour', 'virtual_tour', 'tourUrl', 'bookingUrl',
  ]) {
    pushUrl(channels, row[key], key);
  }
  for (const key of ['socials', 'socialLinks', 'socialProfiles', 'profiles', 'images', 'photos', 'gallery', 'media']) {
    collectNestedUrls(channels, row[key], key);
  }

  const rawAddress = firstString(row, ['address', 'street', 'fullAddress', 'location.address', 'Billing Street']);
  const addressParts = rawAddress?.split(',').map((x) => x.trim()).filter(Boolean) ?? [];
  const addressLine = addressParts[0] ?? rawAddress;
  const cityFromAddress = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : null;
  const stateZip = addressParts.length >= 1 ? addressParts[addressParts.length - 1] : null;
  const stateFromAddress = stateZip?.match(/\b([A-Z]{2})\b/)?.[1] ?? null;

  return {
    name: firstString(row, ['title', 'name', 'placeName', 'businessName', 'Account Name']),
    address: addressLine,
    city: firstString(row, ['city', 'location.city', 'Billing City']) ?? cityFromAddress,
    state: firstString(row, ['state', 'stateCode', 'region', 'Billing State/Province']) ?? stateFromAddress,
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

async function attach(client: SupabaseClient, propertyId: string, channel: Candidate['channels'][number]) {
  const { data: existing } = await client
    .from('property_channel')
    .select('id')
    .eq('canonical_property_id', propertyId)
    .eq('url', channel.url)
    .maybeSingle();
  if (existing?.id) return false;
  const { error } = await client.from('property_channel').insert({
    canonical_property_id: propertyId,
    kind: channel.kind,
    url: channel.url,
    label: channel.label ?? 'Apify public source',
    is_verified: false,
    source: 'seed',
  });
  if (error) throw error;
  return true;
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
  let attached = 0;
  let unmatched = 0;
  for (const c of candidates) {
    const propertyId = await findProperty(client, c);
    if (!propertyId) {
      unmatched++;
      continue;
    }
    matched++;
    for (const ch of c.channels) {
      if (await attach(client, propertyId, ch)) attached++;
    }
  }
  console.log(`Matched properties: ${matched}`);
  console.log(`Channels attached: ${attached}`);
  console.log(`Unmatched rows: ${unmatched}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
