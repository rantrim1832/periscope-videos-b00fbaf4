
CREATE TABLE public.curated_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  hint text NOT NULL DEFAULT '',
  feed_category text NOT NULL DEFAULT 'Renter tips',
  suggested_queries jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.curated_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.curated_categories TO authenticated;
GRANT ALL ON public.curated_categories TO service_role;

ALTER TABLE public.curated_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read curated categories"
  ON public.curated_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert curated categories"
  ON public.curated_categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update curated categories"
  ON public.curated_categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete curated categories"
  ON public.curated_categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER curated_categories_updated_at
  BEFORE UPDATE ON public.curated_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_seeded_videos_updated_at();

-- Seed with the current in-code catalog.
INSERT INTO public.curated_categories (slug, label, hint, feed_category, suggested_queries, sort_order) VALUES
  ('maintenance','Maintenance nightmares','Real repair horror stories, leaks, mold, AC failures.','Maintenance issues',
    '["apartment maintenance nightmare","apartment mold problem","apartment ceiling leak story","bad landlord maintenance","apartment pest infestation","apartment ac broken summer"]'::jsonb, 10),
  ('application','Application & lease drama','Screening, deposits, hidden fees, denial stories.','Deposit disputes',
    '["apartment application fees hidden","apartment security deposit scam","apartment lease surprise fees","apartment denied application story","apartment lease breaking fees"]'::jsonb, 20),
  ('local-vibe','Local area vibe','Neighborhood walks, safety, transit, coffee/bars.','Renter tips',
    '["brooklyn apartment neighborhood walk","best apartment neighborhoods nyc","apartment neighborhood safety review","downtown la apartment area vibe","chicago apartment neighborhood tour","austin apartment neighborhood guide"]'::jsonb, 30),
  ('amenities','Amenities — the real story','Gym, pool, coworking, lounge — real footage.','Property tours',
    '["luxury apartment amenities tour","apartment gym pool tour","apartment rooftop amenity","apartment coworking lounge tour","apartment building amenities review"]'::jsonb, 40),
  ('tours','Property tours','Full building & unit tours from real renters and pros.','Property tours',
    '["nyc apartment tour","la luxury apartment tour","chicago high rise apartment tour","apartment tour before signing","miami luxury apartment tour","seattle apartment tour"]'::jsonb, 50),
  ('design-tips','Design & decor tips','Small-space design, IKEA hacks, rental-friendly upgrades.','Renter tips',
    '["small apartment design tips","rental apartment decor ideas","ikea apartment hacks","studio apartment makeover","apartment organization tips","rental friendly apartment upgrades"]'::jsonb, 60),
  ('leasing-gurus','Leasing gurus & tips','Renter influencers, negotiation, red flags before signing.','Renter tips',
    '["apartment leasing agent tips","how to negotiate rent","apartment red flags before signing","renters rights explained","first time apartment renter tips"]'::jsonb, 70),
  ('reviews','Real renter reviews','Honest apartment reviews from real tenants.','Resident warnings',
    '["honest apartment review","moving out apartment review","worst apartment i lived in","apartment complex review","luxury apartment honest review"]'::jsonb, 80);
