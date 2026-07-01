// Address / field normalization — the basis of canonical identity.
// Deterministic and dependency-free so it runs identically in the browser,
// Node ingestion scripts, and edge functions.

const STREET_SUFFIXES: Record<string, string> = {
  st: 'street', str: 'street', ave: 'avenue', av: 'avenue', blvd: 'boulevard',
  rd: 'road', dr: 'drive', ln: 'lane', ct: 'court', cir: 'circle', pl: 'place',
  pkwy: 'parkway', hwy: 'highway', ter: 'terrace', trl: 'trail', way: 'way',
  sq: 'square', loop: 'loop', pt: 'point', crk: 'creek',
};

const DIRECTIONALS: Record<string, string> = {
  n: 'north', s: 'south', e: 'east', w: 'west',
  ne: 'northeast', nw: 'northwest', se: 'southeast', sw: 'southwest',
};

const UNIT_DESIGNATORS = /\b(apt|apartment|unit|ste|suite|#|bldg|building|fl|floor|rm)\.?\s*[a-z0-9-]+\b/gi;

/** Normalize a street address to a stable, comparable form (building level). */
export function normalizeAddressLine1(raw: string | null | undefined): string {
  if (!raw) return '';
  let s = raw.toLowerCase().trim();
  s = s.replace(/[.,]/g, ' ');
  s = s.replace(UNIT_DESIGNATORS, ' ');
  const tokens = s.split(/\s+/).filter(Boolean).map((t) => {
    if (STREET_SUFFIXES[t]) return STREET_SUFFIXES[t];
    if (DIRECTIONALS[t]) return DIRECTIONALS[t];
    return t;
  });
  return tokens.join(' ').replace(/\s+/g, ' ').trim();
}

/** Repair ZIP: strip +4, zero-pad to 5. Handles Excel leading-zero loss. */
export function normalizeZip5(raw: string | number | null | undefined): string | null {
  if (raw == null) return null;
  const digits = String(raw).replace(/[^0-9]/g, '');
  if (!digits) return null;
  const five = digits.slice(0, 5);
  return five.padStart(5, '0');
}

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
]);

/** Return a valid 2-letter state code, or null if the value is not one. */
export function normalizeState(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase();
  return US_STATES.has(s) ? s : null;
}

export function isValidState(raw: string | null | undefined): boolean {
  return normalizeState(raw) != null;
}

/** Normalize a US phone to E.164 (+1XXXXXXXXXX), or null if not 10/11 digits. */
export function normalizePhoneE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^0-9]/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

/** The canonical identity key for a property. */
export function canonicalKey(
  zip5: string | null,
  normalizedAddress: string,
): string {
  return `${zip5 ?? '?????'}|${normalizedAddress}`;
}

/** Haversine distance in meters between two lat/lng points. */
export function distanceMeters(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Trigram-ish similarity (0..1) for fuzzy name matching. */
export function nameSimilarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const grams = (s: string) => {
    const g = new Set<string>();
    for (let i = 0; i < s.length - 2; i++) g.add(s.slice(i, i + 3));
    return g;
  };
  const gx = grams(x);
  const gy = grams(y);
  if (gx.size === 0 || gy.size === 0) return 0;
  let inter = 0;
  gx.forEach((g) => { if (gy.has(g)) inter++; });
  return inter / (gx.size + gy.size - inter);
}
