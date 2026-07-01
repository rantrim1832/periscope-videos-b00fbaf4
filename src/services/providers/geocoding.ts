// Geocoding provider abstraction.
//
// Interface-driven so the ingestion pipeline and app can run fully with a
// deterministic MOCK provider (no external API/secret required), and swap to
// a real provider (Mapbox) by setting VITE_MAPBOX_TOKEN / MAPBOX_TOKEN.

import { getEnv } from '../env';

export interface GeocodeInput {
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  zip5?: string | null;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  confidence: number; // 0..1
  provider: string;
}

export interface GeocodingProvider {
  readonly name: string;
  geocode(input: GeocodeInput): Promise<GeocodeResult | null>;
}

function formatAddress(input: GeocodeInput): string {
  return [input.addressLine1, input.city, input.state, input.zip5]
    .filter(Boolean)
    .join(', ');
}

// Deterministic pseudo-geocoder for offline development. Produces stable
// coordinates within the continental US bounding box from an address hash so
// entity-resolution proximity logic can be exercised without a real API.
export class MockGeocodingProvider implements GeocodingProvider {
  readonly name = 'mock';

  async geocode(input: GeocodeInput): Promise<GeocodeResult | null> {
    const key = formatAddress(input).toLowerCase();
    if (!key) return null;
    let h1 = 2166136261;
    let h2 = 5381;
    for (let i = 0; i < key.length; i++) {
      const c = key.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
      h2 = ((h2 << 5) + h2 + c) >>> 0;
    }
    // Continental US: lat 25..49, lng -124..-67
    const latitude = 25 + (h1 % 240000) / 10000; // 25.0000 .. 49.0000
    const longitude = -124 + (h2 % 570000) / 10000; // -124.0000 .. -67.0000
    return {
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
      confidence: 0.5,
      provider: this.name,
    };
  }
}

// Real provider (Mapbox). Only selected when a token is configured.
export class MapboxGeocodingProvider implements GeocodingProvider {
  readonly name = 'mapbox';
  constructor(private token: string) {}

  async geocode(input: GeocodeInput): Promise<GeocodeResult | null> {
    const query = formatAddress(input);
    if (!query) return null;
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?limit=1&country=US&access_token=${this.token}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature?.center) return null;
    const [longitude, latitude] = feature.center;
    return {
      latitude,
      longitude,
      confidence: typeof feature.relevance === 'number' ? feature.relevance : 0.8,
      provider: this.name,
    };
  }
}

let cached: GeocodingProvider | null = null;

export function getGeocodingProvider(): GeocodingProvider {
  if (cached) return cached;
  const token = getEnv('MAPBOX_TOKEN') ?? getEnv('VITE_MAPBOX_TOKEN');
  cached = token ? new MapboxGeocodingProvider(token) : new MockGeocodingProvider();
  return cached;
}

// Test seam.
export function __setGeocodingProvider(p: GeocodingProvider | null): void {
  cached = p;
}
