import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { getPublicSupabasePublishableKey, getPublicSupabaseUrl } from '@/services/env';

export const publicContentClient = createClient<Database>(
  getPublicSupabaseUrl() || 'https://example.supabase.co',
  getPublicSupabasePublishableKey() || 'missing-publishable-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: '' },
    },
  },
);