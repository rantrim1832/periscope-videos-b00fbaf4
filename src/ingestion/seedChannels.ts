// Official-channel seeding pipeline: discover a property's public channels,
// attach high-confidence ones to the canonical graph as "Official · Public",
// and prioritize the lowest-density properties as the best seeding targets.
// Sink-abstracted so it runs offline (dry-run) or against Supabase.

import type { PropertyView } from '../domain/property';
import { computeDensity } from '../domain/density';
import {
  getChannelDiscoveryProvider, AUTO_ATTACH_CONFIDENCE,
  type ChannelDiscoveryProvider, type DiscoveredChannel,
} from '../services/providers/channelDiscovery';

export interface ChannelSink {
  attach(propertyId: string, channel: DiscoveredChannel): Promise<void>;
}

export class InMemoryChannelSink implements ChannelSink {
  public attached: Array<{ propertyId: string; channel: DiscoveredChannel }> = [];
  async attach(propertyId: string, channel: DiscoveredChannel): Promise<void> {
    this.attached.push({ propertyId, channel });
  }
}

export interface SeedResult {
  attached: number;
  reviewQueue: number;
  prioritized: Array<{ id: string; name: string; densityPct: number; alive: boolean }>;
}

export async function seedChannels(
  properties: PropertyView[],
  opts: { sink: ChannelSink; discovery?: ChannelDiscoveryProvider; threshold?: number } ,
): Promise<SeedResult> {
  const discovery = opts.discovery ?? getChannelDiscoveryProvider();
  const threshold = opts.threshold ?? AUTO_ATTACH_CONFIDENCE;

  let attached = 0;
  let reviewQueue = 0;

  for (const p of properties) {
    const existing = new Set((p.officialChannels ?? []).map((c) => c.kind));
    const found = await discovery.discover({ name: p.name, city: p.city, state: p.state });
    for (const ch of found) {
      if (existing.has(ch.kind)) continue;
      if (ch.confidence >= threshold) {
        await opts.sink.attach(p.id, ch);
        attached++;
      } else {
        reviewQueue++;
      }
    }
  }

  // Prioritize seeding by lowest density (biggest "abandoned" risk first).
  const prioritized = properties
    .map((p) => {
      const d = computeDensity(p);
      return { id: p.id, name: p.name, densityPct: d.pct, alive: d.isAlive };
    })
    .sort((a, b) => a.densityPct - b.densityPct);

  return { attached, reviewQueue, prioritized };
}
