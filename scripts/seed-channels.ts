/**
 * Official-channel bulk seeding + density prioritization.
 *
 * Dry-run (offline, mock discovery + in-memory sink):
 *   npx tsx scripts/seed-channels.ts --dry-run
 *
 * Live (writes property_channel — needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY;
 * uses a search API if SEARCH_API_KEY is set, else mock discovery):
 *   npx tsx scripts/seed-channels.ts --limit 500
 */
import { seedChannels, InMemoryChannelSink, type ChannelSink } from '../src/ingestion/seedChannels';
import type { DiscoveredChannel } from '../src/services/providers/channelDiscovery';

// Minimal PropertyView shape the pipeline needs (avoids alias imports in tsx).
type P = Parameters<typeof seedChannels>[0][number];

const SAMPLE: P[] = [
  { id: 'p1', name: 'Avalon Hollywood', city: 'Los Angeles', state: 'CA', latitude: 34.1, longitude: -118.3, propertyClass: 'large_community', unitsCount: 371, claimedByManager: false, reviews: [], media: [], timeline: [], officialChannels: [] },
  { id: 'p2', name: 'The Quarry Apartments', city: 'Austin', state: 'TX', latitude: 30.2, longitude: -97.7, propertyClass: 'midsize', unitsCount: 140, claimedByManager: false, reviews: [], media: [], timeline: [], officialChannels: [] },
  { id: 'p3', name: 'Willow Creek', city: 'Columbus', state: 'OH', propertyClass: 'small_multifamily', unitsCount: 24, claimedByManager: false, reviews: [], media: [], timeline: [], officialChannels: [] },
] as unknown as P[];

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const hasCreds = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  let properties: P[] = SAMPLE;
  let sink: ChannelSink = new InMemoryChannelSink();

  if (!dryRun && hasCreds) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const limitArg = args.indexOf('--limit');
    const limit = limitArg >= 0 ? parseInt(args[limitArg + 1], 10) : 1000;
    const { data } = await supabase.from('canonical_property').select('*').eq('status', 'active').limit(limit);
    properties = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id, name: r.name ?? 'Property', city: r.city, state: r.state,
      latitude: r.latitude, longitude: r.longitude, propertyClass: r.property_class,
      unitsCount: r.units_count, claimedByManager: false, reviews: [], media: [], timeline: [], officialChannels: [],
    })) as unknown as P[];
    sink = {
      async attach(propertyId: string, ch: DiscoveredChannel) {
        await supabase.from('property_channel').insert({
          canonical_property_id: propertyId, kind: ch.kind, url: ch.url,
          embed_url: ch.embedUrl ?? null, is_verified: false, source: 'seed',
        });
      },
    };
    console.log(`Loaded ${properties.length} properties from Supabase`);
  } else {
    console.log('Dry-run: mock discovery + in-memory sink, sample properties');
  }

  const result = await seedChannels(properties, { sink });

  console.log('\n===== CHANNEL SEEDING REPORT =====');
  console.log(`Channels attached:   ${result.attached}`);
  console.log(`Queued for review:   ${result.reviewQueue}`);
  const alive = result.prioritized.filter((p) => p.alive).length;
  console.log(`Properties "alive":  ${alive}/${result.prioritized.length}`);
  console.log('\nLowest-density seeding opportunities:');
  for (const p of result.prioritized.slice(0, 10)) {
    console.log(`  ${p.densityPct.toString().padStart(3)}%  ${p.alive ? '  ' : '⚠ '}${p.name}`);
  }
  console.log('==================================');
}

main().catch((e) => { console.error(e); process.exit(1); });
