// Current-user profile data (own profile view).
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/lib/demo';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MyBadge { key: string; label: string; earnedAt: string }
export interface MyContribution { id: string; title: string; propertyId: string; propertyName: string; hasVideo: boolean; status: string; views: number }

export interface MyProfile {
  id: string;
  displayName: string | null;
  pseudonym: string | null;
  bio: string | null;
  trustTier: string;
  points: number;
  level: number;
  contributorReputation: number;
  followerCount: number;
  badges: MyBadge[];
  contributions: MyContribution[];
}

export async function getMyProfile(): Promise<MyProfile | null> {
  if (isDemoMode()) return null;
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: p } = await db.from('resident_profile').select('*').eq('id', user.id).maybeSingle();
  if (!p) return null;

  const [{ data: badges }, { count: followerCount }, { data: reviews }] = await Promise.all([
    db.from('resident_badge').select('*').eq('resident_id', user.id).order('earned_at', { ascending: false }),
    db.from('creator_follow').select('*', { count: 'exact', head: true }).eq('creator_id', user.id),
    db.from('canonical_review')
      .select('id, title, has_video, moderation_status, views, canonical_property:canonical_property_id(id, name)')
      .eq('resident_id', user.id).order('created_at', { ascending: false }).limit(50),
  ]);

  return {
    id: p.id,
    displayName: p.display_name ?? null,
    pseudonym: p.pseudonym ?? null,
    bio: p.bio ?? null,
    trustTier: p.trust_tier,
    points: p.points ?? 0,
    level: p.level ?? 1,
    contributorReputation: p.contributor_reputation ?? 0,
    followerCount: followerCount ?? 0,
    badges: (badges ?? []).map((b: any) => ({ key: b.badge_key, label: b.label, earnedAt: b.earned_at })),
    contributions: (reviews ?? []).map((r: any) => ({
      id: r.id, title: r.title, propertyId: r.canonical_property?.id ?? '',
      propertyName: r.canonical_property?.name ?? 'Property', hasVideo: !!r.has_video,
      status: r.moderation_status, views: r.views ?? 0,
    })),
  };
}
