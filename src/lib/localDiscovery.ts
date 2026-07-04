export type LocalCity = { city: string; state: string; label: string; lat: number; lng: number };

export const SEEDED_CITIES: LocalCity[] = [
  { city: 'Phoenix', state: 'AZ', label: 'Phoenix', lat: 33.4484, lng: -112.0740 },
  { city: 'Dallas', state: 'TX', label: 'Dallas', lat: 32.7767, lng: -96.7970 },
  { city: 'Austin', state: 'TX', label: 'Austin', lat: 30.2672, lng: -97.7431 },
  { city: 'Houston', state: 'TX', label: 'Houston', lat: 29.7604, lng: -95.3698 },
  { city: 'Atlanta', state: 'GA', label: 'Atlanta', lat: 33.7490, lng: -84.3880 },
  { city: 'Los Angeles', state: 'CA', label: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { city: 'Chicago', state: 'IL', label: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { city: 'Denver', state: 'CO', label: 'Denver', lat: 39.7392, lng: -104.9903 },
  { city: 'Seattle', state: 'WA', label: 'Seattle', lat: 47.6062, lng: -122.3321 },
  { city: 'Miami', state: 'FL', label: 'Miami', lat: 25.7617, lng: -80.1918 },
  { city: 'Boston', state: 'MA', label: 'Boston', lat: 42.3601, lng: -71.0589 },
  { city: 'New York', state: 'NY', label: 'New York', lat: 40.7128, lng: -74.0060 },
  { city: 'San Diego', state: 'CA', label: 'San Diego', lat: 32.7157, lng: -117.1611 },
  { city: 'San Francisco', state: 'CA', label: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { city: 'Charlotte', state: 'NC', label: 'Charlotte', lat: 35.2271, lng: -80.8431 },
  { city: 'Nashville', state: 'TN', label: 'Nashville', lat: 36.1627, lng: -86.7816 },
  { city: 'Raleigh', state: 'NC', label: 'Raleigh', lat: 35.7796, lng: -78.6382 },
  { city: 'Las Vegas', state: 'NV', label: 'Las Vegas', lat: 36.1699, lng: -115.1398 },
  { city: 'Portland', state: 'OR', label: 'Portland', lat: 45.5152, lng: -122.6784 },
  { city: 'Columbus', state: 'OH', label: 'Columbus', lat: 39.9612, lng: -82.9988 },
];

const STORAGE_KEY = 'periscope.localCity';

export function getStoredLocalCity(): LocalCity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredLocalCity(city: LocalCity): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
  } catch {
    // ignore storage failure
  }
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function nearestSeededCity(lat: number, lng: number): LocalCity {
  return SEEDED_CITIES
    .map((city) => ({ city, d: distanceKm(lat, lng, city.lat, city.lng) }))
    .sort((a, b) => a.d - b.d)[0].city;
}

// Parse the trailing state code from a "City, ST" location string.
export function stateFromLocation(location?: string | null): string | null {
  if (!location) return null;
  const parts = location.split(',').map((s) => s.trim());
  const last = parts[parts.length - 1];
  return /^[A-Z]{2}$/.test(last) ? last : null;
}

export function getStoredLocalState(): string | null {
  return getStoredLocalCity()?.state ?? null;
}

// Sort items so ones matching the local state come first, preserving relative
// order otherwise. Used to keep the SoCal viewer from opening the page to Texas.
export function sortByLocalState<T>(
  items: T[],
  getLocation: (item: T) => string | null | undefined,
  localState: string | null,
): T[] {
  if (!localState) return items;
  const local: T[] = [];
  const rest: T[] = [];
  for (const item of items) {
    if (stateFromLocation(getLocation(item)) === localState) local.push(item);
    else rest.push(item);
  }
  return [...local, ...rest];
}
