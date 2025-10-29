-- Drop the restrictive admin-only insert policy
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Create a new policy that allows users to make themselves admin
CREATE POLICY "Users can create their own admin role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);