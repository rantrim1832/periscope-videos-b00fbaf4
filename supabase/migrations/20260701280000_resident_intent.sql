-- Capture why a user joined, to route them to the right first experience.
ALTER TABLE public.resident_profile
  ADD COLUMN IF NOT EXISTS intent text;   -- 'renter' | 'resident' | 'manager' | 'creator'
