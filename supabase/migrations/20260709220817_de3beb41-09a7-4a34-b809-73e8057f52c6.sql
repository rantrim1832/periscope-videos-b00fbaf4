
CREATE TABLE IF NOT EXISTS public.contact_message (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id uuid,
  sender_email text,
  topic text NOT NULL DEFAULT 'general',
  subject text NOT NULL,
  message text NOT NULL,
  source_url text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','resolved','spam')),
  admin_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_message
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS resolved_by uuid,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

GRANT INSERT ON public.contact_message TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_message TO authenticated;
GRANT ALL ON public.contact_message TO service_role;

ALTER TABLE public.contact_message ENABLE ROW LEVEL SECURITY;

-- Anyone can submit
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_message;
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_message FOR INSERT
  WITH CHECK (true);

-- Admins can read
DROP POLICY IF EXISTS "Admins can read contact messages" ON public.contact_message;
CREATE POLICY "Admins can read contact messages"
  ON public.contact_message FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_message;
CREATE POLICY "Admins can update contact messages"
  ON public.contact_message FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_message;
CREATE POLICY "Admins can delete contact messages"
  ON public.contact_message FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS contact_message_updated_at ON public.contact_message;
CREATE TRIGGER contact_message_updated_at
  BEFORE UPDATE ON public.contact_message
  FOR EACH ROW EXECUTE FUNCTION public.update_seeded_videos_updated_at();

CREATE INDEX idx_contact_message_status_created ON public.contact_message(status, created_at DESC);
