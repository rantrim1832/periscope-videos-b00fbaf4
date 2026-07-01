import { supabase } from '@/integrations/supabase/client';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type WatchType = 'property' | 'city';

export async function isWatching(type: WatchType, id: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await (supabase as any).from('watch').select('id').eq('user_id', user.id).eq('entity_type', type).eq('entity_id', id).maybeSingle();
  return !!data;
}

export async function toggleWatch(type: WatchType, id: string, label: string, on: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to follow');
  const db = supabase as any;
  if (on) {
    await db.from('watch').insert({ user_id: user.id, entity_type: type, entity_id: id, label });
  } else {
    await db.from('watch').delete().eq('user_id', user.id).eq('entity_type', type).eq('entity_id', id);
  }
}

export interface WatchedActivity {
  reviewId: string;
  title: string;
  propertyId: string;
  propertyName: string;
  createdAt: string;
  hasVideo: boolean;
}

// Recent activity from everything the current user watches — the "what's new" feed.
export async function getFollowingActivity(): Promise<{ watchedProperties: { id: string; label: string }[]; activity: WatchedActivity[] }> {
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { watchedProperties: [], activity: [] };

  const { data: watches } = await db.from('watch').select('entity_type, entity_id, label').eq('user_id', user.id).eq('entity_type', 'property');
  const propIds = (watches ?? []).map((w: any) => w.entity_id);
  const watchedProperties = (watches ?? []).map((w: any) => ({ id: w.entity_id, label: w.label ?? 'Property' }));
  if (propIds.length === 0) return { watchedProperties, activity: [] };

  const { data: reviews } = await db.from('canonical_review')
    .select('id, title, has_video, created_at, canonical_property:canonical_property_id(id, name)')
    .in('canonical_property_id', propIds).eq('moderation_status', 'approved')
    .order('created_at', { ascending: false }).limit(40);

  const activity: WatchedActivity[] = (reviews ?? []).map((r: any) => ({
    reviewId: r.id, title: r.title, hasVideo: !!r.has_video, createdAt: r.created_at,
    propertyId: r.canonical_property?.id ?? '', propertyName: r.canonical_property?.name ?? 'Property',
  }));
  return { watchedProperties, activity };
}
