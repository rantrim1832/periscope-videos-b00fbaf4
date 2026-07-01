// Universal env accessor that works in both Node (ingestion scripts,
// edge functions) and the Vite browser bundle.
export function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[key] != null) {
    return process.env[key];
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
