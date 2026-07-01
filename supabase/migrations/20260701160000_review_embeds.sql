-- Embedded social content on reviews (content-density lever).
-- We store the embed URL + platform for publicly-posted social video attached to
-- a property. We never store the video bytes — embedding only (ToS-compliant,
-- attribution preserved).

ALTER TABLE public.canonical_review
  ADD COLUMN IF NOT EXISTS embed_url text,
  ADD COLUMN IF NOT EXISTS embed_platform text;
