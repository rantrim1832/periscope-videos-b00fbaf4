-- =====================================================================
-- RESIDENT VERIFICATION (T2 Likely / T3 Verified)
-- =====================================================================
-- Progressive trust: passive/instant GPS → Likely Resident (T2); document
-- (lease/utility) → admin-approved Verified Resident (T3). Verification proves
-- RESIDENCY, not identity (pseudonymity preserved); documents are match-then-
-- delete in production. Trust-tier changes happen server-side only (edge fn /
-- admin), never client-declared.
-- =====================================================================

CREATE TABLE public.residency_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.resident_profile(id) ON DELETE CASCADE,
  canonical_property_id uuid NOT NULL REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  method public.verification_method NOT NULL,      -- gps_dwell | lease | utility | payment | ...
  target_tier public.resident_trust_tier NOT NULL, -- likely_resident | verified_resident
  status text NOT NULL DEFAULT 'pending',           -- pending | approved | rejected
  evidence_ref text,                                -- reference to stored doc (deleted after match)
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX idx_residency_verification_status ON public.residency_verification (status);
CREATE INDEX idx_residency_verification_resident ON public.residency_verification (resident_id);

ALTER TABLE public.residency_verification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Residents view own verifications" ON public.residency_verification FOR SELECT
  USING (auth.uid() = resident_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins review verifications" ON public.residency_verification FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
-- Inserts happen via the verify-residency edge function (service role).

-- Helper: upgrade trust tier only upward (never downgrade).
CREATE OR REPLACE FUNCTION public.upgrade_trust_tier(_resident uuid, _tier public.resident_trust_tier)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rank_new int; rank_cur int; cur public.resident_trust_tier;
BEGIN
  SELECT trust_tier INTO cur FROM public.resident_profile WHERE id = _resident;
  rank_new := CASE _tier WHEN 'verified_resident' THEN 3 WHEN 'likely_resident' THEN 2 ELSE 1 END;
  rank_cur := CASE cur   WHEN 'verified_resident' THEN 3 WHEN 'likely_resident' THEN 2 ELSE 1 END;
  IF rank_new > rank_cur THEN
    UPDATE public.resident_profile SET trust_tier = _tier WHERE id = _resident;
  END IF;
END;
$$;

-- On approval of a document verification → grant target tier + verified claim.
CREATE OR REPLACE FUNCTION public.trg_residency_verification_reviewed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    PERFORM public.upgrade_trust_tier(NEW.resident_id, NEW.target_tier);
    INSERT INTO public.residency_claim (resident_id, canonical_property_id, verification_tier, verification_method, is_current)
    VALUES (NEW.resident_id, NEW.canonical_property_id, NEW.target_tier, NEW.method, true)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_residency_verification_reviewed
  AFTER UPDATE ON public.residency_verification
  FOR EACH ROW EXECUTE FUNCTION public.trg_residency_verification_reviewed();
