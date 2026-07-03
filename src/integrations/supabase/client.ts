import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getPublicSupabasePublishableKey, getPublicSupabaseUrl } from '@/services/env';

// Lovable Cloud owns and may regenerate VITE_SUPABASE_* while Cloud is attached.
// Production can bypass that by setting VITE_EXTERNAL_SUPABASE_* values, which
// this client prefers before falling back to Lovable's managed variables.
const SUPABASE_URL = getPublicSupabaseUrl();
const SUPABASE_PUBLISHABLE_KEY = getPublicSupabasePublishableKey();

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn('Missing Supabase frontend env. Set VITE_EXTERNAL_SUPABASE_URL and VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY || 'missing-publishable-key',
  {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});