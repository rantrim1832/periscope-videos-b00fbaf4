/**
 * Crawl known property websites for official social/video/tour links.
 *
 * Source of truth:
 *   property_channel rows with kind='website'
 *
 * Output:
 *   additional property_channel rows (instagram/facebook/tiktok/youtube/
 *   matterport/gallery/website), source='seed', is_verified=false.
 *
 * Conservative by design: homepage + a few obvious pages only, no media
 * download/rehost, skip known aggregator/social domains as crawl targets.
 */
import { createClient } from '@supabase/supabase-js';

type ChannelKind = 'website' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'matterport' | 'gallery';

const SOCIAL_PATTERNS: [ChannelKind, RegExp][] = [
  ['instagram', /instagram\.com/i],
  ['facebook', /facebook\.com|fb\.com/i],
  ['tiktok', /tiktok\.com/i],
  ['youtube', /youtube\.com|youtu\.be/i],
  ['matterport', /matterport\.com|my\.matterport\.com/i],
];

const SKIP_HOSTS = [
  'apartments.com',
  'google.com',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'youtu.be',
  'matterport.com',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    dryRun: args.includes('--dry-run'),
    limit: Number(get('--limit') ?? 100),
    pages: Number(get('--pages') ?? 4),
  };
}

function host(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); }
  catch { return ''; }
}

function shouldCrawl(url: string): boolean {
  const h = host(url);
  return !!h && !SKIP_HOSTS.some((skip) => h === skip || h.endsWith(`.${skip}`));
}

function absolutize(base: string, href: string): string | null {
  try {
    const u = new URL(href, base);
    if (!/^https?:$/.test(u.protocol)) return null;
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

function classify(url: string): ChannelKind {
  return SOCIAL_PATTERNS.find(([, re]) => re.test(url))?.[0] ??
    (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url) ? 'gallery' : 'website');
}

function noisyAsset(url: string): boolean {
  const lowered = decodeURIComponent(url).toLowerCase();
  return /favicon|logo|poweredby|equalhousing|wheelchair|pawprint|smokefree|google\.png|facebook\.png|instagram\.png|\/tr\?id=|pixel|analytics/.test(lowered);
}

function extractLinks(base: string, html: string): string[] {
  const out = new Set<string>();
  const patterns = [
    /\bhref=["']([^"']+)["']/gi,
    /\bsrc=["']([^"']+)["']/gi,
    /\bcontent=["']([^"']+)["']/gi,
  ];
  for (const re of patterns) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(html))) {
      const url = absolutize(base, match[1]);
      if (!url) continue;
      if (
        SOCIAL_PATTERNS.some(([, p]) => p.test(url)) ||
        /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url) ||
        /tour|virtual|matterport|gallery|photos?|media|amenit/i.test(url)
      ) {
        out.add(url);
      }
    }
  }
  return [...out];
}

function internalDiscoveryPages(base: string, html: string, max: number): string[] {
  const baseHost = host(base);
  const candidates = extractLinks(base, html)
    .filter((u) => host(u) === baseHost)
    .filter((u) => /gallery|photos?|virtual|tour|amenit|media/i.test(u));
  return [...new Set(candidates)].slice(0, max);
}

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 PeriscopeBot/0.1 (+https://joinperiscope.com)' },
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('text/html')) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const args = parseArgs();
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const { data: websites, error } = await supabase
    .from('property_channel')
    .select('canonical_property_id,url,canonical_property:canonical_property_id(name,city,state)')
    .eq('kind', 'website')
    .eq('source', 'seed')
    .limit(args.limit);
  if (error) throw error;

  let crawled = 0;
  let found = 0;
  let inserted = 0;

  for (const row of websites ?? []) {
    const website = String((row as any).url);
    if (!shouldCrawl(website)) continue;
    const homepage = await fetchHtml(website);
    if (!homepage) continue;
    crawled++;

    const pages = [website, ...internalDiscoveryPages(website, homepage, Math.max(0, args.pages - 1))];
    const links = new Set(extractLinks(website, homepage));
    for (const page of pages.slice(1)) {
      const html = await fetchHtml(page);
      if (!html) continue;
      extractLinks(page, html).forEach((link) => links.add(link));
    }

    const channels = [...links]
      .filter((url) => host(url) !== host(website) || /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url))
      .map((url) => ({ kind: classify(url), url }))
      .filter((ch) => ch.kind !== 'website')
      .filter((ch) => !noisyAsset(ch.url));
    const selected = [
      ...channels.filter((ch) => ch.kind === 'instagram').slice(0, 1),
      ...channels.filter((ch) => ch.kind === 'facebook').slice(0, 1),
      ...channels.filter((ch) => ch.kind === 'tiktok').slice(0, 1),
      ...channels.filter((ch) => ch.kind === 'youtube').slice(0, 2),
      ...channels.filter((ch) => ch.kind === 'matterport').slice(0, 3),
      ...channels.filter((ch) => ch.kind === 'gallery').slice(0, 3),
    ].slice(0, 10);
    found += selected.length;

    if (args.dryRun) {
      if (selected.length) console.log(`\n${(row as any).canonical_property?.name ?? row.canonical_property_id} — ${website}`);
      selected.forEach((ch) => console.log(`  ${ch.kind.padEnd(10)} ${ch.url}`));
      continue;
    }

    for (const ch of selected) {
      const { data: existing } = await supabase
        .from('property_channel')
        .select('id')
        .eq('canonical_property_id', row.canonical_property_id)
        .eq('url', ch.url)
        .maybeSingle();
      if (existing?.id) continue;
      const { error: insertError } = await supabase.from('property_channel').insert({
        canonical_property_id: row.canonical_property_id,
        kind: ch.kind,
        url: ch.url,
        label: 'Official website crawl',
        source: 'seed',
        is_verified: false,
      });
      if (insertError) throw insertError;
      inserted++;
    }
  }

  console.log({ crawled, found, inserted, dryRun: args.dryRun });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
