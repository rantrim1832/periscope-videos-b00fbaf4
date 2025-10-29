-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  rentcast_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  property_id UUID REFERENCES public.properties,
  video_url TEXT,
  embed_code TEXT,
  title TEXT NOT NULL,
  caption TEXT,
  tags TEXT[],
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  city TEXT,
  is_positive BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shorts table for viral apartment content
CREATE TABLE public.shorts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES public.reviews,
  embed_url TEXT NOT NULL,
  title TEXT NOT NULL,
  tags TEXT[],
  city TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  source TEXT DEFAULT 'taggbox',
  moderation_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shorts ENABLE ROW LEVEL SECURITY;

-- Properties policies (public read, authenticated write)
CREATE POLICY "Anyone can view properties"
  ON public.properties FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create properties"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Shorts policies
CREATE POLICY "Anyone can view approved shorts"
  ON public.shorts FOR SELECT
  USING (moderation_status = 'approved');

CREATE POLICY "Admins can view all shorts"
  ON public.shorts FOR SELECT
  USING (true);

CREATE POLICY "System can insert shorts"
  ON public.shorts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update shorts"
  ON public.shorts FOR UPDATE
  USING (true);

-- Create indexes
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_reviews_property_id ON public.reviews(property_id);
CREATE INDEX idx_reviews_is_positive ON public.reviews(is_positive);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_shorts_moderation_status ON public.shorts(moderation_status);
CREATE INDEX idx_shorts_created_at ON public.shorts(created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_seeded_videos_updated_at();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_seeded_videos_updated_at();