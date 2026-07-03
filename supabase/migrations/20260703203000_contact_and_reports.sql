CREATE TABLE IF NOT EXISTS public.contact_message (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_email text,
  topic text NOT NULL DEFAULT 'general',
  subject text NOT NULL,
  message text NOT NULL,
  source_url text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_message_topic_check CHECK (topic IN (
    'general', 'claim_help', 'safety', 'privacy', 'copyright', 'press', 'business'
  )),
  CONSTRAINT contact_message_status_check CHECK (status IN ('new', 'reviewing', 'resolved', 'closed'))
);

CREATE TABLE IF NOT EXISTS public.safety_report (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email text,
  report_type text NOT NULL,
  target_type text NOT NULL DEFAULT 'other',
  target_id text,
  target_url text,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT safety_report_type_check CHECK (report_type IN (
    'abuse', 'doxxing', 'threat', 'nudity', 'copyright', 'privacy', 'fake_content', 'property_info', 'other'
  )),
  CONSTRAINT safety_report_target_check CHECK (target_type IN (
    'property', 'review', 'video', 'comment', 'profile', 'source', 'other'
  )),
  CONSTRAINT safety_report_status_check CHECK (status IN ('new', 'reviewing', 'resolved', 'closed'))
);

ALTER TABLE public.contact_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_report ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_message;
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_message FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_message;
CREATE POLICY "Admins can view contact messages"
ON public.contact_message FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_message;
CREATE POLICY "Admins can update contact messages"
ON public.contact_message FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can submit safety reports" ON public.safety_report;
CREATE POLICY "Anyone can submit safety reports"
ON public.safety_report FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view safety reports" ON public.safety_report;
CREATE POLICY "Admins can view safety reports"
ON public.safety_report FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update safety reports" ON public.safety_report;
CREATE POLICY "Admins can update safety reports"
ON public.safety_report FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

GRANT INSERT ON public.contact_message TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_message TO authenticated;
GRANT ALL ON public.contact_message TO service_role;

GRANT INSERT ON public.safety_report TO anon, authenticated;
GRANT SELECT, UPDATE ON public.safety_report TO authenticated;
GRANT ALL ON public.safety_report TO service_role;
