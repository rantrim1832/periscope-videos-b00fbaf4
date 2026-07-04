// Property data provider — interface-driven so the UI is fully functional with
// mock data now, and switches to the canonical Supabase graph (set
// VITE_USE_CANONICAL=true) with no component changes once migrations are live.

import type { PropertyView, ReviewView, MediaItem, LifeStage, TimelineEvent, FeedItem, OfficialChannel, ChannelKind } from '@/domain/property';
import type { CategoryKey } from '@/domain/truthScore';
import type { PropertyClass } from '@/domain/types';
import { FIXTURE_PROPERTIES, findFixture, fixtureFeed } from './fixtures';
import { useCanonicalData } from '@/lib/demo';
import { supabase } from '@/integrations/supabase/client';

export interface LocationCount {
  state?: string;
  city?: string;
  count: number;
}

export interface PropertyDataProvider {
  readonly name: string;
  getProperty(id: string): Promise<PropertyView | null>;
  listSummaries(): Promise<PropertyView[]>;
  search(query: string): Promise<PropertyView[]>;
  listStates(): Promise<LocationCount[]>;
  listCities(state: string): Promise<LocationCount[]>;
  listByLocation(state: string, city: string): Promise<PropertyView[]>;
  feed(): Promise<FeedItem[]>;
}

// Derive an entertainment-feed category from review signals.
export function deriveCategory(lifeStage: string | null, isPositive: boolean | null, hasEmbed: boolean): string {
  if (lifeStage === 'deposit') return 'Deposit nightmares';
  if (lifeStage === 'maintenance') return 'Maintenance disasters';
  if (isPositive) return 'Luxury tours';
  if (hasEmbed) return 'Would you live here?';
  return 'Horror stories';
}

function tally<T>(rows: T[], key: (r: T) => string | null | undefined): { value: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export class MockPropertyProvider implements PropertyDataProvider {
  readonly name = 'mock';
  async getProperty(id: string): Promise<PropertyView | null> {
    return findFixture(id);
  }
  async listSummaries(): Promise<PropertyView[]> {
    return FIXTURE_PROPERTIES;
  }
  async search(query: string): Promise<PropertyView[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return FIXTURE_PROPERTIES.filter((p) =>
      [p.name, p.city, p.state, p.addressLine1]
        .filter(Boolean)
        .some((f) => (f as string).toLowerCase().includes(q)),
    );
  }
  async listStates(): Promise<LocationCount[]> {
    return tally(FIXTURE_PROPERTIES, (p) => p.state).map((t) => ({ state: t.value, count: t.count }));
  }
  async listCities(state: string): Promise<LocationCount[]> {
    return tally(FIXTURE_PROPERTIES.filter((p) => p.state === state), (p) => p.city).map((t) => ({ city: t.value, count: t.count }));
  }
  async listByLocation(state: string, city: string): Promise<PropertyView[]> {
    return FIXTURE_PROPERTIES.filter((p) => p.state === state && p.city === city);
  }
  async feed(): Promise<FeedItem[]> {
    return fixtureFeed();
  }
}

// Canonical-graph-backed provider: reads canonical_property + public facts +
// approved canonical_review and maps to the PropertyView the UI speaks.
// Active when VITE_USE_CANONICAL=true (after migrations are applied).
/* eslint-disable @typescript-eslint/no-explicit-any */
export class CanonicalPropertyProvider implements PropertyDataProvider {
  readonly name = 'canonical';
  private db = supabase as any;

  private mapReview(r: any): ReviewView {
    return {
      id: r.id,
      authorPseudonym: r.author_pseudonym ?? 'resident',
      trustTier: r.trust_tier,
      createdAt: r.created_at,
      lifeStage: r.life_stage as LifeStage,
      title: r.title,
      body: r.body ?? undefined,
      ratings: (r.ratings ?? {}) as Partial<Record<CategoryKey, number>>,
      hasVideo: !!r.has_video,
      views: r.views ?? 0,
    };
  }

  async getProperty(id: string): Promise<PropertyView | null> {
    const { data: prop, error } = await this.db
      .from('canonical_property').select('*').eq('id', id).maybeSingle();
    if (error || !prop) return null;

    const { data: reviewRows } = await this.db
      .from('canonical_review').select('*')
      .eq('canonical_property_id', id)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false });

    const reviews = (reviewRows ?? []).map((r: any) => this.mapReview(r));
    const media: MediaItem[] = (reviewRows ?? [])
      .filter((r: any) => r.media_asset_id || r.embed_url)
      .map((r: any) => ({
        id: r.id,
        source: r.embed_url ? 'imported' : (r.source === 'official' ? 'official' : 'resident'),
        title: r.title,
        embedUrl: r.embed_url ?? undefined,
        platform: r.embed_platform ?? undefined,
        isPositive: undefined,
        verified: r.trust_tier === 'verified_resident',
      }));

    const { data: channelRows } = await this.db
      .from('property_channel').select('*').eq('canonical_property_id', id);
    const officialChannels: OfficialChannel[] = (channelRows ?? []).map((c: any) => ({
      id: c.id,
      kind: c.kind as ChannelKind,
      url: c.url,
      embedUrl: c.embed_url ?? undefined,
      label: c.label ?? undefined,
      verified: !!c.is_verified,
    }));

    const { data: eventRows } = await this.db
      .from('property_event').select('*')
      .eq('canonical_property_id', id)
      .order('event_date', { ascending: true });
    const timeline: TimelineEvent[] = (eventRows ?? []).map((e: any) => ({
      id: e.id,
      date: e.event_date,
      kind: e.kind,
      label: e.label,
      delta: e.delta ?? undefined,
    }));

    return {
      id: prop.id,
      name: prop.name ?? 'Unnamed property',
      addressLine1: prop.address_line1 ?? null,
      city: prop.city ?? null,
      state: prop.state ?? null,
      latitude: prop.latitude ?? null,
      longitude: prop.longitude ?? null,
      propertyClass: (prop.property_class ?? 'unknown') as PropertyClass,
      unitsCount: prop.units_count ?? null,
      claimedByManager: officialChannels.some((c) => c.verified),
      reviews,
      media,
      timeline,
      officialChannels,
    };
  }

  private mapSummary(prop: any): PropertyView {
    return {
      id: prop.id,
      name: prop.name ?? 'Unnamed property',
      addressLine1: prop.address_line1 ?? null,
      city: prop.city ?? null,
      state: prop.state ?? null,
      propertyClass: (prop.property_class ?? 'unknown') as PropertyClass,
      unitsCount: prop.units_count ?? null,
      claimedByManager: false,
      reviews: [],
      media: [],
      timeline: [],
      officialChannels: prop.officialChannels ?? [],
    };
  }

  private mapChannel(c: any): OfficialChannel {
    return {
      id: c.id,
      kind: c.kind as ChannelKind,
      url: c.url,
      embedUrl: c.embed_url ?? undefined,
      label: c.label ?? undefined,
      verified: !!c.is_verified,
    };
  }

  private channelPriority(kind: string, url = ''): number {
    if (kind === 'gallery' && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) return 100;
    if (kind === 'matterport') return 90;
    if (kind === 'youtube') return 80;
    if (kind === 'instagram' && /instagram\.com\/(p|reel|tv)\//i.test(url)) return 75;
    if (kind === 'tiktok') return 70;
    if (kind === 'instagram') return 50;
    if (kind === 'facebook') return 40;
    if (kind === 'website') return 20;
    return 10;
  }

  private visualScore(p: PropertyView): number {
    const channels = p.officialChannels ?? [];
    const weights: Record<string, number> = {
      gallery: 3,
      matterport: 5,
      instagram: 4,
      tiktok: 5,
      youtube: 5,
      facebook: 2,
      website: 1,
    };
    return channels.reduce((sum, c) => sum + (weights[c.kind] ?? 1), 0);
  }

  private sortContentFirst(items: PropertyView[]): PropertyView[] {
    return [...items].sort((a, b) => {
      const score = this.visualScore(b) - this.visualScore(a);
      if (score !== 0) return score;
      return a.name.localeCompare(b.name);
    });
  }

  private topIdsFromChannels(rows: any[], limit: number): string[] {
    const counts = new Map<string, number>();
    const weights: Record<string, number> = {
      gallery: 3,
      matterport: 5,
      instagram: 4,
      tiktok: 5,
      youtube: 5,
      facebook: 2,
      website: 1,
    };
    for (const row of rows ?? []) {
      const id = row.canonical_property_id;
      if (!id) continue;
      counts.set(id, (counts.get(id) ?? 0) + (weights[row.kind] ?? 1));
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  }

  private async enrichSummaries(props: any[]): Promise<PropertyView[]> {
    const ids = props.map((p) => p.id);
    if (ids.length === 0) return [];
    const channelRows: any[] = [];
    for (let i = 0; i < ids.length; i += 40) {
      const chunk = ids.slice(i, i + 40);
      const { data } = await this.db
        .from('property_channel')
        .select('*')
        .in('canonical_property_id', chunk)
        .limit(1200);
      channelRows.push(...(data ?? []));
    }
    const byProperty = new Map<string, any[]>();
    for (const row of channelRows ?? []) {
      const list = byProperty.get(row.canonical_property_id) ?? [];
      list.push(row);
      byProperty.set(row.canonical_property_id, list);
    }
    return props.map((p) => {
      const bestChannels = (byProperty.get(p.id) ?? [])
        .sort((a, b) => this.channelPriority(b.kind, b.url) - this.channelPriority(a.kind, a.url))
        .slice(0, 18)
        .map((row) => this.mapChannel(row));
      return this.mapSummary({ ...p, officialChannels: bestChannels });
    });
  }

  async listSummaries(): Promise<PropertyView[]> {
    const { data: channelRows } = await this.db
      .from('property_channel')
      .select('canonical_property_id, kind')
      .limit(5000);
    const ids = this.topIdsFromChannels(channelRows ?? [], 200);
    if (ids.length > 0) {
      const { data } = await this.db
        .from('canonical_property')
        .select('*')
        .in('id', ids)
        .eq('status', 'active');
      const byId = new Map((data ?? []).map((p: any) => [p.id, p]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
      return this.sortContentFirst(await this.enrichSummaries(ordered)).slice(0, 24);
    }
    const { data } = await this.db
      .from('canonical_property').select('*').eq('status', 'active').limit(200);
    return this.sortContentFirst(await this.enrichSummaries(data ?? [])).slice(0, 24);
  }

  // Alias-aware search: direct match on canonical fields OR any alias name,
  // so "Willow Creek Apts" resolves the same canonical entity as "Willow Creek".
  async search(query: string): Promise<PropertyView[]> {
    const q = query.trim();
    if (!q) return [];
    const term = `%${q}%`;

    const channelCity = q.length >= 3
      ? await this.db
        .from('property_channel')
        .select('canonical_property_id, kind, canonical_property!inner(city,status)')
        .ilike('canonical_property.city', q)
        .eq('canonical_property.status', 'active')
        .limit(1000)
      : { data: [] };
    const channelCityIds = this.topIdsFromChannels(channelCity.data ?? [], 200);

    const cityExact = q.length >= 3
      ? await this.db
        .from('canonical_property').select('*')
        .eq('status', 'active')
        .ilike('city', q)
        .limit(1000)
      : { data: [] };

    const { data: direct } = await this.db
      .from('canonical_property').select('*')
      .eq('status', 'active')
      .or(`name.ilike.${term},address_line1.ilike.${term},city.ilike.${term}`)
      .limit(cityExact.data?.length ? 100 : 60);
    let results: any[] = [];
    if (channelCityIds.length > 0) {
      const { data: channelProps } = await this.db
        .from('canonical_property')
        .select('*')
        .in('id', channelCityIds)
        .eq('status', 'active');
      const byId = new Map((channelProps ?? []).map((p: any) => [p.id, p]));
      results.push(...channelCityIds.map((id) => byId.get(id)).filter(Boolean));
    }
    results.push(...(cityExact.data ?? []), ...(direct ?? []));
    const seen = new Set(results.map((r) => r.id));

    const { data: aliasRows } = await this.db
      .from('property_alias').select('canonical_property_id')
      .ilike('alias_name', term).limit(20);
    const aliasIds = [...new Set((aliasRows ?? []).map((a: any) => a.canonical_property_id))]
      .filter((id) => !seen.has(id));
    if (aliasIds.length > 0) {
      const { data: viaAlias } = await this.db
        .from('canonical_property').select('*').in('id', aliasIds).eq('status', 'active');
      results.push(...(viaAlias ?? []).filter((p: any) => !seen.has(p.id)));
    }
    const deduped = [...new Map(results.map((p) => [p.id, p])).values()];
    return this.sortContentFirst(await this.enrichSummaries(deduped)).slice(0, 36);
  }

  async listStates(): Promise<LocationCount[]> {
    const { data } = await this.db.from('canonical_property').select('state').eq('status', 'active');
    return tally(data ?? [], (r: any) => r.state).map((t) => ({ state: t.value, count: t.count }));
  }
  async listCities(state: string): Promise<LocationCount[]> {
    const { data } = await this.db.from('canonical_property').select('city').eq('status', 'active').eq('state', state);
    return tally(data ?? [], (r: any) => r.city).map((t) => ({ city: t.value, count: t.count }));
  }
  async listByLocation(state: string, city: string): Promise<PropertyView[]> {
    const { data: richRows } = await this.db
      .from('property_channel')
      .select('canonical_property_id, kind, canonical_property!inner(city,state,status)')
      .eq('canonical_property.status', 'active')
      .eq('canonical_property.state', state)
      .eq('canonical_property.city', city)
      .limit(1500);
    const richIds = this.topIdsFromChannels(richRows ?? [], 300);
    const { data } = await this.db
      .from('canonical_property').select('*').eq('status', 'active').eq('state', state).eq('city', city).limit(1000);
    const byId = new Map((data ?? []).map((p: any) => [p.id, p]));
    const ordered = [
      ...richIds.map((id) => byId.get(id)).filter(Boolean),
      ...(data ?? []).filter((p: any) => !richIds.includes(p.id)),
    ];
    return this.sortContentFirst(await this.enrichSummaries(ordered)).slice(0, 60);
  }

  async feed(): Promise<FeedItem[]> {
    // Approved reviews that carry playable media, newest first, with property context.
    const { data } = await this.db
      .from('canonical_review')
      .select('id, title, life_stage, has_video, media_asset_id, embed_url, embed_platform, trust_tier, source, created_at, resident_id, author_pseudonym, canonical_property:canonical_property_id(id, name, city, state), resident:resident_id(display_name, pseudonym)')
      .eq('moderation_status', 'approved')
      .or('media_asset_id.not.is.null,embed_url.not.is.null')
      .order('created_at', { ascending: false })
      .limit(60);
    const reviewItems = (data ?? []).map((r: any) => ({
      id: r.id,
      source: r.embed_url ? 'imported' : (r.source === 'official' ? 'official' : 'resident'),
      title: r.title,
      embedUrl: r.embed_url ?? undefined,
      platform: r.embed_platform ?? undefined,
      category: deriveCategory(r.life_stage, null, !!r.embed_url),
      verified: r.trust_tier === 'verified_resident',
      propertyId: r.canonical_property?.id ?? '',
      propertyName: r.canonical_property?.name ?? 'Property',
      location: [r.canonical_property?.city, r.canonical_property?.state].filter(Boolean).join(', '),
      creatorId: r.resident_id ?? undefined,
      creatorName: r.resident?.display_name ?? r.resident?.pseudonym ?? r.author_pseudonym ?? undefined,
    }));
    if (reviewItems.length > 0) return reviewItems;

    // Launch fallback: until resident videos exist, make the entertainment feed
    // alive with official/public seeded visuals. These are clearly official
    // source items, not resident truth and not Truth Score inputs.
    const { data: channels } = await this.db
      .from('property_channel')
      .select('id, kind, url, label, created_at, canonical_property:canonical_property_id(id, name, city, state)')
      .in('kind', ['gallery', 'matterport', 'youtube', 'instagram', 'tiktok'])
      .limit(500);

    const visual = (channels ?? []).filter((c: any) =>
      c.kind === 'matterport' ||
      c.kind === 'youtube' ||
      c.kind === 'tiktok' ||
      (c.kind === 'instagram' && /instagram\.com\/(p|reel|tv)\//i.test(c.url)) ||
      (c.kind === 'gallery' && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(c.url)),
    );

    const sortedVisual = visual.sort((a: any, b: any) => {
      const rank = (x: any) => x.kind === 'gallery' ? 5 : x.kind === 'matterport' ? 4 : x.kind === 'instagram' ? 3 : 2;
      return rank(b) - rank(a);
    }).slice(0, 120);

    return sortedVisual.map((c: any) => ({
      id: c.id,
      source: 'official',
      title: c.label && !String(c.label).startsWith('Apify') ? c.label : `${c.canonical_property?.name ?? 'Property'} official ${c.kind}`,
      thumbnailUrl: c.kind === 'gallery' ? c.url : undefined,
      embedUrl: c.kind === 'matterport' ? c.url : undefined,
      platform: c.kind,
      category: c.kind === 'gallery' || c.kind === 'matterport' ? 'Luxury tours' : 'Would you live here?',
      verified: false,
      propertyId: c.canonical_property?.id ?? '',
      propertyName: c.canonical_property?.name ?? 'Property',
      location: [c.canonical_property?.city, c.canonical_property?.state].filter(Boolean).join(', '),
      creatorName: 'Official · Public source',
    }));
  }
}

let cached: PropertyDataProvider | null = null;

export function getPropertyProvider(): PropertyDataProvider {
  if (cached) return cached;
  cached = useCanonicalData()
    ? new CanonicalPropertyProvider()
    : new MockPropertyProvider();
  return cached;
}
