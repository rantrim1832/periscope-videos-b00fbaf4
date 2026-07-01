-- =====================================================================
-- PROPERTY Q&A (community mechanic)
-- =====================================================================
-- Prospective renters ask; residents/managers answer. Public read; anyone
-- signed in can ask/answer. Answers from verified residents carry more weight
-- (surfaced in the UI). Does not touch reviews (separate from resident truth).
-- =====================================================================

CREATE TABLE public.property_question (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_property_id uuid NOT NULL REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  asker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_question_property ON public.property_question (canonical_property_id, created_at DESC);

CREATE TABLE public.property_answer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.property_question(id) ON DELETE CASCADE,
  responder_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_answer_question ON public.property_answer (question_id, created_at);

ALTER TABLE public.property_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_answer   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view questions" ON public.property_question FOR SELECT USING (true);
CREATE POLICY "Users ask questions" ON public.property_question FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = asker_user_id);

CREATE POLICY "Public can view answers" ON public.property_answer FOR SELECT USING (true);
CREATE POLICY "Users answer questions" ON public.property_answer FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = responder_user_id);
