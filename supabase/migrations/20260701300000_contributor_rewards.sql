-- =====================================================================
-- CONTRIBUTOR REWARDS (points / levels / badges)
-- =====================================================================
-- Rewards for contributing verified truth — the intrinsic + status motivation
-- that drives supply and retention. Type-A only (recognition, not tenant
-- screening). Points/badges are awarded server-side when a review is published.
-- =====================================================================

ALTER TABLE public.resident_profile
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1;

CREATE TABLE public.resident_badge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.resident_profile(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  label text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resident_id, badge_key)
);
CREATE INDEX idx_resident_badge_resident ON public.resident_badge (resident_id);

ALTER TABLE public.resident_badge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view badges" ON public.resident_badge FOR SELECT USING (true);
-- Inserts via SECURITY DEFINER trigger only.

-- Award points + badges when a review is approved (published).
CREATE OR REPLACE FUNCTION public.trg_award_review_rewards()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  gain integer := 10;
  new_points integer;
  video_count integer;
BEGIN
  IF NEW.moderation_status = 'approved' AND OLD.moderation_status <> 'approved' AND NEW.resident_id IS NOT NULL THEN
    IF NEW.has_video THEN gain := gain + 15; END IF;
    IF (NEW.ratings ? 'depositReturn') THEN gain := gain + 5; END IF;

    UPDATE public.resident_profile
      SET points = points + gain,
          level = GREATEST(1, ((points + gain) / 100) + 1),
          contributor_reputation = contributor_reputation + gain
      WHERE id = NEW.resident_id
      RETURNING points INTO new_points;

    -- First review badge.
    INSERT INTO public.resident_badge (resident_id, badge_key, label)
    VALUES (NEW.resident_id, 'first_truth', 'First Truth')
    ON CONFLICT DO NOTHING;

    -- Video creator badge (3+ approved videos).
    IF NEW.has_video THEN
      SELECT count(*) INTO video_count FROM public.canonical_review
        WHERE resident_id = NEW.resident_id AND moderation_status = 'approved' AND has_video = true;
      IF video_count >= 3 THEN
        INSERT INTO public.resident_badge (resident_id, badge_key, label)
        VALUES (NEW.resident_id, 'video_creator', 'Video Creator') ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    -- Deposit watchdog badge.
    IF (NEW.ratings ? 'depositReturn') THEN
      INSERT INTO public.resident_badge (resident_id, badge_key, label)
      VALUES (NEW.resident_id, 'deposit_watch', 'Deposit Watchdog') ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_award_rewards
  AFTER UPDATE ON public.canonical_review
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_review_rewards();

-- Verified-resident badge when a profile reaches verified tier.
CREATE OR REPLACE FUNCTION public.trg_award_verified_badge()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.trust_tier = 'verified_resident' AND OLD.trust_tier <> 'verified_resident' THEN
    INSERT INTO public.resident_badge (resident_id, badge_key, label)
    VALUES (NEW.id, 'verified_resident', 'Verified Resident') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_profile_verified_badge
  AFTER UPDATE ON public.resident_profile
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_verified_badge();
