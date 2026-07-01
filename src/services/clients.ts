// Supabase client factories.
//
// - The browser uses the existing anon client at
//   `@/integrations/supabase/client` (do not import that here; it touches
//   localStorage and would break in Node).
// - Node contexts (ingestion, scripts) use an admin (service-role) client
//   created here. Service role bypasses RLS — never ship this to the browser.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env';

export function createAdminClient(): SupabaseClient {
  const url = getEnv('SUPABASE_URL') ?? getEnv('VITE_SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error(
      'Admin client requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables',
    );
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
