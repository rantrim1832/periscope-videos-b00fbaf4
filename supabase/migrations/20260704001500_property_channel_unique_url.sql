-- Make seeded/imported official-public channels idempotent and fast to upsert.
-- Remove historical duplicates first, preserving the earliest row.

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY canonical_property_id, url
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.property_channel
)
DELETE FROM public.property_channel pc
USING ranked r
WHERE pc.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_property_channel_property_url
  ON public.property_channel (canonical_property_id, url);
