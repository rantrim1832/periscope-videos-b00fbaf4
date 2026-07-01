-- =====================================================================
-- PROPERTY CLAIM & VERIFICATION (Official · Public → Official · Verified)
-- =====================================================================
-- Property managers/staff/owners claim a property and verify control. On
-- approval: their official channels flip to Verified, they gain a manager grant,
-- and everything is audit-logged. SAFETY RULE (enforced in RLS): managers can
-- RESPOND and add context, but can NEVER edit, delete, or suppress resident
-- reviews.
-- =====================================================================

DO $$ BEGIN CREATE TYPE public.claim_status AS ENUM ('pending','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.claim_role AS ENUM ('manager','staff','owner'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.property_claim (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_property_id uuid NOT NULL REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  claimant_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.claim_role NOT NULL DEFAULT 'manager',
  company_name text,
  contact_email text,
  verification_method text NOT NULL DEFAULT 'work_email', -- work_email | phone | document
  evidence_url text,
  status public.claim_status NOT NULL DEFAULT 'pending',
  rejected_reason text,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX idx_property_claim_property ON public.property_claim (canonical_property_id);
CREATE INDEX idx_property_claim_status ON public.property_claim (status);

CREATE TABLE public.property_manager (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_property_id uuid NOT NULL REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.claim_role NOT NULL DEFAULT 'manager',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canonical_property_id, user_id)
);

CREATE TABLE public.review_response (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.canonical_review(id) ON DELETE CASCADE,
  responder_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_review_response_review ON public.review_response (review_id);
CREATE TRIGGER trg_review_response_updated_at
  BEFORE UPDATE ON public.review_response FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.claim_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.property_claim(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor uuid,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_claim_audit_claim ON public.claim_audit (claim_id);

-- Manager-grant lookup (security definer to avoid RLS recursion).
CREATE OR REPLACE FUNCTION public.has_property_manager(_uid uuid, _pid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.property_manager WHERE user_id = _uid AND canonical_property_id = _pid);
$$;

-- ---------------------------------------------------------------------
-- On approval: verify channels, grant manager, audit-log.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_property_claim_reviewed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    INSERT INTO public.property_manager (canonical_property_id, user_id, role)
    VALUES (NEW.canonical_property_id, NEW.claimant_user_id, NEW.role)
    ON CONFLICT (canonical_property_id, user_id) DO NOTHING;

    UPDATE public.property_channel SET is_verified = true
    WHERE canonical_property_id = NEW.canonical_property_id;

    INSERT INTO public.property_event (canonical_property_id, kind, label)
    VALUES (NEW.canonical_property_id, 'note', 'Property claimed & verified by management');

    INSERT INTO public.claim_audit (claim_id, action, actor, detail)
    VALUES (NEW.id, 'approved', NEW.reviewed_by, jsonb_build_object('role', NEW.role));

  ELSIF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    INSERT INTO public.claim_audit (claim_id, action, actor, detail)
    VALUES (NEW.id, 'rejected', NEW.reviewed_by, jsonb_build_object('reason', NEW.rejected_reason));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_property_claim_reviewed
  AFTER UPDATE ON public.property_claim
  FOR EACH ROW EXECUTE FUNCTION public.trg_property_claim_reviewed();

-- Log claim submissions too.
CREATE OR REPLACE FUNCTION public.trg_property_claim_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.claim_audit (claim_id, action, actor, detail)
  VALUES (NEW.id, 'submitted', NEW.claimant_user_id,
          jsonb_build_object('method', NEW.verification_method, 'company', NEW.company_name));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_property_claim_created
  AFTER INSERT ON public.property_claim
  FOR EACH ROW EXECUTE FUNCTION public.trg_property_claim_created();

-- =====================================================================
-- RLS
-- =====================================================================
ALTER TABLE public.property_claim    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_manager  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_response   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_audit       ENABLE ROW LEVEL SECURITY;

-- property_claim: claimant sees/creates own; admins review.
CREATE POLICY "Claimants view own claims" ON public.property_claim FOR SELECT
  USING (auth.uid() = claimant_user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own claims" ON public.property_claim FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = claimant_user_id);
CREATE POLICY "Admins review claims" ON public.property_claim FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- property_manager: public can see WHICH properties are managed (badge), user sees own; admin all.
CREATE POLICY "Public can view manager grants" ON public.property_manager FOR SELECT USING (true);
CREATE POLICY "Admins manage grants" ON public.property_manager FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- review_response: public read; a VERIFIED MANAGER of the review's property may
-- respond; responder may edit own. No delete of reviews anywhere (safety rule).
CREATE POLICY "Public can view responses" ON public.review_response FOR SELECT USING (true);
CREATE POLICY "Managers respond to reviews" ON public.review_response FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = responder_user_id
    AND public.has_property_manager(
      auth.uid(),
      (SELECT canonical_property_id FROM public.canonical_review WHERE id = review_id)
    )
  );
CREATE POLICY "Responders edit own response" ON public.review_response FOR UPDATE TO authenticated
  USING (auth.uid() = responder_user_id);

-- claim_audit: admin-only.
CREATE POLICY "Admins view audit" ON public.claim_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- Verified managers may manage their property's official channels — but NOTE:
-- no policy is granted to managers on canonical_review, so they can never edit,
-- delete, or suppress resident truth. They can only add review_response rows.
-- ---------------------------------------------------------------------
CREATE POLICY "Managers manage own property channels" ON public.property_channel FOR ALL TO authenticated
  USING (public.has_property_manager(auth.uid(), canonical_property_id))
  WITH CHECK (public.has_property_manager(auth.uid(), canonical_property_id));
