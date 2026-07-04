// Demo mode has been removed — the app always runs against canonical (live) data.
// These helpers are kept as no-op shims so existing call sites compile unchanged.
export const useCanonicalData = (): boolean => true;
export const isDemoMode = (): boolean => false;
