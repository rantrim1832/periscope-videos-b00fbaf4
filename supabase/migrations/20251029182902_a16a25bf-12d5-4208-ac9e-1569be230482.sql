-- Add source and moderation_status columns to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved';

-- Update RLS policies for reviews to handle seeded content moderation
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews" 
ON public.reviews 
FOR SELECT 
USING (moderation_status = 'approved' OR auth.uid() IS NOT NULL);

-- Allow system to insert seeded reviews
CREATE POLICY "System can insert seeded reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (source = 'seeded' OR auth.uid() IS NOT NULL);

-- Add index for faster queries on source and moderation_status
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON public.reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_reviews_source_moderation ON public.reviews(source, moderation_status);