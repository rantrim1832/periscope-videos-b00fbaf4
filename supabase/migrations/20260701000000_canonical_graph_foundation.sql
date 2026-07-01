-- =====================================================================
-- CANONICAL TWO-SIDED, PROVENANCE-FIRST DATA MODEL
-- =====================================================================
-- Implements the ratified foundation:
--   PROPERTY  ↔  RESIDENT  (two-sided entity graph)
--   bound by TRUST (verification, reputation)
--   every fact carries PROVENANCE (value, source, confidence, observed_at)
--
-- Identity rule: a property is identified by geocoded normalized address,
-- NEVER by name. Aliases resolve every source string / user query to the
-- canonical entity so the product almost never says "property not found".
--
-- This migration is additive. The legacy `properties` / `imported_properties`
-- tables remain until the ingestion pipeline backfills the canonical graph;
-- a later migration will retire them.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.property_status AS ENUM ('active', 'closed', 'quarantined', 'merged');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.property_class AS ENUM
    ('single_family', 'small_multifamily', 'midsize', 'large_community', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.geocode_status AS ENUM ('pending', 'geocoded', 'failed', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.match_status AS ENUM ('created', 'merged', 'needs_review', 'quarantined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.resident_trust_tier AS ENUM
    ('unverified', 'likely_resident', 'verified_resident');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_method AS ENUM
    ('none', 'gps_dwell', 'lease', 'utility', 'payment', 'community', 'historical', 'email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- Shared updated_at trigger function (idempotent)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- data_source — registry of ingestion sources with a trust tier.
-- Conflict resolution prefers higher trust_tier (verified claim >
-- enrichment API > import > user suggestion).
-- ---------------------------------------------------------------------
CREATE TABLE public.data_source (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  trust_tier integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.data_source (key, name, trust_tier) VALUES
  ('verified_claim',   'Verified property-manager claim', 900),
  ('enrichment_api',   'Enrichment API (RentCast/ATTOM/Census)', 700),
  ('csv_import',       'Bulk CSV import', 500),
  ('user_suggestion',  'User-submitted correction', 300),
  ('resident_report',  'Resident-reported experience', 400);

-- ---------------------------------------------------------------------
-- canonical_property — the single canonical entity. Columns hold the
-- current best-resolved values; property_fact holds sourced history.
-- ---------------------------------------------------------------------
CREATE TABLE public.canonical_property (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  -- normalized identity
  normalized_address text NOT NULL,
  address_line1 text,
  city text,
  state text,
  zip5 text,
  -- geo
  latitude numeric,
  longitude numeric,
  geo_confidence numeric,
  geocode_status public.geocode_status NOT NULL DEFAULT 'pending',
  -- classification & core public facts
  property_class public.property_class NOT NULL DEFAULT 'unknown',
  units_count integer,
  year_built integer,
  phone_e164 text,
  -- lifecycle
  status public.property_status NOT NULL DEFAULT 'active',
  merged_into uuid REFERENCES public.canonical_property(id),
  confidence_score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Canonical identity key: one property per (zip5, normalized_address).
CREATE UNIQUE INDEX uq_canonical_property_identity
  ON public.canonical_property (zip5, normalized_address)
  WHERE status <> 'merged';
CREATE INDEX idx_canonical_property_state_city ON public.canonical_property (state, city);
CREATE INDEX idx_canonical_property_geo ON public.canonical_property (latitude, longitude);
CREATE INDEX idx_canonical_property_name_trgm ON public.canonical_property USING gin (name gin_trgm_ops);
CREATE INDEX idx_canonical_property_status ON public.canonical_property (status);

CREATE TRIGGER trg_canonical_property_updated_at
  BEFORE UPDATE ON public.canonical_property
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- property_alias — every source string / query variant → canonical.
-- The weapon against "property not found".
-- ---------------------------------------------------------------------
CREATE TABLE public.property_alias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_property_id uuid NOT NULL REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  alias_name text,
  alias_address text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_alias_canonical ON public.property_alias (canonical_property_id);
CREATE INDEX idx_property_alias_name_trgm ON public.property_alias USING gin (alias_name gin_trgm_ops);

-- ---------------------------------------------------------------------
-- property_fact — provenance-backed, versioned attribute history.
-- (value, source, confidence, observed_at) for every fact.
-- ---------------------------------------------------------------------
CREATE TABLE public.property_fact (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_property_id uuid NOT NULL REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  attribute text NOT NULL,
  value jsonb,
  source_key text NOT NULL REFERENCES public.data_source(key),
  confidence numeric NOT NULL DEFAULT 0.5,
  is_public boolean NOT NULL DEFAULT true,
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_fact_canonical_attr ON public.property_fact (canonical_property_id, attribute);

-- ---------------------------------------------------------------------
-- property_source_record — raw ingested rows: staging, audit & quarantine.
-- Never drop bad data; hold it here for repair.
-- ---------------------------------------------------------------------
CREATE TABLE public.property_source_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL REFERENCES public.data_source(key),
  raw jsonb NOT NULL,
  normalized jsonb,
  geocode_status public.geocode_status NOT NULL DEFAULT 'pending',
  match_status public.match_status NOT NULL DEFAULT 'created',
  match_score numeric,
  canonical_property_id uuid REFERENCES public.canonical_property(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_source_record_match_status ON public.property_source_record (match_status);
CREATE INDEX idx_source_record_canonical ON public.property_source_record (canonical_property_id);

-- =====================================================================
-- RESIDENT SIDE — resident as a first-class entity
-- =====================================================================

-- ---------------------------------------------------------------------
-- resident_profile — public reputation identity (pseudonymous by design).
-- Extends auth.users. Holds NO tenant-screening data (Type A only).
-- ---------------------------------------------------------------------
CREATE TABLE public.resident_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  pseudonym text UNIQUE,
  bio text,
  avatar_url text,
  trust_tier public.resident_trust_tier NOT NULL DEFAULT 'unverified',
  contributor_reputation numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_resident_profile_updated_at
  BEFORE UPDATE ON public.resident_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- residency_claim — resident ↔ property tenancy (the two-sided edge).
-- Sensitive (reveals where someone lives): NOT public.
-- ---------------------------------------------------------------------
CREATE TABLE public.residency_claim (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.resident_profile(id) ON DELETE CASCADE,
  canonical_property_id uuid NOT NULL REFERENCES public.canonical_property(id) ON DELETE CASCADE,
  tenure_start date,
  tenure_end date,
  is_current boolean NOT NULL DEFAULT false,
  verification_tier public.resident_trust_tier NOT NULL DEFAULT 'unverified',
  verification_method public.verification_method NOT NULL DEFAULT 'none',
  would_lease_again boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_residency_claim_resident ON public.residency_claim (resident_id);
CREATE INDEX idx_residency_claim_property ON public.residency_claim (canonical_property_id);
CREATE TRIGGER trg_residency_claim_updated_at
  BEFORE UPDATE ON public.residency_claim
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- resident_expertise — portable, public reputation (Type A).
-- e.g. "Austin Neighborhood Expert", "Maintenance Contributor".
-- ---------------------------------------------------------------------
CREATE TABLE public.resident_expertise (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.resident_profile(id) ON DELETE CASCADE,
  domain text NOT NULL,        -- 'neighborhood' | 'maintenance' | 'community' | ...
  scope text,                  -- e.g. 'Austin, TX'
  score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_resident_expertise_resident ON public.resident_expertise (resident_id);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
ALTER TABLE public.data_source              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_property       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_alias           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_fact            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_source_record   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_profile         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residency_claim          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_expertise       ENABLE ROW LEVEL SECURITY;

-- canonical_property: public reads active properties; admins manage all.
CREATE POLICY "Public can view active properties"
  ON public.canonical_property FOR SELECT
  USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage canonical properties"
  ON public.canonical_property FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- property_alias: public read (powers search resolution); admins manage.
CREATE POLICY "Public can view aliases"
  ON public.property_alias FOR SELECT USING (true);
CREATE POLICY "Admins manage aliases"
  ON public.property_alias FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- property_fact: only PUBLIC facts are world-readable; admins see all.
CREATE POLICY "Public can view public facts"
  ON public.property_fact FOR SELECT
  USING (is_public = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage facts"
  ON public.property_fact FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- data_source & source_record: admin-only (internal).
CREATE POLICY "Admins manage data sources"
  ON public.data_source FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage source records"
  ON public.property_source_record FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- resident_profile: public reputation is readable; users manage own.
CREATE POLICY "Public can view resident profiles"
  ON public.resident_profile FOR SELECT USING (true);
CREATE POLICY "Users manage own profile"
  ON public.resident_profile FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- residency_claim: private. Resident sees/manages own; admins see all.
CREATE POLICY "Residents view own claims"
  ON public.residency_claim FOR SELECT
  USING (auth.uid() = resident_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Residents create own claims"
  ON public.residency_claim FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = resident_id);
CREATE POLICY "Residents update own claims"
  ON public.residency_claim FOR UPDATE TO authenticated
  USING (auth.uid() = resident_id);
CREATE POLICY "Admins manage claims"
  ON public.residency_claim FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- resident_expertise: public reputation; users manage own; admins all.
CREATE POLICY "Public can view expertise"
  ON public.resident_expertise FOR SELECT USING (true);
CREATE POLICY "Users manage own expertise"
  ON public.resident_expertise FOR ALL TO authenticated
  USING (auth.uid() = resident_id)
  WITH CHECK (auth.uid() = resident_id);

-- ---------------------------------------------------------------------
-- Auto-provision a resident_profile when a new auth user is created.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.resident_profile (id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
