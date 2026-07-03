-- Fix: Remove public read access on imported_properties (sensitive data exposure)
-- The "Anyone can view imported properties" policy allowed unauthenticated users
-- to read all rows including importer identity, contacts, phone numbers, financials.

DROP POLICY IF EXISTS "Anyone can view imported properties" ON public.imported_properties;

-- Replace with restricted SELECT: only the importer or admins can read
CREATE POLICY "Importers and admins can view imported properties"
ON public.imported_properties
FOR SELECT
TO authenticated
USING (
  (auth.uid() = imported_by_user_id)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Tighten INSERT policy to authenticated only (was scoped to public)
DROP POLICY IF EXISTS "Authenticated users can create imported properties" ON public.imported_properties;
CREATE POLICY "Authenticated users can create imported properties"
ON public.imported_properties
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Tighten DELETE policy to authenticated only (was scoped to public)
DROP POLICY IF EXISTS "Users can delete own imported properties" ON public.imported_properties;
CREATE POLICY "Users can delete own imported properties"
ON public.imported_properties
FOR DELETE
TO authenticated
USING (auth.uid() = imported_by_user_id);

-- Tighten UPDATE policy to authenticated only (was scoped to public)
DROP POLICY IF EXISTS "Users can update own imported properties" ON public.imported_properties;
CREATE POLICY "Users can update own imported properties"
ON public.imported_properties
FOR UPDATE
TO authenticated
USING (auth.uid() = imported_by_user_id)
WITH CHECK (auth.uid() = imported_by_user_id);

-- Revoke anon access since no policy allows unauthenticated users anymore
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.imported_properties FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imported_properties TO authenticated;
GRANT ALL ON public.imported_properties TO service_role;