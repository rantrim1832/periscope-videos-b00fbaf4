-- Create scrape_logs table to track scraping activity
CREATE TABLE public.scrape_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT,
  state TEXT NOT NULL,
  total_properties INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'success',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scrape_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for scrape logs
CREATE POLICY "Admins can view all scrape logs" 
ON public.scrape_logs 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert scrape logs" 
ON public.scrape_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_scrape_logs_created_at ON public.scrape_logs(created_at DESC);
CREATE INDEX idx_scrape_logs_state ON public.scrape_logs(state);