
-- Remove NYC/Brooklyn-focused queries (in NYC, "apartment" often means a house/brownstone)
UPDATE public.curated_categories
SET suggested_queries = '["apartment neighborhood safety review", "downtown la apartment area vibe", "chicago apartment neighborhood tour", "austin apartment neighborhood guide", "atlanta apartment neighborhood tour"]'::jsonb
WHERE slug = 'local-vibe';

UPDATE public.curated_categories
SET suggested_queries = '["la luxury apartment tour", "chicago high rise apartment tour", "apartment tour before signing", "miami luxury apartment tour", "seattle apartment tour", "dallas apartment tour"]'::jsonb
WHERE slug = 'tours';

-- Purge already-seeded videos that are Airbnb content or NYC/Brooklyn/Manhattan
DELETE FROM public.seeded_videos
WHERE source = 'youtube'
  AND (
    title ILIKE '%airbnb%' OR title ILIKE '%air bnb%' OR title ILIKE '%bnb %'
    OR caption ILIKE '%airbnb%' OR caption ILIKE '%air bnb%'
    OR title ILIKE '%brooklyn%' OR title ILIKE '%manhattan%'
    OR title ILIKE '% nyc %' OR title ILIKE 'nyc %' OR title ILIKE '% nyc'
    OR title ILIKE '%new york city%' OR title ILIKE '%brownstone%'
    OR caption ILIKE '%brooklyn%' OR caption ILIKE '%manhattan%'
  );
