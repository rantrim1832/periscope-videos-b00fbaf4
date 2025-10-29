-- Add AI moderation fields to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS moderation_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_flags jsonb DEFAULT '[]'::jsonb;

-- Add AI moderation fields to shorts table
ALTER TABLE public.shorts 
ADD COLUMN IF NOT EXISTS moderation_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_flags jsonb DEFAULT '[]'::jsonb;

-- Add index for moderation queries
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_score ON public.reviews(moderation_score);
CREATE INDEX IF NOT EXISTS idx_shorts_moderation_score ON public.shorts(moderation_score);