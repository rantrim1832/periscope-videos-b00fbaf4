-- =====================================================================
-- CANONICAL REVIEWS + TRUTH SCORE AGGREGATE
-- =====================================================================
-- Reviews live on the canonical graph (linked to canonical_property and, for
-- resident content, to resident_profile). A per-property aggregate caches the
-- computed Truth Score so reads are cheap; it is recomputed when reviews change
-- (trigger → recompute edge function, or the SQL fallback below).
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.review_moderation_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.review_life_stage AS ENUM ('moveIn', 'living', 'maintenance', 'moveOut', 'deposit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.canonical_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_property_id uuid NOT NULL REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  resident_id uuid REFERENCES public.resident_profile(id) ON DELETE SET NULL,
  author_pseudonym text,
  trust_tier public.resident_trust_tier NOT NULL DEFAULT 'unverified',
  life_stage public.review_life_stage NOT NULL DEFAULT 'living',
  content_type text NOT NULL DEFAULT 'text',   -- 'video' | 'photo' | 'text'
  title text NOT NULL,
  body text,
  ratings jsonb NOT NULL DEFAULT '{}'::jsonb,   -- { category: 1..5 }
  would_lease_again boolean,
  media_asset_id text,
  has_video boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'resident',       -- 'resident' | 'seeded' | 'official'
  moderation_status public.review_moderation_status NOT NULL DEFAULT 'pending',
  moderation_score numeric NOT NULL DEFAULT 0,
  ai_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_canonical_review_property ON public.canonical_review (canonical_property_id, moderation_status);
CREATE INDEX idx_canonical_review_resident ON public.canonical_review (resident_id);
CREATE INDEX idx_canonical_review_created ON public.canonical_review (created_at DESC);

CREATE TRIGGER trg_canonical_review_updated_at
  BEFORE UPDATE ON public.canonical_review
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Per-property cached Truth Score aggregate.
CREATE TABLE public.property_rating_aggregate (
  canonical_property_id uuid PRIMARY KEY REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  truth_score integer,
  confidence text NOT NULL DEFAULT 'insufficient',
  categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_count integer NOT NULL DEFAULT 0,
  verified_resident_count integer NOT NULL DEFAULT 0,
  video_count integer NOT NULL DEFAULT 0,
  effective_weight numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.canonical_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_rating_aggregate ENABLE ROW LEVEL SECURITY;

-- Public sees approved reviews; authors see own; admins all.
CREATE POLICY "Public can view approved reviews"
  ON public.canonical_review FOR SELECT
  USING (
    moderation_status = 'approved'
    OR auth.uid() = resident_id
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Residents create own reviews"
  ON public.canonical_review FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = resident_id);
CREATE POLICY "Residents update own reviews"
  ON public.canonical_review FOR UPDATE TO authenticated
  USING (auth.uid() = resident_id);
CREATE POLICY "Admins manage reviews"
  ON public.canonical_review FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Aggregate is public (it powers the property page); writes via service role/admin.
CREATE POLICY "Public can view aggregates"
  ON public.property_rating_aggregate FOR SELECT USING (true);
CREATE POLICY "Admins manage aggregates"
  ON public.property_rating_aggregate FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- SQL fallback recompute (trust-weighted, recency-decayed, confidence-gated).
-- Mirrors src/domain/truthScore.ts. The recompute edge function is the primary
-- path (single source of truth in TS); this ensures correctness even if the
-- function isn't deployed. Marks the aggregate stale for the edge fn to refine.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_property_truth_score(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  cat text;
  cats text[] := ARRAY['management','maintenance','noise','safety','parking','amenities','moveIn','moveOut','depositReturn','value'];
  cat_w jsonb := '{"safety":1.3,"management":1.3,"depositReturn":1.3,"maintenance":1.2,"value":1.1,"noise":1.0,"moveIn":0.9,"moveOut":0.9,"parking":0.8,"amenities":0.8}';
  w numeric;
  eff_weight numeric := 0;
  vcount int := 0;
  vidcount int := 0;
  rcount int := 0;
  wsum jsonb := '{}'::jsonb;
  wscore jsonb := '{}'::jsonb;
  ccount jsonb := '{}'::jsonb;
  comp_wsum numeric := 0;
  comp_wscore numeric := 0;
  cat_score numeric;
  categories_out jsonb := '{}'::jsonb;
  conf text;
  score int;
  rating numeric;
BEGIN
  FOREACH cat IN ARRAY cats LOOP
    wsum := jsonb_set(wsum, ARRAY[cat], '0'); wscore := jsonb_set(wscore, ARRAY[cat], '0'); ccount := jsonb_set(ccount, ARRAY[cat], '0');
  END LOOP;

  FOR r IN
    SELECT trust_tier, has_video, created_at, ratings
    FROM public.canonical_review
    WHERE canonical_property_id = p_property_id AND moderation_status = 'approved'
  LOOP
    w := (CASE r.trust_tier WHEN 'verified_resident' THEN 3 WHEN 'likely_resident' THEN 1.5 ELSE 0.5 END)
         * power(0.5, GREATEST(0, EXTRACT(EPOCH FROM (now() - r.created_at)) / 86400.0) / 548.0);
    eff_weight := eff_weight + w;
    rcount := rcount + 1;
    IF r.trust_tier = 'verified_resident' THEN vcount := vcount + 1; END IF;
    IF r.has_video THEN vidcount := vidcount + 1; END IF;
    FOREACH cat IN ARRAY cats LOOP
      IF r.ratings ? cat THEN
        rating := (r.ratings ->> cat)::numeric;
        wsum := jsonb_set(wsum, ARRAY[cat], to_jsonb((wsum->>cat)::numeric + w));
        wscore := jsonb_set(wscore, ARRAY[cat], to_jsonb((wscore->>cat)::numeric + w * rating));
        ccount := jsonb_set(ccount, ARRAY[cat], to_jsonb((ccount->>cat)::int + 1));
      END IF;
    END LOOP;
  END LOOP;

  FOREACH cat IN ARRAY cats LOOP
    IF (wsum->>cat)::numeric > 0 THEN
      cat_score := round(((wscore->>cat)::numeric / (wsum->>cat)::numeric) * 10) / 10;
      categories_out := jsonb_set(categories_out, ARRAY[cat], jsonb_build_object('score', cat_score, 'count', (ccount->>cat)::int));
      comp_wsum := comp_wsum + (cat_w->>cat)::numeric;
      comp_wscore := comp_wscore + (cat_w->>cat)::numeric * cat_score;
    ELSE
      categories_out := jsonb_set(categories_out, ARRAY[cat], jsonb_build_object('score', NULL, 'count', 0));
    END IF;
  END LOOP;

  conf := CASE WHEN eff_weight < 2 THEN 'insufficient' WHEN eff_weight < 8 THEN 'early' ELSE 'established' END;
  IF conf = 'insufficient' OR comp_wsum = 0 THEN score := NULL; ELSE score := round((comp_wscore / comp_wsum) * 20); END IF;

  INSERT INTO public.property_rating_aggregate
    (canonical_property_id, truth_score, confidence, categories, review_count, verified_resident_count, video_count, effective_weight, updated_at)
  VALUES
    (p_property_id, score, conf, categories_out, rcount, vcount, vidcount, round(eff_weight*10)/10, now())
  ON CONFLICT (canonical_property_id) DO UPDATE SET
    truth_score = EXCLUDED.truth_score, confidence = EXCLUDED.confidence, categories = EXCLUDED.categories,
    review_count = EXCLUDED.review_count, verified_resident_count = EXCLUDED.verified_resident_count,
    video_count = EXCLUDED.video_count, effective_weight = EXCLUDED.effective_weight, updated_at = now();
END;
$$;

-- Recompute when approved reviews change.
CREATE OR REPLACE FUNCTION public.trg_recompute_truth_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_property_truth_score(COALESCE(NEW.canonical_property_id, OLD.canonical_property_id));
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_canonical_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.canonical_review
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_truth_score();
