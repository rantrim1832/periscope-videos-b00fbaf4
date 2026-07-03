
-- scrape_logs: admin-only view
DROP POLICY IF EXISTS "Admins can view all scrape logs" ON public.scrape_logs;
CREATE POLICY "Admins can view all scrape logs"
ON public.scrape_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- seeded_videos: admin-only view/update of all rows
DROP POLICY IF EXISTS "Admins can view all seeded videos" ON public.seeded_videos;
DROP POLICY IF EXISTS "Admins can update seeded videos" ON public.seeded_videos;
CREATE POLICY "Admins can view all seeded videos"
ON public.seeded_videos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update seeded videos"
ON public.seeded_videos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- shorts: admin-only view/update of all rows
DROP POLICY IF EXISTS "Admins can view all shorts" ON public.shorts;
DROP POLICY IF EXISTS "Admins can update shorts" ON public.shorts;
CREATE POLICY "Admins can view all shorts"
ON public.shorts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update shorts"
ON public.shorts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
