import { getEnv } from '@/services/env';

function isProductionDomain(): boolean {
  if (typeof window === 'undefined') return false;
  return ['joinperiscope.com', 'www.joinperiscope.com'].includes(window.location.hostname);
}

export const useCanonicalData = (): boolean => {
  if (isProductionDomain()) return true;
  return getEnv('VITE_USE_CANONICAL') === 'true';
};

// Demo mode = the app is running on mock providers (no live canonical data).
// Used to clearly label illustrative sample content so it is never mistaken for
// real reviews, residents, videos, claims, or scores.
export const isDemoMode = (): boolean => !useCanonicalData();
