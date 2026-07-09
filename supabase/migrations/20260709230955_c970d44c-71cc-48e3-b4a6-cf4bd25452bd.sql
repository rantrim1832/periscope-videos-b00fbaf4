GRANT SELECT ON public.seeded_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seeded_videos TO authenticated;
GRANT ALL ON public.seeded_videos TO service_role;

DROP POLICY IF EXISTS "System can insert seeded videos" ON public.seeded_videos;
CREATE POLICY "Admins can insert seeded videos"
  ON public.seeded_videos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete seeded videos"
  ON public.seeded_videos FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));