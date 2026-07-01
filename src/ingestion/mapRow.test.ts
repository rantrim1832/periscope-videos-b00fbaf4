import { describe, it, expect } from 'vitest';
import { mapRow, isHeaderRow } from './mapRow';
import { parseCsv } from './csv';

describe('csv + mapRow', () => {
  it('detects header row', () => {
    expect(isHeaderRow(['Name', 'Address', 'City', 'State', 'Zip', '', 'Phone', 'Units'])).toBe(true);
    expect(isHeaderRow(['Arcadia Pines', '515 W Duarte Rd', 'Arcadia', 'CA'])).toBe(false);
  });

  it('right-anchored maps a clean 8-field row', () => {
    const rec = mapRow(['Arcadia Pines', '515 W Duarte Rd', 'Arcadia', 'CA', '91007', '', '9094821060', '28']);
    expect(rec.valid).toBe(true);
    expect(rec.name).toBe('Arcadia Pines');
    expect(rec.city).toBe('Arcadia');
    expect(rec.state).toBe('CA');
    expect(rec.zip5).toBe('91007');
    expect(rec.phoneE164).toBe('+19094821060');
    expect(rec.unitsCount).toBe(28);
  });

  it('repairs leading-zero ZIP', () => {
    const rec = mapRow(['Arthaus', '37 N Beacon St', 'Allston', 'MA', '2134', '', '6177523551', '72']);
    expect(rec.zip5).toBe('02134');
  });

  it('quarantines invalid state', () => {
    const rec = mapRow(['X', 'Y', 'Z', 'NotAState', '12345', '', '', '10']);
    expect(rec.valid).toBe(false);
    expect(rec.quarantineReason).toBe('invalid_state');
  });

  it('handles comma-shifted (quoted) address via right-anchor', () => {
    const rows = parseCsv('"1435 North Wells","1435 N Wells St, ",Chicago,IL,60610,,6124191006,50');
    const rec = mapRow(rows[0]);
    expect(rec.state).toBe('IL');
    expect(rec.zip5).toBe('60610');
    expect(rec.unitsCount).toBe(50);
  });

  it('csv parses quoted fields and CRLF', () => {
    const rows = parseCsv('a,b,c\r\n"x,y",z,w\r\n');
    expect(rows[0]).toEqual(['a', 'b', 'c']);
    expect(rows[1]).toEqual(['x,y', 'z', 'w']);
  });
});
