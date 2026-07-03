// Universal env accessor that works in both Node (ingestion scripts,
// edge functions) and the Vite browser bundle.
export function getEnv(key: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proc: any = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
  if (proc && proc.env && proc.env[key] != null) {
    return proc.env[key];
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viteEnv = (import.meta as any)?.env;
    if (viteEnv && viteEnv[key] != null) return viteEnv[key] as string;
  } catch {
    // import.meta not available in this context
  }
  return undefined;
}

export function hasEnv(key: string): boolean {
  const v = getEnv(key);
  return v != null && v !== '';
}

export function getPublicSupabaseUrl(): string | undefined {
  return getEnv('VITE_EXTERNAL_SUPABASE_URL') ?? getEnv('VITE_SUPABASE_URL');
}

export function getPublicSupabasePublishableKey(): string | undefined {
  return getEnv('VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY') ?? getEnv('VITE_SUPABASE_PUBLISHABLE_KEY');
}

export function getPublicSupabaseProjectId(): string | undefined {
  return getEnv('VITE_EXTERNAL_SUPABASE_PROJECT_ID') ?? getEnv('VITE_SUPABASE_PROJECT_ID');
}
