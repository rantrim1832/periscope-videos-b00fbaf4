-- =====================================================================
-- CREATOR / INVESTIGATOR PROGRAM
-- =====================================================================
-- Turns the best contributors into a durable, followable creator class
-- (tour creators, investigators, neighborhood creators, reviewers). Attribution
-- + follows power the entertainment feed's supply and retention.
-- =====================================================================

ALTER TABLE public.resident_profile
  ADD COLUMN IF NOT EXISTS creator_type text,     -- 'tour'|'investigator'|'neighborhood'|'reviewer'
  ADD COLUMN IF NOT EXISTS is_creator boolean NOT NULL DEFAULT false;

CREATE TABLE public.creator_follow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.resident_profile(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_user_id, creator_id)
);
CREATE INDEX idx_creator_follow_creator ON public.creator_follow (creator_id);
CREATE INDEX idx_creator_follow_follower ON public.creator_follow (follower_user_id);

ALTER TABLE public.creator_follow ENABLE ROW LEVEL SECURITY;

-- Follower relationships are public (follower counts); users manage their own.
CREATE POLICY "Public can view follows" ON public.creator_follow FOR SELECT USING (true);
CREATE POLICY "Users manage own follows" ON public.creator_follow FOR ALL TO authenticated
  USING (auth.uid() = follower_user_id)
  WITH CHECK (auth.uid() = follower_user_id);
