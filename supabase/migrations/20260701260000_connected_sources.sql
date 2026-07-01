-- =====================================================================
-- CONNECTED SOURCES + OFFICIAL CONTENT SYNC
-- =====================================================================
-- Verified managers connect their existing channels (IG/FB/TikTok/YouTube/
-- website/Matterport); we discover content, they preview/approve it, and it
-- publishes as Official · Verified — with future auto-sync. Resident truth
-- stays independent; managers can never edit/delete it (safety rule, #21).
--
-- SECURITY: OAuth tokens are NOT stored here — `access_ref` references a secret
-- held in Supabase Vault / edge secrets. This table holds only metadata.
-- =====================================================================

CREATE TABLE public.connected_source (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_property_id uuid NOT NULL REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  kind text NOT NULL,                 -- instagram|facebook|tiktok|youtube|website|matterport
  handle text NOT NULL,               -- account handle / channel id / url
  access_ref text,                    -- reference to a secret (never the token)
  status text NOT NULL DEFAULT 'connected',  -- connected|error|disconnected
  auto_sync boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  connected_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canonical_property_id, kind, handle)
);
CREATE INDEX idx_connected_source_property ON public.connected_source (canonical_property_id);

CREATE TABLE public.synced_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connected_source_id uuid NOT NULL REFERENCES public.connected_source(id) ON DELETE CASCADE,
  canonical_property_id uuid NOT NULL REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  kind text NOT NULL,
  external_id text NOT NULL,
  title text,
  embed_url text,
  thumbnail_url text,
  permalink text NOT NULL,            -- attribution/source link (preserved)
  published_at timestamptz,
  status text NOT NULL DEFAULT 'pending',  -- pending|approved|rejected
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connected_source_id, external_id)
);
CREATE INDEX idx_synced_content_property ON public.synced_content (canonical_property_id, status);

ALTER TABLE public.connected_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_content   ENABLE ROW LEVEL SECURITY;

-- Only verified managers of the property (or admins) manage sources & queue.
CREATE POLICY "Managers manage connected sources" ON public.connected_source FOR ALL TO authenticated
  USING (public.has_property_manager(auth.uid(), canonical_property_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_property_manager(auth.uid(), canonical_property_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers manage synced content" ON public.synced_content FOR ALL TO authenticated
  USING (public.has_property_manager(auth.uid(), canonical_property_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_property_manager(auth.uid(), canonical_property_id) OR public.has_role(auth.uid(), 'admin'));

-- On approval → publish as Official · Verified via property_channel (embed,
-- attribution preserved), log a timeline event. Never touches resident content.
CREATE OR REPLACE FUNCTION public.trg_synced_content_approved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    INSERT INTO public.property_channel (canonical_property_id, kind, url, embed_url, label, is_verified, source)
    VALUES (NEW.canonical_property_id, NEW.kind, NEW.permalink, NEW.embed_url, NEW.title, true, 'sync')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.property_event (canonical_property_id, kind, label)
    VALUES (NEW.canonical_property_id, 'note', 'Official content synced from ' || NEW.kind);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_synced_content_approved
  AFTER UPDATE ON public.synced_content
  FOR EACH ROW EXECUTE FUNCTION public.trg_synced_content_approved();
