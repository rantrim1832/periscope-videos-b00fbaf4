
DROP POLICY IF EXISTS "System can manage limits" ON public.user_limits;

DROP POLICY IF EXISTS "Users can create their own admin role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all verifications" ON public.user_verifications;
CREATE POLICY "Admins can view all verifications"
ON public.user_verifications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
