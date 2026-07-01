-- =====================================================================
-- OFFICIAL PROPERTY CHANNELS (content-density: communities as source)
-- =====================================================================
-- A property's own public presence — website, socials, virtual tours — attached
-- to the canonical property. We LINK and EMBED (no re-host). Pre-claim these are
-- labeled "Official · Public" (found on the property's public channels); after a
-- verified manager claim they become "Official · Verified" and the operator
-- manages them. Never implies endorsement until claimed.
-- =====================================================================

CREATE TABLE public.property_channel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_property_id uuid NOT NULL REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  kind text NOT NULL,          -- website|instagram|facebook|tiktok|youtube|matterport|gallery
  url text NOT NULL,
  embed_url text,              -- iframe src when embeddable (video/matterport)
  label text,
  is_verified boolean NOT NULL DEFAULT false,  -- true once claimed & verified
  source text NOT NULL DEFAULT 'seed',         -- 'seed' | 'claim' | 'admin'
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_channel_property ON public.property_channel (canonical_property_id);

ALTER TABLE public.property_channel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view property channels"
  ON public.property_channel FOR SELECT USING (true);
CREATE POLICY "Admins manage property channels"
  ON public.property_channel FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- (Claimed-manager write access is added with the claim system.)
