-- =====================================================================
-- CONTRIBUTOR FEEDBACK LOOP (the "return tomorrow" hook)
-- =====================================================================
-- View counts + notifications ("your review got a management reply / a new
-- follower / was published") so contributors have a reason to come back.
-- =====================================================================

ALTER TABLE public.canonical_review ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- Public, rate-limitable view increment (security definer so anyone can bump a
-- count without write access to the review row).
CREATE OR REPLACE FUNCTION public.increment_review_views(_review_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.canonical_review SET views = views + 1 WHERE id = _review_id;
$$;

CREATE TABLE public.notification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,           -- 'response' | 'follow' | 'published' | 'moderation'
  review_id uuid REFERENCES public.canonical_review(id) ON DELETE CASCADE,
  actor_id uuid,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_user ON public.notification (user_id, is_read, created_at DESC);

ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notification FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notification FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
-- Inserts happen via SECURITY DEFINER triggers only.

-- Management response → notify the review's author.
CREATE OR REPLACE FUNCTION public.trg_notify_review_response()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author uuid;
BEGIN
  SELECT resident_id INTO author FROM public.canonical_review WHERE id = NEW.review_id;
  IF author IS NOT NULL AND author <> NEW.responder_user_id THEN
    INSERT INTO public.notification (user_id, type, review_id, actor_id, message)
    VALUES (author, 'response', NEW.review_id, NEW.responder_user_id, 'Management responded to your review');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_review_response_notify
  AFTER INSERT ON public.review_response
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_review_response();

-- New follower → notify the creator.
CREATE OR REPLACE FUNCTION public.trg_notify_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.creator_id <> NEW.follower_user_id THEN
    INSERT INTO public.notification (user_id, type, actor_id, message)
    VALUES (NEW.creator_id, 'follow', NEW.follower_user_id, 'You have a new follower');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_follow_notify
  AFTER INSERT ON public.creator_follow
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_follow();

-- Review published (moderation approved) → notify the author.
CREATE OR REPLACE FUNCTION public.trg_notify_review_published()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.moderation_status = 'approved' AND OLD.moderation_status <> 'approved' AND NEW.resident_id IS NOT NULL THEN
    INSERT INTO public.notification (user_id, type, review_id, message)
    VALUES (NEW.resident_id, 'published', NEW.id, 'Your review is now live');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_review_published_notify
  AFTER UPDATE ON public.canonical_review
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_review_published();
