-- Add management company and amenities columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS management_company TEXT,
ADD COLUMN IF NOT EXISTS amenities TEXT[];