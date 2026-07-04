// Deterministic fallback artwork for properties with no image.
// Combines a hashed duotone gradient + monogram + building silhouette
// (chosen from unit count) so no two properties look the same, and the
// same property always renders the same tile.

interface PropertyArtworkProps {
  name: string;
  seed?: string;
  units?: number | null;
  className?: string;
}

// Curated duotone palettes (from → to, both HSL). Kept small & tasteful.
const PALETTES: Array<[string, string]> = [
  ["hsl(190 70% 45%)", "hsl(220 60% 25%)"], // ocean
  ["hsl(15 80% 55%)",  "hsl(340 65% 35%)"], // sunset
  ["hsl(160 55% 40%)", "hsl(200 60% 20%)"], // forest
  ["hsl(275 55% 50%)", "hsl(230 55% 25%)"], // plum
  ["hsl(35 85% 55%)",  "hsl(15 70% 35%)"],  // amber
  ["hsl(200 55% 50%)", "hsl(260 45% 30%)"], // dusk
  ["hsl(150 45% 45%)", "hsl(180 55% 25%)"], // pine
  ["hsl(340 60% 55%)", "hsl(280 55% 30%)"], // orchid
  ["hsl(210 60% 50%)", "hsl(230 65% 20%)"], // cobalt
  ["hsl(45 80% 55%)",  "hsl(25 70% 35%)"],  // honey
  ["hsl(180 50% 40%)", "hsl(210 55% 20%)"], // teal
  ["hsl(0 60% 50%)",   "hsl(350 55% 25%)"], // clay
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function monogram(name: string): string {
  const parts = name.replace(/[^A-Za-z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Silhouette = 'tower' | 'midrise' | 'garden' | 'lowrise';
function silhouetteFor(units?: number | null): Silhouette {
  if (!units) return 'midrise';
  if (units >= 200) return 'tower';
  if (units >= 80) return 'midrise';
  if (units >= 30) return 'lowrise';
  return 'garden';
}

const Silhouettes: Record<Silhouette, JSX.Element> = {
  tower: (
    <g fill="currentColor" opacity="0.22">
      <rect x="70" y="60" width="60" height="180" />
      <rect x="40" y="110" width="30" height="130" />
      <rect x="130" y="90" width="30" height="150" />
      {Array.from({ length: 8 }).map((_, r) =>
        Array.from({ length: 3 }).map((_, c) => (
          <rect key={`t-${r}-${c}`} x={78 + c * 16} y={78 + r * 20} width="8" height="10" fill="hsl(0 0% 100%)" opacity="0.35" />
        ))
      )}
    </g>
  ),
  midrise: (
    <g fill="currentColor" opacity="0.22">
      <rect x="30" y="120" width="140" height="120" />
      <polygon points="30,120 100,80 170,120" />
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 5 }).map((_, c) => (
          <rect key={`m-${r}-${c}`} x={42 + c * 24} y={135 + r * 22} width="12" height="14" fill="hsl(0 0% 100%)" opacity="0.35" />
        ))
      )}
    </g>
  ),
  lowrise: (
    <g fill="currentColor" opacity="0.22">
      <rect x="20" y="150" width="70" height="90" />
      <rect x="110" y="150" width="70" height="90" />
      <polygon points="20,150 55,120 90,150" />
      <polygon points="110,150 145,120 180,150" />
      {[0,1].map(b => Array.from({ length: 3 }).map((_, r) =>
        Array.from({ length: 2 }).map((_, c) => (
          <rect key={`l-${b}-${r}-${c}`} x={30 + b * 90 + c * 26} y={162 + r * 22} width="14" height="14" fill="hsl(0 0% 100%)" opacity="0.35" />
        ))
      ))}
    </g>
  ),
  garden: (
    <g fill="currentColor" opacity="0.22">
      <rect x="20" y="170" width="60" height="70" />
      <rect x="90" y="160" width="50" height="80" />
      <rect x="150" y="175" width="40" height="65" />
      <polygon points="20,170 50,145 80,170" />
      <polygon points="90,160 115,135 140,160" />
      <polygon points="150,175 170,155 190,175" />
      <circle cx="15" cy="230" r="10" opacity="0.4" />
      <circle cx="195" cy="235" r="8" opacity="0.4" />
    </g>
  ),
};

export const PropertyArtwork = ({ name, seed, units, className }: PropertyArtworkProps) => {
  const key = (seed ?? name) || 'property';
  const h = hash(key);
  const [from, to] = PALETTES[h % PALETTES.length];
  const angle = 100 + (h % 80); // 100–180deg
  const mono = monogram(name);
  const kind = silhouetteFor(units);
  const gradId = `pa-${(h % 100000).toString(36)}`;

  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1" gradientTransform={`rotate(${angle} 0.5 0.5)`}>
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <radialGradient id={`${gradId}-glow`} cx="0.5" cy="0.35" r="0.7">
          <stop offset="0%" stopColor="hsl(0 0% 100%)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(0 0% 100%)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${gradId})`} />
      <rect width="200" height="200" fill={`url(#${gradId}-glow)`} />
      <g style={{ color: 'hsl(0 0% 0%)' }}>{Silhouettes[kind]}</g>
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fontSize="72"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
        fill="hsl(0 0% 100%)"
        opacity="0.95"
        letterSpacing="-2"
      >
        {mono}
      </text>
    </svg>
  );
};

export default PropertyArtwork;