-- =====================================================================
-- NOTIFICATION CURIOSITY UPGRADE
-- =====================================================================
-- A notification only succeeds if a human interrupts their day to open the app.
-- Rewrites every notification to be curiosity/emotion/urgency-forward, with the
-- property name + specifics, a correct deep-link (property_id), and adds a
-- view-milestone loop (status/habit). Optimizes for opens, not information.
-- =====================================================================

ALTER TABLE public.notification ADD COLUMN IF NOT EXISTS property_id uuid;

-- Management reply → notify the review's author (personal + emotional).
CREATE OR REPLACE FUNCTION public.trg_notify_review_response()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author uuid; pid uuid; pname text;
BEGIN
  SELECT cr.resident_id, cr.canonical_property_id, cp.name
    INTO author, pid, pname
  FROM public.canonical_review cr
  LEFT JOIN public.canonical_property cp ON cp.id = cr.canonical_property_id
  WHERE cr.id = NEW.review_id;
  IF author IS NOT NULL AND author <> NEW.responder_user_id THEN
    INSERT INTO public.notification (user_id, type, review_id, property_id, actor_id, message)
    VALUES (author, 'response', NEW.review_id, pid, NEW.responder_user_id,
            '🏢 Management replied to your review' || COALESCE(' at ' || pname, ''));
  END IF;
  RETURN NEW;
END;
$$;

-- New follower (social + status).
CREATE OR REPLACE FUNCTION public.trg_notify_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.creator_id <> NEW.follower_user_id THEN
    INSERT INTO public.notification (user_id, type, actor_id, message)
    VALUES (NEW.creator_id, 'follow', NEW.follower_user_id, '👀 You have a new follower');
  END IF;
  RETURN NEW;
END;
$$;

-- Review published (status).
CREATE OR REPLACE FUNCTION public.trg_notify_review_published()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pname text;
BEGIN
  IF NEW.moderation_status = 'approved' AND OLD.moderation_status <> 'approved' AND NEW.resident_id IS NOT NULL THEN
    SELECT name INTO pname FROM public.canonical_property WHERE id = NEW.canonical_property_id;
    INSERT INTO public.notification (user_id, type, review_id, property_id, message)
    VALUES (NEW.resident_id, 'published', NEW.id, NEW.canonical_property_id,
            '🎉 Your truth is live' || COALESCE(' at ' || pname, '') || ' — people can see it now');
  END IF;
  RETURN NEW;
END;
$$;

-- New review on a watched property (curiosity).
CREATE OR REPLACE FUNCTION public.trg_notify_watchers_review()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pname text; verb text;
BEGIN
  IF NEW.moderation_status = 'approved' AND OLD.moderation_status <> 'approved' THEN
    SELECT name INTO pname FROM public.canonical_property WHERE id = NEW.canonical_property_id;
    verb := CASE WHEN NEW.has_video THEN '🎥 New video just dropped at ' ELSE '📝 New review just posted for ' END;
    INSERT INTO public.notification (user_id, type, review_id, property_id, message)
    SELECT w.user_id, 'watch_activity', NEW.id, NEW.canonical_property_id, verb || COALESCE(pname, 'a place you follow')
    FROM public.watch w
    WHERE w.entity_type = 'property' AND w.entity_id = NEW.canonical_property_id::text
      AND w.user_id <> COALESCE(NEW.resident_id, '00000000-0000-0000-0000-000000000000');
  END IF;
  RETURN NEW;
END;
$$;

-- Score change on a watched property (curiosity + urgency + drama).
CREATE OR REPLACE FUNCTION public.trg_notify_watchers_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pname text; d int; msg text;
BEGIN
  IF NEW.truth_score IS DISTINCT FROM OLD.truth_score AND NEW.truth_score IS NOT NULL AND OLD.truth_score IS NOT NULL THEN
    SELECT name INTO pname FROM public.canonical_property WHERE id = NEW.canonical_property_id;
    d := NEW.truth_score - OLD.truth_score;
    msg := CASE WHEN d < 0
      THEN '⚠️ ' || COALESCE(pname, 'A place you follow') || ' just dropped ' || abs(d) || ' points — see why'
      ELSE '📈 ' || COALESCE(pname, 'A place you follow') || ' climbed ' || d || ' points' END;
    INSERT INTO public.notification (user_id, type, property_id, message)
    SELECT w.user_id, 'watch_activity', NEW.canonical_property_id, msg
    FROM public.watch w
    WHERE w.entity_type = 'property' AND w.entity_id = NEW.canonical_property_id::text;
  END IF;
  RETURN NEW;
END;
$$;

-- View milestones on your review (status + habit).
CREATE OR REPLACE FUNCTION public.trg_notify_view_milestone()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pname text;
BEGIN
  IF NEW.resident_id IS NOT NULL AND NEW.views IN (10, 50, 100, 500, 1000, 5000) AND NEW.views <> OLD.views THEN
    SELECT name INTO pname FROM public.canonical_property WHERE id = NEW.canonical_property_id;
    INSERT INTO public.notification (user_id, type, review_id, property_id, message)
    VALUES (NEW.resident_id, 'milestone', NEW.id, NEW.canonical_property_id,
            '🔥 Your review' || COALESCE(' of ' || pname, '') || ' just passed ' || NEW.views || ' views');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_review_view_milestone
  AFTER UPDATE ON public.canonical_review
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_view_milestone();
