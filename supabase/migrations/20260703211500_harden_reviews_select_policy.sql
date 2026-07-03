-- Security: pending/rejected/flagged legacy reviews must not be visible to
-- every authenticated user. Public users can read approved reviews; authors can
-- read their own non-approved reviews; admins can moderate everything.

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;

CREATE POLICY "Public can view approved reviews"
ON public.reviews
FOR SELECT
USING (
  moderation_status = 'approved'
  OR auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
