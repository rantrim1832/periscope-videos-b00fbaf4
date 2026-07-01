import { getEnv } from '@/services/env';

// Demo mode = the app is running on mock providers (no live canonical data).
// Used to clearly label illustrative sample content so it is never mistaken for
// real reviews, residents, videos, claims, or scores.
export const isDemoMode = (): boolean => getEnv('VITE_USE_CANONICAL') !== 'true';
