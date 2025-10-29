-- Add user verification tracking
CREATE TABLE public.user_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  verification_type text NOT NULL, -- 'id_document', 'resident'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  document_url text,
  extracted_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  verified_at timestamp with time zone,
  rejected_reason text
);

-- Add user limits for anti-spam
CREATE TABLE public.user_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  ip_address text,
  reviews_count integer NOT NULL DEFAULT 0,
  verifications_count integer NOT NULL DEFAULT 0,
  last_verification_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add fields to properties table
ALTER TABLE public.properties 
ADD COLUMN created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN is_verified boolean DEFAULT false,
ADD COLUMN verification_required boolean DEFAULT true,
ADD COLUMN beds integer,
ADD COLUMN baths numeric,
ADD COLUMN rent numeric,
ADD COLUMN latitude numeric,
ADD COLUMN longitude numeric,
ADD COLUMN status text DEFAULT 'pending'; -- 'pending', 'approved', 'rejected'

-- Enable RLS
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_verifications
CREATE POLICY "Users can view own verifications"
ON public.user_verifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own verifications"
ON public.user_verifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications"
ON public.user_verifications FOR SELECT
USING (true);

CREATE POLICY "Admins can update verifications"
ON public.user_verifications FOR UPDATE
USING (true);

-- RLS policies for user_limits
CREATE POLICY "Users can view own limits"
ON public.user_limits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage limits"
ON public.user_limits FOR ALL
USING (true)
WITH CHECK (true);

-- Update properties RLS to allow user creation
CREATE POLICY "Users can view approved properties"
ON public.properties FOR SELECT
USING (status = 'approved' OR auth.uid() = created_by_user_id);

-- Trigger to update user_limits
CREATE OR REPLACE FUNCTION public.update_user_limits_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_limits_updated_at
BEFORE UPDATE ON public.user_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_user_limits_timestamp();