// Universal env accessor that works in both Node (ingestion scripts,
// edge functions) and the Vite browser bundle.
//
// Vite only inlines env values it can see statically. Do not rely on dynamic
// import.meta.env[key] lookups for browser code.
const viteEnv: Record<string, string | undefined> = {
  VITE_EXTERNAL_SUPABASE_URL: import.meta.env.VITE_EXTERNAL_SUPABASE_URL,
  VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY,
  VITE_EXTERNAL_SUPABASE_PROJECT_ID: import.meta.env.VITE_EXTERNAL_SUPABASE_PROJECT_ID,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
  VITE_USE_CANONICAL: import.meta.env.VITE_USE_CANONICAL,
};

// Public browser-safe production fallback. This is not a service-role key and
// does not bypass RLS; it is equivalent to an anon/publishable frontend key.
const EXTERNAL_SUPABASE_FALLBACK = {
  url: 'https://haciywkzvtgxemncenip.supabase.co',
  projectId: 'haciywkzvtgxemncenip',
  publishableKey: 'sb_publishable_8OaBcSMXJbWyAYUafhn1jw_iy0j8eh_',
} as const;

export function getEnv(key: string): string | undefined {
  if (viteEnv[key] != null) return viteEnv[key];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proc: any = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
  if (proc && proc.env && proc.env[key] != null) {
    return proc.env[key];
  }
  return undefined;
}

export function hasEnv(key: string): boolean {
  const v = getEnv(key);
  return v != null && v !== '';
}

export function getPublicSupabaseUrl(): string | undefined {
  return getEnv('VITE_EXTERNAL_SUPABASE_URL') ?? getEnv('VITE_SUPABASE_URL') ?? EXTERNAL_SUPABASE_FALLBACK.url;
}

export function getPublicSupabasePublishableKey(): string | undefined {
  return getEnv('VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY') ?? getEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ?? EXTERNAL_SUPABASE_FALLBACK.publishableKey;
}

export function getPublicSupabaseProjectId(): string | undefined {
  return getEnv('VITE_EXTERNAL_SUPABASE_PROJECT_ID') ?? getEnv('VITE_SUPABASE_PROJECT_ID') ?? EXTERNAL_SUPABASE_FALLBACK.projectId;
}
