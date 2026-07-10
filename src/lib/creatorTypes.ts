export type CreatorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface CreatorChannel {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  youtube_channel_id: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
  verified: boolean;
  verification_code: string | null;
  verified_at: string | null;
  featured: boolean;
  status: CreatorStatus;
  created_at: string;
  updated_at: string;
}

export interface CreatorSubmission {
  id: string;
  creator_id: string;
  kind: 'youtube_url' | 'native_upload';
  youtube_url: string | null;
  youtube_video_id: string | null;
  storage_path: string | null;
  title: string | null;
  description: string | null;
  hashtags: string[] | null;
  property_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function slugifyHandle(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `PERISCOPE-VERIFY-${out}`;
}