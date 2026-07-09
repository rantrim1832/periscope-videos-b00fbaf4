
-- 1) property_videos: join between properties and seeded_videos
CREATE TABLE public.property_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  seeded_video_id UUID NOT NULL REFERENCES public.seeded_videos(id) ON DELETE CASCADE,
  confidence NUMERIC NOT NULL DEFAULT 0,
  match_reason TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (property_id, seeded_video_id)
);
CREATE INDEX idx_property_videos_property ON public.property_videos(property_id);
CREATE INDEX idx_property_videos_video ON public.property_videos(seeded_video_id);

GRANT SELECT ON public.property_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_videos TO authenticated;
GRANT ALL ON public.property_videos TO service_role;

ALTER TABLE public.property_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved property videos"
  ON public.property_videos FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Admins can view all property videos"
  ON public.property_videos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert property videos"
  ON public.property_videos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update property videos"
  ON public.property_videos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete property videos"
  ON public.property_videos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_property_videos_updated_at
  BEFORE UPDATE ON public.property_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_seeded_videos_updated_at();

-- 2) property_external_reviews: cached third-party reviews (Google, Yelp, etc.)
CREATE TABLE public.property_external_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  source TEXT NOT NULL,               -- 'google_places' | 'yelp' | ...
  source_review_id TEXT,              -- provider-side unique id when available
  source_url TEXT,
  author_name TEXT,
  author_url TEXT,
  rating NUMERIC,                     -- 1..5
  text TEXT,
  language TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  raw JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (property_id, source, source_review_id)
);
CREATE INDEX idx_prop_ext_reviews_property ON public.property_external_reviews(property_id);
CREATE INDEX idx_prop_ext_reviews_source ON public.property_external_reviews(source);

GRANT SELECT ON public.property_external_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_external_reviews TO authenticated;
GRANT ALL ON public.property_external_reviews TO service_role;

ALTER TABLE public.property_external_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view external reviews"
  ON public.property_external_reviews FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert external reviews"
  ON public.property_external_reviews FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update external reviews"
  ON public.property_external_reviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete external reviews"
  ON public.property_external_reviews FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_property_external_reviews_updated_at
  BEFORE UPDATE ON public.property_external_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_seeded_videos_updated_at();

-- 3) Cache a Google Places place_id on properties so we don't re-geocode
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS google_place_id TEXT;
CREATE INDEX IF NOT EXISTS idx_properties_google_place_id ON public.properties(google_place_id);
