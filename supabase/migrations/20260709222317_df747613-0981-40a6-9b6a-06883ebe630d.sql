-- Fix missing GRANTs on curated_categories (frontend was getting "table not in schema cache")
GRANT SELECT ON public.curated_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curated_categories TO authenticated;
GRANT ALL ON public.curated_categories TO service_role;

-- Also ensure seeded_videos is reachable (defensive; no-op if already granted)
GRANT SELECT ON public.seeded_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seeded_videos TO authenticated;
GRANT ALL ON public.seeded_videos TO service_role;

-- Security fix: reviews SELECT policy currently exposes ALL reviews (incl. flagged/unmoderated
-- with ai_flags + moderation_score) to any signed-in user. Restrict unmoderated visibility to
-- the author and admins.
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews"
  ON public.reviews FOR SELECT
  USING (
    moderation_status = 'approved'
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );