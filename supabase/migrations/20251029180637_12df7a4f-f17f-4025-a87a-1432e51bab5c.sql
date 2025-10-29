-- Create seeded_videos table for imported content from Taggbox
CREATE TABLE public.seeded_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  embed_url TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  city TEXT,
  source TEXT NOT NULL DEFAULT 'taggbox',
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  is_positive BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.seeded_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view approved videos
CREATE POLICY "Anyone can view approved seeded videos" 
ON public.seeded_videos 
FOR SELECT 
USING (moderation_status = 'approved');

-- Policy: Admins can view all videos (we'll add auth later)
CREATE POLICY "Admins can view all seeded videos" 
ON public.seeded_videos 
FOR SELECT 
USING (true);

-- Policy: Admins can update moderation status
CREATE POLICY "Admins can update seeded videos" 
ON public.seeded_videos 
FOR UPDATE 
USING (true);

-- Policy: System can insert new videos from webhook
CREATE POLICY "System can insert seeded videos" 
ON public.seeded_videos 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_seeded_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_seeded_videos_updated_at
BEFORE UPDATE ON public.seeded_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_seeded_videos_updated_at();

-- Create index for faster queries
CREATE INDEX idx_seeded_videos_moderation_status ON public.seeded_videos(moderation_status);
CREATE INDEX idx_seeded_videos_city ON public.seeded_videos(city);
CREATE INDEX idx_seeded_videos_is_positive ON public.seeded_videos(is_positive);