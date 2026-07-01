-- =====================================================================
-- PROPERTY TIMELINE
-- =====================================================================
-- A longitudinal, public record of what changed and when — the moat feature
-- ("the score dropped after the 2024 management change"). Score-change events
-- are logged automatically via a trigger on the rating aggregate, so the
-- timeline populates itself as reviews accrue. Management/renovation/incident
-- events are inserted by the ingestion / claim / admin flows.
-- =====================================================================

CREATE TABLE public.property_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_property_id uuid NOT NULL REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  event_date date NOT NULL DEFAULT current_date,
  kind text NOT NULL,           -- 'management_change' | 'renovation' | 'score_change' | 'incident' | 'note'
  label text NOT NULL,
  delta integer,                -- score delta for 'score_change'
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_event_property ON public.property_event (canonical_property_id, event_date DESC);

ALTER TABLE public.property_event ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view property events"
  ON public.property_event FOR SELECT USING (true);
CREATE POLICY "Admins manage property events"
  ON public.property_event FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-log a score_change event whenever the cached Truth Score moves.
CREATE OR REPLACE FUNCTION public.trg_log_score_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.truth_score IS NOT NULL
     AND OLD.truth_score IS NOT NULL
     AND NEW.truth_score IS DISTINCT FROM OLD.truth_score THEN
    INSERT INTO public.property_event (canonical_property_id, kind, label, delta)
    VALUES (
      NEW.canonical_property_id,
      'score_change',
      CASE WHEN NEW.truth_score > OLD.truth_score
           THEN 'Truth Score rose as residents contributed'
           ELSE 'Truth Score fell as residents contributed' END,
      NEW.truth_score - OLD.truth_score
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_aggregate_score_change
  AFTER UPDATE ON public.property_rating_aggregate
  FOR EACH ROW EXECUTE FUNCTION public.trg_log_score_change();
