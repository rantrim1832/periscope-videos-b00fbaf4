// Themed stock photo pool + state → theme mapping. Photos are well-known
// Unsplash IDs served from images.unsplash.com; if one gets removed, swap the
// single ID here and every state on that theme updates.

export type StateTheme =
  | 'beach' | 'mountains' | 'desert' | 'city' | 'forest'
  | 'farm' | 'tropical' | 'bayou' | 'snow' | 'lakes' | 'ne-fall' | 'coast-pnw';

const PHOTO: Record<StateTheme, string> = {
  beach:      'photo-1507525428034-b723cf961d3e',   // Pacific beach
  mountains:  'photo-1519681393784-d120267933ba',   // Alpine mountains
  desert:     'photo-1509316785289-025f5b846b35',   // Desert dunes
  city:       'photo-1496442226666-8d4d0e62e6e9',   // NYC skyline
  forest:     'photo-1441974231531-c6227db76b6e',   // Pine forest
  farm:       'photo-1500382017468-9049fed747ef',   // Rolling farmland
  tropical:   'photo-1519861531473-9200262188bf',   // Palm coast
  bayou:      'photo-1518623489648-a173ef7824f3',   // Autumn wetland
  snow:       'photo-1483347756197-71ef80e95f73',   // Snowy forest
  lakes:      'photo-1470770841072-f978cf4d019e',   // Alpine lake
  'ne-fall':  'photo-1507371341162-763b5e419408',   // NE fall colors
  'coast-pnw':'photo-1500043357865-c6b8827edf10',   // Pacific NW coast
};

export const photoUrl = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=75`;

export const STATE_THEME: Record<string, StateTheme> = {
  AL: 'forest',      AK: 'snow',        AZ: 'desert',      AR: 'farm',
  CA: 'beach',       CO: 'mountains',   CT: 'ne-fall',     DE: 'coast-pnw',
  DC: 'city',        FL: 'tropical',    GA: 'forest',      HI: 'tropical',
  ID: 'mountains',   IL: 'city',        IN: 'farm',        IA: 'farm',
  KS: 'farm',        KY: 'farm',        LA: 'bayou',       ME: 'ne-fall',
  MD: 'coast-pnw',   MA: 'ne-fall',     MI: 'lakes',       MN: 'lakes',
  MS: 'bayou',       MO: 'farm',        MT: 'mountains',   NE: 'farm',
  NV: 'desert',      NH: 'ne-fall',     NJ: 'city',        NM: 'desert',
  NY: 'city',        NC: 'forest',      ND: 'farm',        OH: 'city',
  OK: 'farm',        OR: 'coast-pnw',   PA: 'ne-fall',     RI: 'ne-fall',
  SC: 'coast-pnw',   SD: 'farm',        TN: 'forest',      TX: 'desert',
  UT: 'desert',      VT: 'ne-fall',     VA: 'forest',      WA: 'coast-pnw',
  WV: 'forest',      WI: 'lakes',       WY: 'mountains',
};

export function stateImageUrl(code: string, w = 800): string {
  const theme = STATE_THEME[code?.toUpperCase()] ?? 'city';
  return photoUrl(PHOTO[theme], w);
}