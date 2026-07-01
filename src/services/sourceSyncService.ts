// Connected-source sync service (manager-facing). Client-side orchestration for
// the demo/MVP: connect a source, run a sync (mock provider discovers content
// into the pending queue), preview/approve/reject. Production auto-sync runs
// server-side on a schedule with OAuth tokens (see docs/CONNECTED_SOURCES.md).

import { supabase } from '@/integrations/supabase/client';
import { getSourceProvider, type SourceKind } from './providers/socialSource';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ConnectedSource {
  id: string;
  kind: SourceKind;
  handle: string;
  status: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
}

export interface SyncedContentItem {
  id: string;
  kind: string;
  title: string | null;
  embedUrl: string | null;
  permalink: string;
  publishedAt: string | null;
  status: string;
}

const db = () => supabase as any;

export async function listConnectedSources(propertyId: string): Promise<ConnectedSource[]> {
  const { data } = await db().from('connected_source').select('*').eq('canonical_property_id', propertyId).order('created_at');
  return (data ?? []).map((s: any) => ({
    id: s.id, kind: s.kind, handle: s.handle, status: s.status, autoSync: s.auto_sync, lastSyncedAt: s.last_synced_at,
  }));
}

export async function connectSource(propertyId: string, kind: SourceKind, handle: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await db().from('connected_source').insert({
    canonical_property_id: propertyId, kind, handle, connected_by_user_id: user?.id ?? null,
  });
  if (error) throw error;
}

// Run a sync: discover recent content via the provider, upsert into the pending
// queue, stamp last_synced_at.
export async function syncSource(source: ConnectedSource, propertyId: string): Promise<number> {
  const items = await getSourceProvider(source.kind).listRecent(source.handle);
  let added = 0;
  for (const it of items) {
    const { error } = await db().from('synced_content').upsert({
      connected_source_id: source.id,
      canonical_property_id: propertyId,
      kind: it.kind,
      external_id: it.externalId,
      title: it.title,
      embed_url: it.embedUrl ?? null,
      thumbnail_url: it.thumbnailUrl ?? null,
      permalink: it.permalink,
      published_at: it.publishedAt,
      status: 'pending',
    }, { onConflict: 'connected_source_id,external_id', ignoreDuplicates: true });
    if (!error) added++;
  }
  await db().from('connected_source').update({ last_synced_at: new Date().toISOString() }).eq('id', source.id);
  return added;
}

export async function listQueue(propertyId: string, status = 'pending'): Promise<SyncedContentItem[]> {
  const { data } = await db().from('synced_content').select('*').eq('canonical_property_id', propertyId).eq('status', status).order('published_at', { ascending: false });
  return (data ?? []).map((s: any) => ({
    id: s.id, kind: s.kind, title: s.title, embedUrl: s.embed_url, permalink: s.permalink, publishedAt: s.published_at, status: s.status,
  }));
}

export async function reviewItem(id: string, status: 'approved' | 'rejected'): Promise<void> {
  // Approving fires the DB trigger → publishes as Official · Verified.
  const { error } = await db().from('synced_content').update({ status }).eq('id', id);
  if (error) throw error;
}
