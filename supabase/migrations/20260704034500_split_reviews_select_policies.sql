-- Security scanner compatibility: keep non-admin review visibility limited to
-- approved reviews or the review owner's own rows. Admin access is a separate
-- SELECT policy so the public/owner policy is unambiguous.

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;

CREATE POLICY "Public can view approved or own reviews"
ON public.reviews
FOR SELECT
USING (
  moderation_status = 'approved'
  OR auth.uid() = user_id
);

CREATE POLICY "Admins can view all reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
