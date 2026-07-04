-- Allow public contact/report intake while preserving admin-only reads.
-- Public/anon submissions must not spoof another user's id; authenticated users
-- may attach their own user id, and anonymous submissions leave it null.

DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_message;
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_message
FOR INSERT
TO public
WITH CHECK (
  sender_user_id IS NULL
  OR sender_user_id = auth.uid()
);

DROP POLICY IF EXISTS "Anyone can submit safety reports" ON public.safety_report;
CREATE POLICY "Anyone can submit safety reports"
ON public.safety_report
FOR INSERT
TO public
WITH CHECK (
  reporter_user_id IS NULL
  OR reporter_user_id = auth.uid()
);

GRANT INSERT ON public.contact_message TO anon, authenticated;
GRANT INSERT ON public.safety_report TO anon, authenticated;
