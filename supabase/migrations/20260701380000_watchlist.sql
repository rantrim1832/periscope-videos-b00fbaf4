-- =====================================================================
-- WATCHLIST (the return loop)
-- =====================================================================
-- Users watch properties and cities (creators use creator_follow). New activity
-- on a watched entity generates a notification → a reason to return tomorrow.
-- =====================================================================

CREATE TABLE public.watch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,   -- 'property' | 'city'
  entity_id text NOT NULL,     -- property uuid, or "STATE|City"
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);
CREATE INDEX idx_watch_user ON public.watch (user_id);
CREATE INDEX idx_watch_entity ON public.watch (entity_type, entity_id);

ALTER TABLE public.watch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watches" ON public.watch FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- New approved review on a watched property → notify watchers.
CREATE OR REPLACE FUNCTION public.trg_notify_watchers_review()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.moderation_status = 'approved' AND OLD.moderation_status <> 'approved' THEN
    INSERT INTO public.notification (user_id, type, review_id, message)
    SELECT w.user_id, 'watch_activity', NEW.id, 'New review at a property you follow'
    FROM public.watch w
    WHERE w.entity_type = 'property' AND w.entity_id = NEW.canonical_property_id::text
      AND w.user_id <> COALESCE(NEW.resident_id, '00000000-0000-0000-0000-000000000000');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_review_notify_watchers
  AFTER UPDATE ON public.canonical_review
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_watchers_review();

-- Truth Score change on a watched property → notify watchers.
CREATE OR REPLACE FUNCTION public.trg_notify_watchers_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.truth_score IS DISTINCT FROM OLD.truth_score AND NEW.truth_score IS NOT NULL AND OLD.truth_score IS NOT NULL THEN
    INSERT INTO public.notification (user_id, type, message)
    SELECT w.user_id, 'watch_activity',
           'Truth Score ' || (CASE WHEN NEW.truth_score > OLD.truth_score THEN 'rose' ELSE 'fell' END) || ' at a property you follow'
    FROM public.watch w
    WHERE w.entity_type = 'property' AND w.entity_id = NEW.canonical_property_id::text;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_aggregate_notify_watchers
  AFTER UPDATE ON public.property_rating_aggregate
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_watchers_score();
