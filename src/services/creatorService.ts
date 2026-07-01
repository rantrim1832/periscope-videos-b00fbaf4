// Creator/Investigator profile data access. Uses the browser Supabase client
// (canonical mode); returns null in mock mode so the UI shows an intentional
// "available with live data" state.

import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/lib/demo';
import type { FeedItem } from '@/domain/property';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CreatorExpertise { domain: string; scope: string | null; score: number }

export interface CreatorProfile {
  id: string;
  displayName: string | null;
  pseudonym: string | null;
  bio: string | null;
  avatarUrl: string | null;
  creatorType: string | null;
  trustTier: string;
  contributorReputation: number;
  followerCount: number;
  isFollowing: boolean;
  expertise: CreatorExpertise[];
  content: FeedItem[];
}

export async function getCreator(id: string): Promise<CreatorProfile | null> {
  if (isDemoMode()) return null;
  const db = supabase as any;

  const { data: profile } = await db.from('resident_profile').select('*').eq('id', id).maybeSingle();
  if (!profile) return null;

  const [{ count: followerCount }, { data: expertise }, { data: { user } }] = await Promise.all([
    db.from('creator_follow').select('*', { count: 'exact', head: true }).eq('creator_id', id),
    db.from('resident_expertise').select('*').eq('resident_id', id),
    supabase.auth.getUser(),
  ]);

  let isFollowing = false;
  if (user) {
    const { data } = await db.from('creator_follow').select('id').eq('creator_id', id).eq('follower_user_id', user.id).maybeSingle();
    isFollowing = !!data;
  }

  const { data: reviews } = await db.from('canonical_review')
    .select('id, title, life_stage, has_video, media_asset_id, embed_url, embed_platform, source, canonical_property:canonical_property_id(id, name, city, state)')
    .eq('resident_id', id).eq('moderation_status', 'approved')
    .order('created_at', { ascending: false }).limit(24);

  const content: FeedItem[] = (reviews ?? [])
    .filter((r: any) => r.media_asset_id || r.embed_url)
    .map((r: any) => ({
      id: r.id,
      source: r.embed_url ? 'imported' : 'resident',
      title: r.title,
      embedUrl: r.embed_url ?? undefined,
      platform: r.embed_platform ?? undefined,
      propertyId: r.canonical_property?.id ?? '',
      propertyName: r.canonical_property?.name ?? 'Property',
      location: [r.canonical_property?.city, r.canonical_property?.state].filter(Boolean).join(', '),
    }));

  return {
    id: profile.id,
    displayName: profile.display_name ?? null,
    pseudonym: profile.pseudonym ?? null,
    bio: profile.bio ?? null,
    avatarUrl: profile.avatar_url ?? null,
    creatorType: profile.creator_type ?? null,
    trustTier: profile.trust_tier,
    contributorReputation: profile.contributor_reputation ?? 0,
    followerCount: followerCount ?? 0,
    isFollowing,
    expertise: (expertise ?? []).map((e: any) => ({ domain: e.domain, scope: e.scope ?? null, score: e.score ?? 0 })),
    content,
  };
}

export async function toggleFollow(creatorId: string, follow: boolean): Promise<void> {
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to follow creators');
  if (follow) {
    await db.from('creator_follow').insert({ creator_id: creatorId, follower_user_id: user.id });
  } else {
    await db.from('creator_follow').delete().eq('creator_id', creatorId).eq('follower_user_id', user.id);
  }
}
