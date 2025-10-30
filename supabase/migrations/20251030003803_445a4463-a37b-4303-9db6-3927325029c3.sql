-- Create imported_properties table to store CSV uploaded property data
CREATE TABLE public.imported_properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  former_name text,
  concessions text,
  market text,
  submarket text,
  management_company text,
  onsite_manager text,
  address text,
  state text,
  city text,
  zip_code text,
  phone text,
  neighborhood text,
  units integer,
  stories integer,
  built_type text,
  year_built integer,
  beds text,
  baths text,
  occupancy_percent numeric,
  avg_rent numeric,
  avg_eff_rent numeric,
  avg_price_per_sqft numeric,
  avg_eff_price_per_sqft numeric,
  min_lease_term integer,
  software_system text,
  housing_type text,
  total_rentable_sqft integer,
  url text,
  classification text,
  county text,
  avg_sqft integer,
  source text DEFAULT 'csv_import',
  imported_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.imported_properties ENABLE ROW LEVEL SECURITY;

-- Anyone can view imported properties
CREATE POLICY "Anyone can view imported properties"
ON public.imported_properties
FOR SELECT
USING (true);

-- Authenticated users can create imported properties
CREATE POLICY "Authenticated users can create imported properties"
ON public.imported_properties
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own imported properties
CREATE POLICY "Users can update own imported properties"
ON public.imported_properties
FOR UPDATE
USING (auth.uid() = imported_by_user_id);

-- Users can delete their own imported properties
CREATE POLICY "Users can delete own imported properties"
ON public.imported_properties
FOR DELETE
USING (auth.uid() = imported_by_user_id);

-- Create index for faster queries
CREATE INDEX idx_imported_properties_city ON public.imported_properties(city);
CREATE INDEX idx_imported_properties_state ON public.imported_properties(state);
CREATE INDEX idx_imported_properties_user ON public.imported_properties(imported_by_user_id);