-- =====================================================================
-- PHASE 0 — SECURITY HARDENING
-- Remediates the critical findings from the repository audit:
--   1. Self-service admin privilege escalation
--   2. Fail-open ("USING (true)") admin/system RLS policies
--   3. Conflicting permissive property visibility policy
--   4. Over-broad review/limits/log/import visibility & writes
--   5. Broken admin moderation (could not update seeded content)
--
-- Governing principle: every privileged policy must call
-- public.has_role(auth.uid(), 'admin'). Service-role callers
-- (edge functions) bypass RLS and therefore need no permissive
-- public policies.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. user_roles — kill self-admin escalation
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create their own admin role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Only existing admins may grant roles. The very first admin must be
-- seeded out-of-band (Supabase SQL editor), which is the secure pattern.
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 2. properties — drop permissive visibility, enforce approved-or-owner,
--    grant admins full moderation control
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view approved properties" ON public.properties;

CREATE POLICY "Public can view approved properties"
ON public.properties
FOR SELECT
USING (
  status = 'approved'
  OR auth.uid() = created_by_user_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update properties"
ON public.properties
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete properties"
ON public.properties
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 3. reviews — tighten visibility, fix admin moderation, scope inserts
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "System can insert seeded reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;

CREATE POLICY "Public can view approved reviews"
ON public.reviews
FOR SELECT
USING (
  moderation_status = 'approved'
  OR auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

-- Authenticated users create their own reviews. Seeded content is
-- inserted by edge functions via the service role (bypasses RLS).
CREATE POLICY "Users can create own reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fixes broken moderation: seeded reviews have user_id = NULL, so the
-- "own reviews" update policy never matched. Admins can now moderate.
CREATE POLICY "Admins can update any review"
ON public.reviews
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 4. shorts — replace USING(true) admin policies with role checks
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all shorts" ON public.shorts;
DROP POLICY IF EXISTS "Admins can update shorts" ON public.shorts;
DROP POLICY IF EXISTS "System can insert shorts" ON public.shorts;

CREATE POLICY "Admins can view all shorts"
ON public.shorts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update shorts"
ON public.shorts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
-- (public SELECT of approved shorts policy retained; inserts via service role)

-- ---------------------------------------------------------------------
-- 5. seeded_videos — replace USING(true) admin policies with role checks
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all seeded videos" ON public.seeded_videos;
DROP POLICY IF EXISTS "Admins can update seeded videos" ON public.seeded_videos;
DROP POLICY IF EXISTS "System can insert seeded videos" ON public.seeded_videos;

CREATE POLICY "Admins can view all seeded videos"
ON public.seeded_videos
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update seeded videos"
ON public.seeded_videos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
-- (public SELECT of approved seeded videos retained; inserts via service role)

-- ---------------------------------------------------------------------
-- 6. user_verifications — replace USING(true) admin policies
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.user_verifications;
DROP POLICY IF EXISTS "Admins can update verifications" ON public.user_verifications;

CREATE POLICY "Admins can view all verifications"
ON public.user_verifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verifications"
ON public.user_verifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 7. user_limits — remove world-writable anti-spam table policy
--    (managed exclusively by edge functions via service role)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "System can manage limits" ON public.user_limits;

CREATE POLICY "Admins can manage limits"
ON public.user_limits
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- (users retain view-own; service role bypasses RLS for trigger writes)

-- ---------------------------------------------------------------------
-- 8. scrape_logs — admin-only visibility, no public insert
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all scrape logs" ON public.scrape_logs;
DROP POLICY IF EXISTS "System can insert scrape logs" ON public.scrape_logs;

CREATE POLICY "Admins can view all scrape logs"
ON public.scrape_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
-- (inserts performed by edge functions via service role)

-- ---------------------------------------------------------------------
-- 9. imported_properties — PRIVATE BY DEFAULT (strategy: management/
--    ownership data is not public). Admin-only visibility.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view imported properties" ON public.imported_properties;

CREATE POLICY "Admins can view imported properties"
ON public.imported_properties
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
-- (insert/update/delete-own policies retained for CSV import workflow)
