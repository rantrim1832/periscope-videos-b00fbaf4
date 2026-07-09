// Curated top ~50 US metros with a real, on-theme photo for the Browse rail
// and Search autofill. State codes are used for /city/:state/:city routing.
//
// Two image sources are used:
//  - Per-city Unsplash URLs for iconic metros where the exact photo is
//    visually verified to depict that city (skyline, landmark, etc.).
//  - Regional archetype images bundled under /src/assets/cities/ for smaller
//    metros — each depicts the correct visual region (mountain-west,
//    desert-southwest, PNW volcano skyline, Gulf coast palms, etc.).
//
// The prior version reused a small "themed" Unsplash pool that resolved to
// unrelated stock (a camera for LA, a basketball for the Sunbelt, a tree for
// Chicago). Never reintroduce that pool.

import northeastMetro from '@/assets/cities/northeast-metro.jpg';
import midwestMetro from '@/assets/cities/midwest-metro.jpg';
import southernMetro from '@/assets/cities/southern-metro.jpg';
import floridaMetro from '@/assets/cities/florida-metro.jpg';
import texasMetro from '@/assets/cities/texas-metro.jpg';
import southwestMetro from '@/assets/cities/southwest-metro.jpg';
import mountainWest from '@/assets/cities/mountain-west.jpg';
import pacificNorthwest from '@/assets/cities/pacific-northwest.jpg';
import socalMetro from '@/assets/cities/socal-metro.jpg';
import nashvilleImg from '@/assets/cities/nashville.jpg';
import phoenixImg from '@/assets/cities/phoenix.jpg';
import portlandImg from '@/assets/cities/portland.jpg';

export interface TopCity {
  city: string;
  state: string;   // 2-letter code
  image: string;
}

// Verified Unsplash photo IDs — each URL below has been visually confirmed to
// depict the named city. Do not swap without visually re-checking the thumbnail.
const u = (id: string) =>
  `https://images.unsplash.com/${id}?w=1000&auto=format&fit=crop&q=75`;

const IMG = {
  nyc:      u('photo-1496442226666-8d4d0e62e6e9'), // Times Square
  chicago:  u('photo-1477959858617-67f85cf4f1df'), // Chicago skyline aerial
  la:       u('photo-1444723121867-7a241cacace9'), // LA at night
  sf:       u('photo-1449034446853-66c86144b0ad'), // Golden Gate Bridge
  seattle:  u('photo-1438401171849-74ac270044ee'), // Space Needle + Rainier
  miami:    u('photo-1514214246283-d427a95c5d2f'), // Miami palms + beach
  vegas:    u('photo-1605833556294-ea5c7a74f57d'), // Welcome to Las Vegas sign
  dc:       u('photo-1501466044931-62695aada8e9'), // US Capitol
  austin:   u('photo-1531218150217-54595bc2b934'), // Austin skyline at dusk
  atlanta:  u('photo-1575917649705-5b59aaa12e6b'), // Atlanta skyline sunset
  nola:     u('photo-1571893544028-06b07af6dade'), // New Orleans French Quarter
};

export const TOP_CITIES: TopCity[] = [
  { city: 'New York',        state: 'NY', image: IMG.nyc },
  { city: 'Los Angeles',     state: 'CA', image: IMG.la },
  { city: 'Chicago',         state: 'IL', image: IMG.chicago },
  { city: 'Houston',         state: 'TX', image: texasMetro },
  { city: 'Phoenix',         state: 'AZ', image: phoenixImg },
  { city: 'Philadelphia',    state: 'PA', image: northeastMetro },
  { city: 'San Antonio',     state: 'TX', image: texasMetro },
  { city: 'San Diego',       state: 'CA', image: socalMetro },
  { city: 'Dallas',          state: 'TX', image: texasMetro },
  { city: 'Austin',          state: 'TX', image: IMG.austin },
  { city: 'Jacksonville',    state: 'FL', image: floridaMetro },
  { city: 'Fort Worth',      state: 'TX', image: texasMetro },
  { city: 'Columbus',        state: 'OH', image: midwestMetro },
  { city: 'Charlotte',       state: 'NC', image: southernMetro },
  { city: 'Indianapolis',    state: 'IN', image: midwestMetro },
  { city: 'San Francisco',   state: 'CA', image: IMG.sf },
  { city: 'Seattle',         state: 'WA', image: IMG.seattle },
  { city: 'Denver',          state: 'CO', image: mountainWest },
  { city: 'Boston',          state: 'MA', image: northeastMetro },
  { city: 'Nashville',       state: 'TN', image: nashvilleImg },
  { city: 'Portland',        state: 'OR', image: portlandImg },
  { city: 'Las Vegas',       state: 'NV', image: IMG.vegas },
  { city: 'Atlanta',         state: 'GA', image: IMG.atlanta },
  { city: 'Miami',           state: 'FL', image: IMG.miami },
  { city: 'Minneapolis',     state: 'MN', image: midwestMetro },
  { city: 'Washington',      state: 'DC', image: IMG.dc },
  { city: 'Detroit',         state: 'MI', image: midwestMetro },
  { city: 'Baltimore',       state: 'MD', image: northeastMetro },
  { city: 'Milwaukee',       state: 'WI', image: midwestMetro },
  { city: 'Sacramento',      state: 'CA', image: socalMetro },
  { city: 'Kansas City',     state: 'MO', image: midwestMetro },
  { city: 'Raleigh',         state: 'NC', image: southernMetro },
  { city: 'Tampa',           state: 'FL', image: floridaMetro },
  { city: 'Orlando',         state: 'FL', image: floridaMetro },
  { city: 'Cleveland',       state: 'OH', image: midwestMetro },
  { city: 'Pittsburgh',      state: 'PA', image: northeastMetro },
  { city: 'Cincinnati',      state: 'OH', image: midwestMetro },
  { city: 'St. Louis',       state: 'MO', image: midwestMetro },
  { city: 'Louisville',      state: 'KY', image: southernMetro },
  { city: 'New Orleans',     state: 'LA', image: IMG.nola },
  { city: 'Salt Lake City',  state: 'UT', image: mountainWest },
  { city: 'Providence',      state: 'RI', image: northeastMetro },
  { city: 'Richmond',        state: 'VA', image: southernMetro },
  { city: 'Buffalo',         state: 'NY', image: northeastMetro },
  { city: 'Hartford',        state: 'CT', image: northeastMetro },
  { city: 'Oklahoma City',   state: 'OK', image: southwestMetro },
  { city: 'Memphis',         state: 'TN', image: southernMetro },
  { city: 'Albuquerque',     state: 'NM', image: southwestMetro },
  { city: 'Tucson',          state: 'AZ', image: southwestMetro },
  { city: 'Omaha',           state: 'NE', image: midwestMetro },
];