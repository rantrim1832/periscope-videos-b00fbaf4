import { describe, it, expect } from 'vitest';
import {
  normalizeAddressLine1, normalizeZip5, normalizeState, normalizePhoneE164,
  distanceMeters, nameSimilarity, canonicalKey,
} from './normalize';

describe('normalize', () => {
  it('normalizes street addresses (suffixes, directionals, unit stripping)', () => {
    expect(normalizeAddressLine1('123 W Main St, Apt 4B')).toBe('123 west main street');
    expect(normalizeAddressLine1('515 W Duarte Rd')).toBe('515 west duarte road');
  });

  it('repairs ZIP leading-zero loss', () => {
    expect(normalizeZip5('2134')).toBe('02134');
    expect(normalizeZip5('90210-1234')).toBe('90210');
    expect(normalizeZip5(2134)).toBe('02134');
    expect(normalizeZip5('')).toBeNull();
  });

  it('validates state codes', () => {
    expect(normalizeState('ca')).toBe('CA');
    expect(normalizeState('Atlanta')).toBeNull();
  });

  it('normalizes phones to E.164', () => {
    expect(normalizePhoneE164('(713) 654-2181')).toBe('+17136542181');
    expect(normalizePhoneE164('9094821060')).toBe('+19094821060');
    expect(normalizePhoneE164('123')).toBeNull();
  });

  it('computes geo distance', () => {
    expect(distanceMeters(34.10, -118.32, 34.10, -118.32)).toBe(0);
    expect(distanceMeters(34.10, -118.32, 34.11, -118.32)).toBeGreaterThan(1000);
  });

  it('fuzzy name similarity', () => {
    expect(nameSimilarity('Willow Creek', 'Willow Creek')).toBe(1);
    expect(nameSimilarity('Willow Creek Apartments', 'Willow Creek Apts')).toBeGreaterThan(0.4);
    expect(nameSimilarity('Willow Creek', 'Sunset Towers')).toBeLessThan(0.2);
  });

  it('canonical key', () => {
    expect(canonicalKey('90210', '123 main street')).toBe('90210|123 main street');
  });
});
