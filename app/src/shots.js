// GOLDEN MILE — screenshot presets and URL presets.
// The editor and the screenshot runner both read this one table, so a
// cover always looks the same wherever it is drawn. A preset is just a
// URL query: shot=cover shows the cover alone, shot=editor shows the
// whole studio with a photo loaded.

import {
  GOLDEN_MILE_PANELS,
  GOLDEN_MILE_GRADES,
  GOLDEN_MILE_SIZES,
  goldenMileDefaultState,
} from './cover.js';

export const SAMPLE_DIR = 'samples/';

// Every bundled sample photo, for the editor's sample strip.
export const GOLDEN_MILE_SAMPLES = [
  'crime-insider.jpg',
  'dark-driver.jpg',
  'vice-fixer.jpg',
  'crime-lookout.jpg',
  'runners-rider.jpg',
  'vice-chase.jpg',
  'vice-everglades.jpg',
  'dark-market.jpg',
  'crime-getaway.jpg',
  'vice-driver.jpg',
  'runners-boat.jpg',
  'runners-overlook.jpg',
  'runners-diner.jpg',
  'runners-pickup.jpg',
  'runners-skater.jpg',
  'vice-canyon.jpg',
  'dark-ride.jpg',
  'dark-sky.jpg',
];

// Short names for the grade dots in the editor.
export const GOLDEN_MILE_GRADE_SWATCH = {
  golden: 'linear-gradient(135deg,#ff2e88,#ffb03a)',
  neon: 'linear-gradient(135deg,#ff2ea6,#2ee6ff)',
  dusk: 'linear-gradient(135deg,#ff4fa3,#7b2fff)',
  vice: 'linear-gradient(135deg,#ff2e88,#2ee6c8)',
  noir: 'linear-gradient(135deg,#888,#111)',
};

// The four screenshots the entry ships with. The first by name is the
// cover; the second shows the editor with a photo loaded; the third and
// fourth show the cover in the other two post sizes.
export const GOLDEN_MILE_SHOTS = [
  {
    name: '1-goldenmile-cover.jpg',
    width: 1080,
    height: 1080,
    url: '/?shot=cover&grade=golden&size=square',
  },
  {
    name: '2-goldenmile-editor.jpg',
    width: 1280,
    height: 860,
    url: '/?shot=editor&grade=golden&size=square',
  },
  {
    name: '3-goldenmile-portrait.jpg',
    width: 1024,
    height: 1280,
    url: '/?shot=cover&grade=neon&size=portrait',
  },
  {
    name: '4-goldenmile-square.jpg',
    width: 1280,
    height: 1080,
    url: '/?shot=cover&grade=dusk&size=square&variant=wide',
  },
];

export { GOLDEN_MILE_PANELS, GOLDEN_MILE_GRADES, GOLDEN_MILE_SIZES };

// Rebuild the eight panels from a comma list of sample file names, so a
// URL can swap the photos while the roles and face points stay put.
export function goldenMilePanelsFromFiles(files) {
  const base = goldenMileDefaultState().panels;
  if (!files || !files.length) return base;
  return base.map((panel, i) => {
    const file = files[i % files.length];
    const known = GOLDEN_MILE_PANELS.find((p) => p.file === file);
    return {
      ...panel,
      src: SAMPLE_DIR + file,
      fx: known ? known.fx : panel.fx,
      fy: known ? known.fy : panel.fy,
    };
  });
}

// ---- URL presets --------------------------------------------------------

// Read the shot/editor preset out of the page URL.
export function readGoldenMileQuery(search) {
  const q = new URLSearchParams(search || '');
  const grade = q.get('grade');
  const size = q.get('size');
  return {
    shot: q.get('shot') || '',
    grade: grade && GOLDEN_MILE_GRADES[grade] ? grade : 'golden',
    size: size && GOLDEN_MILE_SIZES[size] ? size : 'square',
    caption: q.get('caption') || '',
    subcaption: q.get('subcaption') || '',
    ribbon: q.get('ribbon') || '',
    panels: (q.get('panels') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

// Apply a URL preset to a fresh default state. Returns the state.
export function applyGoldenMileQuery(state, query) {
  state.grade = query.grade;
  state.size = query.size;
  if (query.caption) state.title = query.caption.toUpperCase();
  if (query.subcaption) state.script = query.subcaption;
  if (query.ribbon) state.ribbon = query.ribbon.toUpperCase();
  if (query.panels.length) state.panels = goldenMilePanelsFromFiles(query.panels);
  return state;
}
