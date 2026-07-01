-- Level-up notification — a status/flex moment worth screenshotting & sharing.
CREATE OR REPLACE FUNCTION public.trg_notify_levelup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.level > OLD.level THEN
    INSERT INTO public.notification (user_id, type, message)
    VALUES (NEW.id, 'levelup', '🏆 You leveled up to Level ' || NEW.level || ' on Pariscope (' || NEW.points || ' points)');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_profile_levelup
  AFTER UPDATE ON public.resident_profile
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_levelup();
