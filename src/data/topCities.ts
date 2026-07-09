// Curated top ~50 US metros with a themed stock photo, for the Browse rail
// and Search autofill. State codes are used for /city/:state/:city routing.

import { photoUrl } from './stateArt';

export interface TopCity {
  city: string;
  state: string;   // 2-letter code
  image: string;   // full Unsplash CDN URL
}

// A small pool of city-flavored photos, reused. Same stability principle as
// stateArt — swap an ID here to update every city that uses it.
const P = {
  skyline:   photoUrl('photo-1496442226666-8d4d0e62e6e9'),   // NYC skyline
  westCoast: photoUrl('photo-1502920917128-1aa500764cbd'),   // LA / west coast
  sunbelt:   photoUrl('photo-1519861531473-9200262188bf'),   // palms
  desertCity:photoUrl('photo-1509316785289-025f5b846b35'),   // desert
  mountain:  photoUrl('photo-1519681393784-d120267933ba'),   // mountain
  neCity:    photoUrl('photo-1507371341162-763b5e419408'),   // NE fall
  midwest:   photoUrl('photo-1502082553048-f009c37129b9'),   // lake city
  south:     photoUrl('photo-1518623489648-a173ef7824f3'),   // south
  pnw:       photoUrl('photo-1500043357865-c6b8827edf10'),   // PNW coast
  bridge:    photoUrl('photo-1449034446853-66c86144b0ad'),   // bridge city
};

export const TOP_CITIES: TopCity[] = [
  { city: 'New York',        state: 'NY', image: P.skyline },
  { city: 'Los Angeles',     state: 'CA', image: P.westCoast },
  { city: 'Chicago',         state: 'IL', image: P.midwest },
  { city: 'Houston',         state: 'TX', image: P.desertCity },
  { city: 'Phoenix',         state: 'AZ', image: P.desertCity },
  { city: 'Philadelphia',    state: 'PA', image: P.neCity },
  { city: 'San Antonio',     state: 'TX', image: P.sunbelt },
  { city: 'San Diego',       state: 'CA', image: P.westCoast },
  { city: 'Dallas',          state: 'TX', image: P.skyline },
  { city: 'Austin',          state: 'TX', image: P.sunbelt },
  { city: 'Jacksonville',    state: 'FL', image: P.sunbelt },
  { city: 'Fort Worth',      state: 'TX', image: P.desertCity },
  { city: 'Columbus',        state: 'OH', image: P.midwest },
  { city: 'Charlotte',       state: 'NC', image: P.south },
  { city: 'Indianapolis',    state: 'IN', image: P.midwest },
  { city: 'San Francisco',   state: 'CA', image: P.bridge },
  { city: 'Seattle',         state: 'WA', image: P.pnw },
  { city: 'Denver',          state: 'CO', image: P.mountain },
  { city: 'Boston',          state: 'MA', image: P.neCity },
  { city: 'Nashville',       state: 'TN', image: P.south },
  { city: 'Portland',        state: 'OR', image: P.pnw },
  { city: 'Las Vegas',       state: 'NV', image: P.desertCity },
  { city: 'Atlanta',         state: 'GA', image: P.south },
  { city: 'Miami',           state: 'FL', image: P.sunbelt },
  { city: 'Minneapolis',     state: 'MN', image: P.midwest },
  { city: 'Washington',      state: 'DC', image: P.skyline },
  { city: 'Detroit',         state: 'MI', image: P.midwest },
  { city: 'Baltimore',       state: 'MD', image: P.neCity },
  { city: 'Milwaukee',       state: 'WI', image: P.midwest },
  { city: 'Sacramento',      state: 'CA', image: P.westCoast },
  { city: 'Kansas City',     state: 'MO', image: P.midwest },
  { city: 'Raleigh',         state: 'NC', image: P.south },
  { city: 'Tampa',           state: 'FL', image: P.sunbelt },
  { city: 'Orlando',         state: 'FL', image: P.sunbelt },
  { city: 'Cleveland',       state: 'OH', image: P.midwest },
  { city: 'Pittsburgh',      state: 'PA', image: P.neCity },
  { city: 'Cincinnati',      state: 'OH', image: P.midwest },
  { city: 'St. Louis',       state: 'MO', image: P.midwest },
  { city: 'Louisville',      state: 'KY', image: P.south },
  { city: 'New Orleans',     state: 'LA', image: P.south },
  { city: 'Salt Lake City',  state: 'UT', image: P.mountain },
  { city: 'Providence',      state: 'RI', image: P.neCity },
  { city: 'Richmond',        state: 'VA', image: P.south },
  { city: 'Buffalo',         state: 'NY', image: P.neCity },
  { city: 'Hartford',        state: 'CT', image: P.neCity },
  { city: 'Oklahoma City',   state: 'OK', image: P.desertCity },
  { city: 'Memphis',         state: 'TN', image: P.south },
  { city: 'Albuquerque',     state: 'NM', image: P.desertCity },
  { city: 'Tucson',          state: 'AZ', image: P.desertCity },
  { city: 'Omaha',           state: 'NE', image: P.midwest },
];