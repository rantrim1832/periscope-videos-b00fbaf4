// Maps a raw CSV token row to a normalized property record.
//
// Right-anchored parsing: the inventory's trailing columns (Units, Phone,
// blank, Zip, State, City, Address) are positionally stable, while the leading
// Name/Address fields sometimes contain unquoted commas that shift columns.
// Anchoring from the right preserves the identity-critical fields even when
// leading fields are messy.

import {
  normalizeAddressLine1,
  normalizeZip5,
  normalizeState,
  normalizePhoneE164,
} from '../services/normalize';

export interface RawProperty {
  name: string | null;
  addressLine1: string | null;
  normalizedAddress: string;
  city: string | null;
  state: string | null;
  zip5: string | null;
  phoneE164: string | null;
  unitsCount: number | null;
  valid: boolean;
  quarantineReason?: string;
}

const HEADER_TOKENS = new Set(['name', 'address', 'city', 'state', 'zip', 'phone', 'units']);

export function isHeaderRow(tokens: string[]): boolean {
  const lowered = tokens.map((t) => t.trim().toLowerCase());
  return lowered.filter((t) => HEADER_TOKENS.has(t)).length >= 3;
}

export function mapRow(tokens: string[]): RawProperty {
  // Trim trailing empty tokens beyond the canonical 8 columns (stray commas).
  const t = [...tokens];
  while (t.length > 8 && t[t.length - 1].trim() === '') t.pop();

  const n = t.length;
  const empty: RawProperty = {
    name: null, addressLine1: null, normalizedAddress: '',
    city: null, state: null, zip5: null, phoneE164: null, unitsCount: null,
    valid: false, quarantineReason: 'too_few_fields',
  };
  if (n < 7) return empty;

  const get = (idx: number) => (idx >= 0 && idx < n ? t[idx].trim() : '');

  // Right-anchored mapping.
  const unitsRaw = get(n - 1);
  const phoneRaw = get(n - 2);
  // n-3 is the blank column
  const zipRaw = get(n - 4);
  const stateRaw = get(n - 5);
  const cityRaw = get(n - 6);
  const addressRaw = get(n - 7);
  const nameRaw = n - 8 >= 0 ? t.slice(0, n - 7).join(', ').trim() : addressRaw;

  const state = normalizeState(stateRaw);
  const zip5 = normalizeZip5(zipRaw);
  const normalizedAddress = normalizeAddressLine1(addressRaw);
  const units = parseInt(unitsRaw.replace(/[^0-9]/g, ''), 10);

  const record: RawProperty = {
    name: nameRaw || null,
    addressLine1: addressRaw || null,
    normalizedAddress,
    city: cityRaw || null,
    state,
    zip5,
    phoneE164: normalizePhoneE164(phoneRaw),
    unitsCount: Number.isNaN(units) ? null : units,
    valid: true,
  };

  // Validation → quarantine reasons (records are held, never dropped).
  if (!normalizedAddress) {
    record.valid = false;
    record.quarantineReason = 'missing_address';
  } else if (!state) {
    record.valid = false;
    record.quarantineReason = 'invalid_state';
  } else if (!zip5) {
    record.valid = false;
    record.quarantineReason = 'missing_zip';
  }

  return record;
}
