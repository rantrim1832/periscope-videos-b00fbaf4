-- Review "helpful" votes — lightweight engagement signal.
CREATE TABLE public.review_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.canonical_review(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, user_id)
);
CREATE INDEX idx_review_helpful_review ON public.review_helpful (review_id);

ALTER TABLE public.review_helpful ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view helpful votes" ON public.review_helpful FOR SELECT USING (true);
CREATE POLICY "Users manage own helpful votes" ON public.review_helpful FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
