// SUNREEL shot and variant definitions.
// Every cover variant names its photos, its title, its script line, its
// tagline, its layout and its colour grade. The editor and the screenshot
// mode both read this one table, so a variant always looks the same
// wherever it is drawn.

export const SAMPLE_DIR = 'samples/';

export const GRADES = {
  golden: {
    id: 'golden',
    name: 'Golden hour',
    overlay: 'rgba(255, 140, 40, 0.16)',
    titleFrom: '#ffb347',
    titleTo: '#ff4d8d',
    band: '#1c0b2e',
    bandLine: '#ffbf3f',
    accent: '#ffbf3f',
    glow: 'rgba(255, 120, 60, 0.55)',
  },
  neon: {
    id: 'neon',
    name: 'Neon night',
    overlay: 'rgba(40, 80, 255, 0.18)',
    titleFrom: '#7df9ff',
    titleTo: '#ff4dd8',
    band: '#12041f',
    bandLine: '#ff4dd8',
    accent: '#4de8ff',
    glow: 'rgba(80, 200, 255, 0.55)',
  },
  ultraviolet: {
    id: 'ultraviolet',
    name: 'Ultraviolet',
    overlay: 'rgba(150, 60, 255, 0.20)',
    titleFrom: '#c77dff',
    titleTo: '#ff5fa2',
    band: '#160a2e',
    bandLine: '#b26bff',
    accent: '#c77dff',
    glow: 'rgba(170, 90, 255, 0.55)',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    overlay: 'rgba(255, 90, 60, 0.18)',
    titleFrom: '#ff9a3d',
    titleTo: '#ff2e88',
    band: '#200a24',
    bandLine: '#ffb347',
    accent: '#ffb347',
    glow: 'rgba(255, 110, 70, 0.55)',
  },
};

export const LAYOUTS = {
  sunset: { id: 'sunset', name: 'Sunset Chase', desc: 'Big hero chase panel, three below' },
  diagonal: { id: 'diagonal', name: 'Diagonal trio', desc: 'Three slanted panels side by side' },
  hero3: { id: 'hero3', name: 'Hero + three', desc: 'One wide hero, three panels below' },
  six: { id: 'six', name: 'Six grid', desc: 'Two rows of three equal panels' },
  mosaic: { id: 'mosaic', name: 'Hero mosaic', desc: 'Big hero corner, the rest in a row' },
};

export const VARIANTS = [
  {
    id: 'vice',
    name: 'VICE PURSUIT',
    title: 'VICE PURSUIT',
    script: 'Coastline Nights',
    tagline: 'ONE COASTLINE · FIVE STORIES · NO CURFEW',
    quote: 'HOTTER THAN THE ASPHALT',
    quoteSource: 'THE PALM GAZETTE',
    layout: 'sunset',
    grade: 'golden',
    panels: [
      { file: 'vice-chase.jpg', label: 'THE RIDE' },
      { file: 'vice-driver.jpg', label: 'THE DRIVER' },
      { file: 'vice-fixer.jpg', label: 'THE FIXER' },
      { file: 'vice-canyon.jpg', label: 'THE GETAWAY' },
      { file: 'vice-everglades.jpg', label: 'THE WILDCARD' },
    ],
  },
  {
    id: 'crime',
    name: 'CITY OF CRIME',
    title: 'CITY OF CRIME',
    script: 'Streets never sleep',
    tagline: 'THREE FACES · ONE LONG NIGHT',
    quote: 'THE CITY NEVER BLINKS',
    quoteSource: 'THE NIGHT GAZETTE',
    layout: 'diagonal',
    grade: 'neon',
    panels: [
      { file: 'crime-insider.jpg', label: 'THE INSIDER' },
      { file: 'crime-lookout.jpg', label: 'THE LOOKOUT' },
      { file: 'crime-getaway.jpg', label: 'THE GETAWAY' },
    ],
  },
  {
    id: 'dark',
    name: 'AFTER DARK',
    title: 'AFTER DARK',
    script: 'City of lights',
    tagline: 'FOUR NIGHTS · ONE CITY',
    quote: 'BRIGHTER AFTER MIDNIGHT',
    quoteSource: 'THE PALM GAZETTE',
    layout: 'hero3',
    grade: 'ultraviolet',
    panels: [
      { file: 'dark-ride.jpg', label: 'THE RIDE' },
      { file: 'dark-market.jpg', label: 'THE MARKET' },
      { file: 'dark-driver.jpg', label: 'THE DRIVER' },
      { file: 'dark-sky.jpg', label: 'THE SKY' },
    ],
  },
  {
    id: 'runners',
    name: 'MIDNIGHT RUNNERS',
    title: 'MIDNIGHT RUNNERS',
    script: 'Run the night',
    tagline: 'SIX ROADS · ONE CREW',
    quote: 'NO BRAKES PAST MIDNIGHT',
    quoteSource: 'THE COAST GAZETTE',
    layout: 'six',
    grade: 'sunset',
    panels: [
      { file: 'runners-pickup.jpg', label: 'THE PICKUP' },
      { file: 'runners-diner.jpg', label: 'THE DINER' },
      { file: 'runners-rider.jpg', label: 'THE RIDER' },
      { file: 'runners-skater.jpg', label: 'THE SKATER' },
      { file: 'runners-boat.jpg', label: 'THE BOAT' },
      { file: 'runners-overlook.jpg', label: 'THE OVERLOOK' },
    ],
  },
];

export const SIZES = {
  landscape: { id: 'landscape', label: '16:9 · 1280 × 720', w: 1280, h: 720 },
  portrait: { id: 'portrait', label: '4:5 · 1024 × 1280', w: 1024, h: 1280 },
  square: { id: 'square', label: '1:1 · 1080 × 1080', w: 1080, h: 1080 },
};

export function variantById(id) {
  return VARIANTS.find((v) => v.id === id) || VARIANTS[0];
}

export function gradeById(id) {
  return GRADES[id] || GRADES.golden;
}

export function layoutById(id) {
  return LAYOUTS[id] || LAYOUTS.sunset;
}

// Read the screenshot / share query string:
// ?shot=cover|editor&variant=vice&grade=golden&size=landscape
// &caption=VICE PURSUIT&subcaption=Coastline Nights
// &panels=vice-chase.jpg,vice-driver.jpg&strength=0.8
export function readQuery(search) {
  const q = new URLSearchParams(search || '');
  const out = {
    shot: q.get('shot') || 'editor',
    variant: q.get('variant') || 'vice',
    grade: q.get('grade') || '',
    size: q.get('size') || 'landscape',
    caption: q.get('caption') || '',
    subcaption: q.get('subcaption') || '',
    panels: q.get('panels') ? q.get('panels').split(',').map((s) => s.trim()).filter(Boolean) : [],
    strength: q.get('strength') ? Math.max(0, Math.min(1, Number(q.get('strength')) || 0.8)) : 0.8,
  };
  return out;
}

// Build a fresh, editable panel state from a variant definition.
export function freshPanels(variant, panelFiles) {
  const files = panelFiles && panelFiles.length ? panelFiles : variant.panels.map((p) => p.file);
  return variant.panels.map((p, i) => ({
    file: files[i] || p.file,
    label: p.label,
    zoom: 1,
    ox: 0,
    oy: 0,
    flip: false,
    custom: false,
  }));
}
