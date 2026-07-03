DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;

DROP POLICY IF EXISTS "Admins can update verifications" ON public.user_verifications;
CREATE POLICY "Admins can update verifications" ON public.user_verifications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));