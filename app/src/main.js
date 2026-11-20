// SUNREEL — editor (rebuild r11, poster cover studio edition).
//
// Wires the cover engine to the SUNREEL studio page: photo add /
// drag-drop / per-panel zoom + pan + flip + swap + face framing, the
// four-variant switcher, five SUNREEL layouts, six grades, caption
// (title / script / tagline), the LOOK & TITLE sliders (Paint, Grade,
// Halftone, Grain, Glow), stickers, undo/redo, smart crops, and
// full-resolution PNG export at all three sizes. The live preview and
// the export share drawCover, so what you see is what the PNG holds.
// r11: V1 (VICE PURSUIT / Sunset Chase) is unchanged from r10 — its five
// photographs, its collage grid and its strip line are exactly as Sand
// approved them. The three new variants — CITY OF CRIME (Diagonal trio),
// AFTER DARK (Hero + three), MIDNIGHT RUNNERS (Six grid) — each swap
// their own photos, title, script, tagline, quote, grade and strip line
// in one click. The big wanted-stars pill stays off unless a shot URL
// asks for it.

import {
  SIZES, LAYOUTS, GRADES, CAPTION_COLORS, TITLE_STYLES, VARIANTS, VARIANT_ORDER,
  defaultState, layoutPanels, panelAt, loadImage, fontsReady,
  drawCover, renderCover, isVariant,
} from './cover.js';

export const state = defaultState();
export let selectedPanel = 0;

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

// ---------------------------------------------------------------- history

/** Undo/redo stacks: snapshots of the small, serialisable parts of state
 *  (panel images are kept by reference, so a snapshot is cheap). */
const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 60;

function snapshot() {
  return JSON.parse(JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    strength: state.strength,
    contrast: state.contrast,
    saturation: state.saturation,
    grain: state.grain,
    grainAmount: state.grainAmount,
    vignette: state.vignette,
    halftone: state.halftone,
    halftoneAmount: state.halftoneAmount,
    glow: state.glow,
    size: state.size,
    caption: state.caption,
    subcaption: state.subcaption,
    tagline: state.tagline,
    captionColor: state.captionColor,
    titleStyle: state.titleStyle,
    captionPosition: state.captionPosition,
    wantedStars: state.wantedStars,
    roleTags: state.roleTags,
    locationLabels: state.locationLabels,
    heatBadge: state.heatBadge,
    hotSeal: state.hotSeal,
    quote: state.quote,
    quoteText: state.quoteText,
    quoteSource: state.quoteSource,
    bottomStrip: state.bottomStrip,
    stripText: state.stripText,
    billingText: state.billingText,
    stickers: state.stickers,
    panels: state.panels.map((p) => (p ? { zoom: p.zoom, ox: p.ox, oy: p.oy, fit: p.fit, flip: !!p.flip, name: p.name || '', src: p.src || '' } : null)),
  }));
}

function restore(snap) {
  const imgs = state.panels.map((p) => (p ? p.img : null));
  Object.assign(state, JSON.parse(JSON.stringify(snap)));
  state.panels = snap.panels.map((p, i) => {
    if (!p) return null;
    return { ...p, img: imgs[i] || null };
  });
}

export function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
  syncHistoryButtons();
}

export function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncControls();
  paint();
  syncHistoryButtons();
}

export function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncControls();
  paint();
  syncHistoryButtons();
}

function syncHistoryButtons() {
  const u = $('undoBtn');
  const r = $('redoBtn');
  if (u) u.disabled = !undoStack.length;
  if (r) r.disabled = !redoStack.length;
}

// ---------------------------------------------------------------- painting

/** Paint the preview at devicePixelRatio, never upscaled beyond the
 *  canvas's own backing store. */
export function paint() {
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  const box = preview.parentElement.getBoundingClientRect();
  const size = SIZES[state.size] || SIZES.landscape;
  const scale = Math.min(box.width / size.w, (box.height || box.width * 0.6) / size.h, 1);
  const cssW = Math.max(240, Math.floor(size.w * scale));
  const cssH = Math.max(135, Math.floor(size.h * scale));
  preview.style.width = `${cssW}px`;
  preview.style.height = `${cssH}px`;
  preview.width = Math.round(cssW * dpr);
  preview.height = Math.round(cssH * dpr);
  pctx.setTransform(preview.width / size.w, 0, 0, preview.height / size.h, 0, 0);
  pctx.imageSmoothingEnabled = true;
  pctx.imageSmoothingQuality = 'high';
  drawCover(pctx, state, size.w, size.h);
  updatePanelBar();
  updateSteps();
}

function updatePanelBar() {
  const n = (LAYOUTS[state.layout] || LAYOUTS.sunset).panels;
  const slot = state.panels[selectedPanel];
  const label = $('panelLabel');
  const note = $('panelNote');
  if (note) {
    note.textContent = slot && slot.img
      ? `Panel ${selectedPanel + 1} of ${n} — ${slot.name || 'photo'} selected. Zoom, Flip, Swap and Face act on this panel.`
      : `Panel ${selectedPanel + 1} of ${n} — empty. Click a thumbnail or drop a photo to fill it.`;
  }
  if (label) {
    label.textContent = slot && slot.img
      ? `Panel ${selectedPanel + 1} of ${n} — ${slot.name || 'photo'} (zoom ${Number(slot.zoom || 1).toFixed(2)}×${slot.flip ? ' · flipped' : ''})`
      : `Panel ${selectedPanel + 1} of ${n} — empty`;
  }
  document.querySelectorAll('.panel-dot').forEach((dot, i) => {
    dot.hidden = i >= n;
    dot.classList.toggle('active', i === selectedPanel);
    dot.classList.toggle('filled', !!(state.panels[i] && state.panels[i].img));
  });
}

function updateSteps() {
  const hasPhoto = state.panels.some((p) => p && p.img);
  $('step1')?.classList.toggle('done', hasPhoto);
  $('step2')?.classList.toggle('done', hasPhoto && (state.caption || '').trim().length > 0);
  $('step3')?.classList.toggle('done', false);
  const note = $('exportNote');
  if (note) {
    note.textContent = hasPhoto
      ? `Ready — export at ${SIZES[state.size].label}.`
      : 'Add a photo first, or try a sample below.';
  }
}

// ---------------------------------------------------------------- params

/** Apply ?shot= / URL params to state (variant, layout, grade, size,
 *  caption, colours, position, stars, furniture toggles, stickers). */
export function applyParams(params) {
  const set = (key, values, fn) => {
    const v = params.get(key);
    if (v && values.includes(v)) fn(v);
  };
  // &variant=sunset|crime|dark|runners is the r11 way; &layout= still
  // works for the five SUNREEL layouts and the legacy ones.
  const variant = params.get('variant');
  if (variant && VARIANTS[variant]) {
    const v = VARIANTS[variant];
    state.layout = v.layout;
    state.grade = v.grade;
    state.caption = v.title;
    state.subcaption = v.script;
    state.tagline = v.tagline;
    state.quoteText = v.quote;
    state.quoteSource = v.quoteSource;
    state.stripText = v.strip;
  }
  set('layout', Object.keys(LAYOUTS), (v) => { state.layout = v; });
  set('grade', [...Object.keys(GRADES), 'vice'], (v) => { state.grade = v; });
  set('size', Object.keys(SIZES), (v) => { state.size = v; });
  set('color', Object.keys(CAPTION_COLORS), (v) => { state.captionColor = v; });
  set('style', Object.keys(TITLE_STYLES), (v) => { state.titleStyle = v; });
  set('pos', ['top', 'bottom'], (v) => { state.captionPosition = v; });
  const caption = params.get('caption');
  if (caption) state.caption = caption.slice(0, 40);
  const sub = params.get('subcaption');
  if (sub) state.subcaption = sub.slice(0, 60);
  const tag = params.get('tagline');
  if (tag !== null) state.tagline = tag.slice(0, 60);
  const stars = params.get('stars');
  if (stars !== null) state.wantedStars = Math.max(0, Math.min(5, Number(stars) || 0));
  const strength = params.get('strength');
  if (strength !== null) state.strength = Math.max(0, Math.min(1, Number(strength) || 0.75));
  const contrast = params.get('contrast');
  if (contrast !== null) state.contrast = Math.max(0.5, Math.min(1.8, Number(contrast) || 1.06));
  const sat = params.get('saturation');
  if (sat !== null) state.saturation = Math.max(0, Math.min(2, Number(sat) || 1.25));
  const bool = (key, field) => {
    const v = params.get(key);
    if (v === '0' || v === 'false') state[field] = false;
    if (v === '1' || v === 'true') state[field] = true;
  };
  bool('grain', 'grain');
  bool('vignette', 'vignette');
  bool('halftone', 'halftone');
  bool('quote', 'quote');
  bool('strip', 'bottomStrip');
  bool('seal', 'hotSeal');
  bool('heat', 'heatBadge');
  bool('tags', 'roleTags');
  bool('places', 'locationLabels');
  resizePanels();
}

/** Grow/shrink the panels array to the current layout's panel count. */
export function resizePanels() {
  const n = (LAYOUTS[state.layout] || LAYOUTS.sunset).panels;
  while (state.panels.length < n) state.panels.push(null);
  state.panels.length = n;
  if (selectedPanel >= n) selectedPanel = 0;
}

/** Switch to a variant: its layout, grade, title, script, tagline,
 *  quote and strip line, then its photos. Used by the variant switcher
 *  in the editor and by the screenshot states. The photos load async;
 *  the text and grade apply immediately. */
export async function applyVariant(key) {
  const v = VARIANTS[key];
  if (!v) return;
  state.layout = v.layout;
  state.grade = v.grade;
  state.caption = v.title;
  state.subcaption = v.script;
  state.tagline = v.tagline;
  state.quoteText = v.quote;
  state.quoteSource = v.quoteSource;
  state.stripText = v.strip;
  resizePanels();
  await loadSamples(v.panels);
  syncControls();
}

// ---------------------------------------------------------------- samples

/** The photographs, keyed by scene: one distinct hero and one distinct
 *  atmosphere/weather per photo, so no two panels — and no two
 *  screenshots — ever repeat a look. All are real photographs made in
 *  this session. V1 keeps its r10 five (orange Lambo chase, neon driver,
 *  rainy fixer, canyon getaway, Everglades wildcard). The thirteen r11
 *  additions are all new — none reused from r10: a rainy insider, a
 *  fire-escape lookout and a yellow tunnel chase for CITY OF CRIME; a
 *  blue coupe hero, a night market, a truck woman and a police
 *  helicopter for AFTER DARK; a green pickup, a diner, a motel bike, a
 *  skater, a speedboat and a skyline for MIDNIGHT RUNNERS. */
export const SAMPLES = {
  chase: { file: 'samples/chase.jpg', name: 'Chase hero', label: 'Sunny palm boulevard — orange supercar + sport bike, police behind' },
  neon: { file: 'samples/neon.jpg', name: 'Neon night', label: 'Rainy neon city — woman + red sports car' },
  beach: { file: 'samples/beach.jpg', name: 'Golden beach', label: 'Golden-hour beach — convertible + surfer' },
  rain: { file: 'samples/rain.jpg', name: 'Downtown rain', label: 'Rainy downtown — muscle car + detective' },
  desert: { file: 'samples/desert.jpg', name: 'Desert noon', label: 'Desert noon — muscle car + biker, dust' },
  harbor: { file: 'samples/harbor.jpg', name: 'Harbor dusk', label: 'Harbor dusk — speedboat + yacht, purple sky' },
  rooftop: { file: 'samples/rooftop.jpg', name: 'Rooftop night', label: 'Rooftop night — helicopter + skyline' },
  pier: { file: 'samples/pier.jpg', name: 'Misty pier', label: 'Misty dawn pier — boat + fisherman' },
  canyon: { file: 'samples/media-generation-canyon-0-c4d8cd01-c46e-4fe4-9a6a-28562d745c56.jpg', name: 'Canyon sunset', label: 'Desert canyon sunset — orange muscle car on a winding red-rock road' },
  everglades: { file: 'samples/media-generation-everglades-0-f52ffb10-793a-4446-a27c-4c566baf23db.jpg', name: 'Everglades dusk', label: 'Everglades dusk — airboat + heron on a sawgrass marsh' },
  'driver-new': { file: 'samples/media-generation-driver-new-0-a4a6ffdb-ebac-4588-97b5-8489245ded3c.jpg', name: 'Neon driver', label: 'Neon night Ocean Drive — woman in sunglasses + red sports car, whole head in frame' },
  strip: { file: 'samples/media-generation-strip-0-907e3933-3a79-4f7d-b4c5-35b26bf1dd4d.jpg', name: 'Neon strip', label: 'Neon strip street at night — signs, palms, crowd, wet asphalt' },
  coast: { file: 'samples/media-generation-coast-0-314c9a1b-aa54-4a49-8b40-04a2bccfcf85.jpg', name: 'Sunny coast', label: 'Sunny coast road — vintage pastel convertible, turquoise ocean' },
  'classic-muscle': { file: 'samples/media-generation-classic-muscle-0-47a21597-feaf-4c2a-ac67-f8ac41f5db5b.jpg', name: 'Classic muscle', label: 'Classic 1970s muscle car at golden hour on a palm boulevard' },
  'vintage-caddy': { file: 'samples/media-generation-vintage-caddy-0-b7652341-d0c2-4215-af17-120b03dba907.jpg', name: 'Vintage Cadillac', label: 'Vintage pink 1950s Cadillac convertible on a beach at sunset' },
  'modern-sunset': { file: 'samples/media-generation-modern-sunset-0-3ec9c91e-bf74-4fb1-abd0-1018865cebb6.jpg', name: 'Modern racer', label: 'Modern white sports car on a coastal highway at sunset' },
  driver2: { file: 'samples/media-generation-driver2-0-b34dc120-e509-4bc3-ba43-661f0c663e1c.jpg', name: 'Dusk charmer', label: 'Dusk — blonde woman in sunglasses leaning on a classic red convertible, whole head in frame' },
  biker: { file: 'samples/media-generation-biker-0-53cab0bd-72f7-4fc9-8ac6-8e725a9c76a9.jpg', name: 'Sunset rider', label: 'Motorcyclist riding into a huge orange sunset on a highway' },
  'palm-night': { file: 'samples/media-generation-palm-night-0-b9c46a3c-400a-41a1-8b79-e24d0676d2c8.jpg', name: 'Palm boulevard', label: 'Palm boulevard at night — classic sedan under neon signs' },
  garage: { file: 'samples/media-generation-garage-0-735bc6cb-8c50-41cd-b075-b27405361d0a.jpg', name: 'Garage night', label: 'Garage at night — mechanic under the hood of a classic muscle car' },
  'sunset-duo': { file: 'samples/media-generation-sunset-duo-0-7f9f1cb0-4aea-484d-91d5-b31bc29942f7.jpg', name: 'Sunset duo', label: 'Modern supercar + classic muscle car racing side by side at sunset' },
  // r11 — CITY OF CRIME (Diagonal trio)
  'crime-insider': { file: 'samples/media-generation-crime-insider-0-de10d04b-e4b4-4e49-9902-65951957155f.jpg', name: 'The insider', label: 'Rainy downtown alley at night — older man in a grey suit, neon bar signs, whole head in frame' },
  // r12 — THE LOOKOUT is re-cast: the r11 fire-escape lookout (young woman
  // with curly hair) is replaced by a menacing tattooed gangster man —
  // full tattoo sleeves, neck and face tattoos, leather jacket, gold
  // chain, stern expression, dark neon alley in the rain. Portrait
  // 1120×2240, face in the upper half with clear sky above the hair, so
  // the whole head stays in frame and the THE LOOKOUT pill never covers
  // it. The r11 file stays on disk, unreferenced.
  'crime-lookout': { file: 'samples/media-generation-media-generation-crime-lookout-0-c1113d89-0c15-4907-9ca2-4c80dbdba162.webp', name: 'The lookout', label: 'Neon alley at night — tattooed gangster man, full sleeves, neck and face tattoos, leather jacket, gold chain, stern stare, whole face in frame' },
  'crime-tunnel': { file: 'samples/media-generation-crime-tunnel-0-dca6641c-b4a3-45a5-b95c-ec0acfb40b16.jpg', name: 'Tunnel chase', label: 'Yellow sports car speeding through a highway tunnel at night, motion blur' },
  // r11 — AFTER DARK (Hero + three)
  'dark-bluecoupe': { file: 'samples/media-generation-dark-bluecoupe-0-a4a5a0ea-2b42-404b-a8ba-e5cb69fe023f.jpg', name: 'Blue coupe', label: 'Deep blue coupe on a wet boulevard at night, palm silhouettes, neon reflections' },
  // r12 — AFTER DARK's two middle panels are re-shot: Sand called the r11
  // night market and truck woman "terlalu lebay" (too over-the-top /
  // stiff, posed), so both are replaced with live, exciting moments.
  // THE MARKET is now a high-energy Vice City street party — a neon
  // boulevard packed with a cheering crowd, lowriders and sports cars
  // under pink neon, confetti in the air. THE DRIVER is now a dynamic
  // action shot — a driver gripping the wheel mid high-speed chase at
  // night, neon streaks blurring past the windows, face fully in frame.
  // The r11 keys ('dark-nightmarket', 'dark-truckwoman') are retired;
  // their files stay on disk, unreferenced. THE RIDE (blue coupe hero)
  // and THE SKY (police helicopter) are untouched.
  'dark-street': { file: 'samples/media-generation-media-generation-dark-street-r-0-821950e7-99a0-43b2-accf-3b05ac42262f.webp', name: 'Street party', label: 'Neon boulevard car meet at night — crowd cheering, lowriders and sports cars, pink neon, confetti, wet asphalt' },
  'dark-driver': { file: 'samples/media-generation-media-generation-dark-driver-r-0-115eae96-35ed-4ee0-a9f4-e20f057cb49b.webp', name: 'Chase driver', label: 'Driver gripping the wheel mid high-speed chase at night — neon streaks past the windows, face fully in frame' },
  'dark-helicopter': { file: 'samples/media-generation-dark-helicopter-0-8dd4bdad-9982-4333-be07-049aa76316c4.jpg', name: 'Searchlight', label: 'Police helicopter searchlight sweeping over a suspension bridge at night' },
  // r11 — MIDNIGHT RUNNERS (Six grid)
  'runners-pickup': { file: 'samples/media-generation-runners-pickup-0-9fb9d3e3-4b89-4ba5-b077-ef1a159f86c1.jpg', name: 'Green pickup', label: 'Vintage green pickup on a desert highway at golden hour, dust trailing' },
  'runners-diner': { file: 'samples/media-generation-runners-diner-0-4e8f1b27-7cf4-47cf-9758-2952b8b0da6b.jpg', name: 'The diner', label: 'Retro drive-in diner at dusk — young man in a denim jacket, neon pink signage, whole head in frame' },
  'runners-motelbike': { file: 'samples/media-generation-runners-motelbike-0-53ed714b-b2ab-4946-9447-1c0837d4bb06.jpg', name: 'Motel bike', label: 'Black vintage motorcycle outside a neon motel at night, wet pavement' },
  'runners-skatewoman': { file: 'samples/media-generation-runners-skatewoman-0-50387a02-c1a1-4f7b-a74a-44509877d0d1.jpg', name: 'The skater', label: 'Skate park at sunset — woman with long braided hair holding a skateboard, whole head in frame' },
  'runners-speedboat': { file: 'samples/media-generation-runners-speedboat-0-ac12628a-24b0-4a52-8956-dd91a43ca3df.jpg', name: 'Speedboat', label: 'White speedboat racing across a bay at dusk, purple-orange sky' },
  'runners-skyline': { file: 'samples/media-generation-runners-skyline-0-6e685994-a9e8-47da-937e-80a46bc06e6c.jpg', name: 'The overlook', label: 'City skyline from a hilltop at blue hour, red sedan in the foreground' },
};
export const SAMPLE_ORDER = ['crime-insider', 'crime-lookout', 'crime-tunnel', 'dark-bluecoupe', 'dark-street', 'dark-driver', 'dark-helicopter', 'runners-pickup', 'runners-diner', 'runners-motelbike', 'runners-skatewoman', 'runners-speedboat', 'runners-skyline', 'chase', 'driver-new', 'rain', 'canyon', 'everglades', 'strip', 'driver2', 'rooftop', 'palm-night', 'classic-muscle', 'coast', 'beach', 'pier', 'vintage-caddy', 'modern-sunset', 'sunset-duo', 'biker', 'garage', 'harbor', 'desert', 'neon'];

/** Smart crops: per-scene focus offsets, so each sample lands with its
 *  hero in frame instead of a blind centre crop. The portrait photos
 *  (lookout, skater, diner, insider) are framed from mid-torso up with
 *  clear sky above the hair — their offsets pull the window UP (positive
 *  oy moves the photo down in its panel, showing more of the top), so
 *  the whole head stays in frame and is never cropped. The r12 lookout
 *  is a tall portrait (1120×2240) with the face in the upper half, so
 *  its +0.10 offset keeps the forehead and the gold chain in frame on
 *  the short diagonal panel. The r12 driver is a wide chase shot framed
 *  on the wheel and the face, so a small +0.04 keeps both in frame; the
 *  r12 street party is a wide crowd scene that crops clean from the
 *  centre. The canyon and Everglades crops pull down hard to keep
 *  their low heroes in frame. */
export const SMART_CROPS = {
  chase: { ox: 0, oy: -0.04 },
  neon: { ox: 0.06, oy: 0 },
  beach: { ox: 0, oy: -0.04 },
  rain: { ox: -0.05, oy: 0.02 },
  desert: { ox: 0, oy: -0.08 },
  harbor: { ox: 0, oy: -0.05 },
  rooftop: { ox: 0, oy: 0.06 },
  pier: { ox: 0.04, oy: 0.02 },
  canyon: { ox: 0, oy: -0.35 },
  everglades: { ox: 0, oy: -0.2 },
  'driver-new': { ox: 0, oy: 0.10 },
  strip: { ox: 0, oy: 0 },
  coast: { ox: 0, oy: -0.05 },
  'classic-muscle': { ox: 0, oy: -0.05 },
  'vintage-caddy': { ox: 0, oy: -0.05 },
  'modern-sunset': { ox: 0, oy: -0.05 },
  driver2: { ox: 0, oy: 0.05 },
  biker: { ox: 0, oy: -0.05 },
  'palm-night': { ox: 0, oy: 0 },
  garage: { ox: 0, oy: 0 },
  'sunset-duo': { ox: 0, oy: -0.05 },
  'crime-insider': { ox: 0, oy: 0.08 },
  'crime-lookout': { ox: 0, oy: 0.10 },
  'crime-tunnel': { ox: 0, oy: -0.02 },
  'dark-bluecoupe': { ox: 0, oy: -0.04 },
  'dark-street': { ox: 0, oy: 0 },
  'dark-driver': { ox: 0, oy: 0.04 },
  'dark-helicopter': { ox: 0, oy: -0.04 },
  'runners-pickup': { ox: 0, oy: -0.05 },
  'runners-diner': { ox: 0, oy: 0.08 },
  'runners-motelbike': { ox: 0, oy: 0 },
  'runners-skatewoman': { ox: 0, oy: 0.10 },
  'runners-speedboat': { ox: 0, oy: -0.05 },
  'runners-skyline': { ox: 0, oy: -0.06 },
};

function slotFor(img, name, src, key) {
  const crop = SMART_CROPS[key] || { ox: 0, oy: 0 };
  return { img, name, src, zoom: 1, ox: crop.ox, oy: crop.oy, fit: 'cover', flip: false };
}

/** Load samples in the given key order into the panels (panel 1 = the
 *  lead photo). With no order, the current variant's photos load. */
export async function loadSamples(order) {
  const keys = (order && order.length ? order : (VARIANTS[state.layout]?.panels || SAMPLE_ORDER)).filter((k) => SAMPLES[k]);
  const n = (LAYOUTS[state.layout] || LAYOUTS.sunset).panels;
  const loaded = await Promise.all(keys.map(async (k) => {
    try {
      const img = await loadImage(SAMPLES[k].file);
      return { key: k, img };
    } catch {
      return null;
    }
  }));
  pushHistory();
  for (let i = 0; i < n; i++) {
    const hit = loaded[i % loaded.length];
    if (hit) state.panels[i] = slotFor(hit.img, SAMPLES[hit.key].name, SAMPLES[hit.key].file, hit.key);
  }
  paint();
}

/** Cycle one sample into the selected panel. */
export async function trySample() {
  const key = SAMPLE_ORDER[(trySample.cursor = ((trySample.cursor ?? -1) + 1) % SAMPLE_ORDER.length)];
  try {
    const img = await loadImage(SAMPLES[key].file);
    pushHistory();
    state.panels[selectedPanel] = slotFor(img, SAMPLES[key].name, SAMPLES[key].file, key);
    paint();
  } catch { /* sample missing — editor still works with uploads */ }
}

/** Fill every panel with the selected panel's photo, each with its own
 *  smart crop, so one photo becomes five different shots. */
export function fillAllFromSelected() {
  const src = state.panels[selectedPanel];
  if (!src || !src.img) return;
  pushHistory();
  const n = (LAYOUTS[state.layout] || LAYOUTS.sunset).panels;
  const crops = [
    { ox: 0, oy: -0.08 }, { ox: 0.12, oy: 0 }, { ox: -0.12, oy: 0.06 },
    { ox: 0, oy: 0.10 }, { ox: 0.08, oy: -0.02 }, { ox: -0.06, oy: -0.06 },
  ];
  for (let i = 0; i < n; i++) {
    const c = crops[i % crops.length];
    state.panels[i] = { ...src, zoom: 1.15, ox: c.ox, oy: c.oy };
  }
  paint();
}

// ---------------------------------------------------------------- photos in

/** Add uploaded files: first file goes to the selected panel, the rest
 *  fill the following panels in order. */
export async function addFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  pushHistory();
  const n = (LAYOUTS[state.layout] || LAYOUTS.sunset).panels;
  for (let i = 0; i < list.length; i++) {
    const idx = (selectedPanel + i) % n;
    const url = URL.createObjectURL(list[i]);
    try {
      const img = await loadImage(url);
      state.panels[idx] = { img, name: list[i].name, src: url, zoom: 1, ox: 0, oy: 0, fit: 'cover', flip: false };
    } catch { /* skip unreadable files */ }
  }
  paint();
}

/** Replace the selected panel's photo with an uploaded file. */
export async function replaceSelected(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    pushHistory();
    state.panels[selectedPanel] = { img, name: file.name, src: url, zoom: 1, ox: 0, oy: 0, fit: 'cover', flip: false };
    paint();
  } catch { /* unreadable */ }
}

/** Clear the selected panel. */
export function clearSelected() {
  if (!state.panels[selectedPanel]) return;
  pushHistory();
  state.panels[selectedPanel] = null;
  paint();
}

// ---------------------------------------------------------------- panel ops

/** Mirror the selected panel's photo left–right. */
export function flipSelected() {
  const slot = state.panels[selectedPanel];
  if (!slot) return;
  pushHistory();
  slot.flip = !slot.flip;
  paint();
}

/** Swap the selected panel with the next one (wraps around). */
export function swapSelected() {
  const n = state.panels.length;
  if (n < 2) return;
  pushHistory();
  const next = (selectedPanel + 1) % n;
  [state.panels[selectedPanel], state.panels[next]] = [state.panels[next], state.panels[selectedPanel]];
  selectedPanel = next;
  paint();
}

/** Face framing: pull the selected photo's crop up and zoom in slightly,
 *  so a portrait subject's whole head sits inside the panel. */
export function faceSelected() {
  const slot = state.panels[selectedPanel];
  if (!slot) return;
  pushHistory();
  slot.oy = 0.12;
  slot.zoom = Math.max(slot.zoom || 1, 1.08);
  paint();
}

/** Reset the selected panel's zoom, pan and flip. */
export function resetSelected() {
  const slot = state.panels[selectedPanel];
  if (!slot) return;
  pushHistory();
  const crop = SMART_CROPS[slot.name] || { ox: 0, oy: 0 };
  slot.zoom = 1;
  slot.ox = crop.ox;
  slot.oy = crop.oy;
  slot.flip = false;
  slot.fit = 'cover';
  paint();
}

/** Move the panel selection forward or back (Photo prev / next). */
export function stepPanel(dir) {
  const n = (LAYOUTS[state.layout] || LAYOUTS.sunset).panels;
  selectedPanel = (selectedPanel + dir + n) % n;
  const slot = state.panels[selectedPanel];
  const z = $('zoom');
  if (z) z.value = slot ? slot.zoom : 1;
  paint();
}

// ---------------------------------------------------------------- export

/** Export the cover at full native resolution for the chosen size. */
export async function exportPng(sizeKey) {
  await fontsReady();
  const key = sizeKey || state.size;
  const canvas = renderCover(state, key);
  const size = SIZES[key];
  const a = document.createElement('a');
  a.download = `sunreel-${state.caption.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cover'}-${key}-${size.w}x${size.h}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  $('step3')?.classList.add('done');
}

/** Export all three PNG sizes, one after another. */
export async function exportAllThree() {
  for (const key of ['square', 'portrait', 'landscape']) {
    await exportPng(key);
    await new Promise((r) => setTimeout(r, 350));
  }
}

// ---------------------------------------------------------------- controls

/** Reflect state back into every control (after undo/redo or a ?shot=). */
export function syncControls() {
  const setVal = (id, v) => { const el = $(id); if (el) el.value = v; };
  const setCheck = (id, v) => { const el = $(id); if (el) el.checked = !!v; };
  setVal('captionInput', state.caption);
  setVal('scriptInput', state.subcaption);
  setVal('taglineInput', state.tagline);
  setVal('quoteInput', state.quoteText);
  setVal('quoteSourceInput', state.quoteSource);
  setVal('stripInput', state.stripText);
  setVal('paintSlider', Math.round((state.saturation || 1.25) / 2 * 100));
  setVal('gradeSlider', Math.round((state.strength || 0.75) * 100));
  setVal('halftoneSlider', Math.round((state.halftoneAmount || 0.2) * 100));
  setVal('grainSlider', Math.round((state.grainAmount || 0.5) * 100));
  setVal('glowSlider', Math.round((state.glow ?? 0.5) * 100));
  setCheck('grainToggle', state.grain);
  setCheck('vignetteToggle', state.vignette);
  setCheck('halftoneToggle', state.halftone);
  setCheck('tagsToggle', state.roleTags);
  setCheck('heatToggle', state.heatBadge);
  setCheck('sealToggle', state.hotSeal);
  setCheck('quoteToggle', state.quote);
  setCheck('stripToggle', state.bottomStrip);
  setCheck('nameTagToggle', state.roleTags);
  const slot = state.panels[selectedPanel];
  setVal('zoom', slot ? slot.zoom : 1);
  const mark = (attr, value) => {
    document.querySelectorAll(`[data-${attr}]`).forEach((b) => {
      b.classList.toggle('active', b.dataset[attr] === value);
    });
  };
  mark('layout', state.layout);
  mark('grade', state.grade);
  mark('color', state.captionColor);
  mark('style', state.titleStyle);
  mark('pos', state.captionPosition);
  mark('size', state.size);
  mark('variant', VARIANT_ORDER.find((k) => VARIANTS[k].layout === state.layout) || '');
  const hint = $('layoutHint');
  if (hint) hint.textContent = (LAYOUTS[state.layout] || {}).hint || '';
  updateSliderLabels();
}

function updateSliderLabels() {
  const set = (id, text) => { const el = $(id); if (el) el.textContent = text; };
  set('paintVal', `${Math.round((state.saturation || 1.25) / 2 * 100)}`);
  set('gradeVal', `${Math.round((state.strength || 0.75) * 100)}`);
  set('halftoneVal', `${Math.round((state.halftoneAmount || 0.2) * 100)}`);
  set('grainVal', `${Math.round((state.grainAmount || 0.5) * 100)}`);
  set('glowVal', `${Math.round((state.glow ?? 0.5) * 100)}`);
}

/** Build the photo thumbnail grid in the left panel. Eight thumbnails
 *  by default, so the Layout / Grade / Caption groups stay in view; the
 *  "Show all" toggle reveals the full thirty-four. */
let showAllPhotos = false;
function buildSampleGrid() {
  const grid = $('photoGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const keys = showAllPhotos ? SAMPLE_ORDER : SAMPLE_ORDER.slice(0, 8);
  for (const key of keys) {
    const s = SAMPLES[key];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.title = s.label;
    const img = document.createElement('img');
    img.src = s.file;
    img.alt = s.name;
    img.loading = 'lazy';
    const span = document.createElement('span');
    span.textContent = s.name;
    btn.append(img, span);
    btn.addEventListener('click', async () => {
      try {
        const im = await loadImage(s.file);
        pushHistory();
        state.panels[selectedPanel] = slotFor(im, s.name, s.file, key);
        paint();
      } catch { /* missing sample */ }
    });
    grid.appendChild(btn);
  }
}

/** Auto layout: pick the SUNREEL layout whose panel count matches the
 *  number of filled panels (3 → Diagonal trio, 4 → Hero + three,
 *  6 → Six grid, 7 → Seven mosaic, otherwise Hero mosaic). */
export function autoLayout() {
  const filled = state.panels.filter((p) => p && p.img).length;
  const pick = filled <= 3 ? 'diagonal' : filled === 4 ? 'hero-three' : filled === 7 ? 'seven' : filled === 6 ? 'sixgrid' : 'hero-mosaic';
  pushHistory();
  state.layout = pick;
  resizePanels();
  syncControls();
  paint();
}

/** Surprise me: jump to a random variant with a random grade. */
export async function surpriseMe() {
  const key = VARIANT_ORDER[Math.floor(Math.random() * VARIANT_ORDER.length)];
  const grades = Object.keys(GRADES);
  const grade = grades[Math.floor(Math.random() * grades.length)];
  pushHistory();
  await applyVariant(key);
  state.grade = grade;
  syncControls();
  paint();
}

/** Boot the editor: wire every control, then paint. */
export async function bootEditor(params) {
  if (params) applyParams(params);
  resizePanels();
  buildSampleGrid();

  const on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); };
  const mark = (attr, value) => {
    document.querySelectorAll(`[data-${attr}]`).forEach((b) => {
      b.classList.toggle('active', b.dataset[attr] === value);
    });
  };

  // Photos
  on('photoInput', 'change', (e) => { addFiles(e.target.files); e.target.value = ''; });
  on('addPhotosBtn', 'click', () => $('photoInput')?.click());
  on('showAllPhotosBtn', 'click', () => {
    showAllPhotos = !showAllPhotos;
    const b = $('showAllPhotosBtn');
    if (b) b.textContent = showAllPhotos ? 'Show fewer photos' : 'Show all 34 photos';
    buildSampleGrid();
  });
  on('sampleBtn', 'click', trySample);
  on('fillAllBtn', 'click', fillAllFromSelected);
  on('autoLayoutBtn', 'click', autoLayout);
  on('surpriseBtn', 'click', surpriseMe);
  on('replaceBtn', 'click', () => $('replaceInput')?.click());
  on('replaceInput', 'change', (e) => { replaceSelected(e.target.files[0]); e.target.value = ''; });
  on('clearPanelBtn', 'click', clearSelected);

  // Variant switcher: a variant button swaps the whole cover — its
  // photos, title, script, tagline, quote, grade and strip line.
  document.querySelectorAll('[data-variant]').forEach((b) => b.addEventListener('click', async () => {
    pushHistory();
    await applyVariant(b.dataset.variant);
    mark('variant', b.dataset.variant);
    mark('layout', state.layout);
    mark('grade', state.grade);
    $('layoutHint').textContent = LAYOUTS[state.layout].hint;
    paint();
  }));
  // Layout buttons: the five SUNREEL layouts + legacy ones. Switching a
  // layout rearranges the grid only; the photos stay where they are.
  document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.layout = b.dataset.layout;
    resizePanels();
    mark('layout', state.layout);
    $('layoutHint').textContent = LAYOUTS[state.layout].hint;
    paint();
  }));
  document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.grade = b.dataset.grade;
    mark('grade', state.grade);
    paint();
  }));
  document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
    state.size = b.dataset.size;
    mark('size', state.size);
    paint();
  }));
  document.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.captionColor = b.dataset.color;
    mark('color', state.captionColor);
    paint();
  }));
  document.querySelectorAll('[data-style]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.titleStyle = b.dataset.style;
    mark('style', state.titleStyle);
    paint();
  }));
  document.querySelectorAll('[data-pos]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.captionPosition = b.dataset.pos;
    mark('pos', state.captionPosition);
    paint();
  }));

  // Caption — title, script and tagline all edit the cover live.
  on('captionInput', 'input', (e) => { state.caption = e.target.value.slice(0, 40); paint(); });
  on('captionInput', 'change', pushHistory);
  on('scriptInput', 'input', (e) => { state.subcaption = e.target.value.slice(0, 60); paint(); });
  on('scriptInput', 'change', pushHistory);
  on('taglineInput', 'input', (e) => { state.tagline = e.target.value.slice(0, 60); paint(); });
  on('taglineInput', 'change', pushHistory);
  on('quoteInput', 'input', (e) => { state.quoteText = e.target.value.slice(0, 80); paint(); });
  on('quoteInput', 'change', pushHistory);
  on('quoteSourceInput', 'input', (e) => { state.quoteSource = e.target.value.slice(0, 40); paint(); });
  on('stripInput', 'input', (e) => { state.stripText = e.target.value.slice(0, 80); paint(); });
  on('stripInput', 'change', pushHistory);

  // LOOK & TITLE sliders: Paint = saturation, Grade = grade strength,
  // Halftone = halftone amount (0 still shows the toggle state),
  // Grain = grain amount, Glow = title glow.
  const lookSlider = (id, fn) => on(id, 'input', (e) => {
    fn(Number(e.target.value) / 100);
    updateSliderLabels();
    paint();
  });
  lookSlider('paintSlider', (v) => { state.saturation = v * 2; });
  lookSlider('gradeSlider', (v) => { state.strength = v; });
  lookSlider('halftoneSlider', (v) => { state.halftoneAmount = v; state.halftone = v > 0; const t = $('halftoneToggle'); if (t) t.checked = state.halftone; });
  lookSlider('grainSlider', (v) => { state.grainAmount = v; });
  lookSlider('glowSlider', (v) => { state.glow = v; });
  ['paintSlider', 'gradeSlider', 'halftoneSlider', 'grainSlider', 'glowSlider'].forEach((id) => on(id, 'change', pushHistory));

  // Effect toggles
  const toggle = (id, field) => on(id, 'change', (e) => {
    pushHistory();
    state[field] = e.target.checked;
    paint();
  });
  toggle('grainToggle', 'grain');
  toggle('vignetteToggle', 'vignette');
  toggle('halftoneToggle', 'halftone');
  toggle('tagsToggle', 'roleTags');
  toggle('heatToggle', 'heatBadge');
  toggle('sealToggle', 'hotSeal');
  toggle('quoteToggle', 'quote');
  toggle('stripToggle', 'bottomStrip');
  on('nameTagToggle', 'change', (e) => {
    pushHistory();
    state.roleTags = e.target.checked;
    const t = $('tagsToggle');
    if (t) t.checked = state.roleTags;
    paint();
  });

  // Stickers
  document.querySelectorAll('[data-sticker]').forEach((b) => b.addEventListener('click', () => {
    pushHistory();
    state.stickers.push({ type: b.dataset.sticker, x: 0.5, y: 0.42, scale: 1 });
    paint();
  }));
  on('clearStickersBtn', 'click', () => {
    if (!state.stickers.length) return;
    pushHistory();
    state.stickers = [];
    paint();
  });

  // Undo / redo
  on('undoBtn', 'click', undo);
  on('redoBtn', 'click', redo);
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });

  // Panel controls (right panel)
  on('zoom', 'input', (e) => {
    const slot = state.panels[selectedPanel];
    if (!slot) return;
    slot.zoom = Number(e.target.value);
    paint();
  });
  on('zoom', 'change', pushHistory);
  on('prevPhotoBtn', 'click', () => stepPanel(-1));
  on('nextPhotoBtn', 'click', () => stepPanel(1));
  on('resetPanelBtn', 'click', resetSelected);
  on('flipBtn', 'click', flipSelected);
  on('swapBtn', 'click', swapSelected);
  on('faceBtn', 'click', faceSelected);
  document.querySelectorAll('.panel-dot').forEach((dot, i) => dot.addEventListener('click', () => {
    selectedPanel = i;
    const slot = state.panels[selectedPanel];
    const z = $('zoom');
    if (z) z.value = slot ? slot.zoom : 1;
    paint();
  }));

  // Export: one size per button, or all three at once.
  document.querySelectorAll('[data-export-size]').forEach((b) => b.addEventListener('click', () => exportPng(b.dataset.exportSize)));
  on('exportAllBtn', 'click', exportAllThree);
  on('exportBtn', 'click', () => exportPng());

  // Click a panel to select it; drag the photo to pan it.
  let drag = null;
  const canvasPos = (e) => {
    const r = preview.getBoundingClientRect();
    const size = SIZES[state.size];
    return { x: (e.clientX - r.left) / r.width * size.w, y: (e.clientY - r.top) / r.height * size.h, size };
  };
  preview.addEventListener('pointerdown', (e) => {
    const { x, y, size } = canvasPos(e);
    const idx = panelAt(state.layout, size.w, size.h, x, y);
    if (idx < 0) return;
    selectedPanel = idx;
    const slot = state.panels[idx];
    drag = { idx, startX: x, startY: y, ox: slot ? slot.ox : 0, oy: slot ? slot.oy : 0, moved: false };
    preview.setPointerCapture(e.pointerId);
    paint();
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { x, y, size } = canvasPos(e);
    const slot = state.panels[drag.idx];
    if (!slot) return;
    const dx = (x - drag.startX) / size.w;
    const dy = (y - drag.startY) / size.h;
    if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
    slot.ox = Math.max(-0.6, Math.min(0.6, drag.ox + dx));
    slot.oy = Math.max(-0.6, Math.min(0.6, drag.oy + dy));
    paint();
  });
  preview.addEventListener('pointerup', () => {
    if (drag && drag.moved) pushHistory();
    drag = null;
  });

  // Drop files onto the preview: onto a panel to fill that panel.
  const dropTarget = $('stageDrop') || preview.parentElement;
  ['dragover', 'dragenter'].forEach((ev) => dropTarget.addEventListener(ev, (e) => {
    e.preventDefault();
    dropTarget.classList.add('dropping');
  }));
  ['dragleave', 'drop'].forEach((ev) => dropTarget.addEventListener(ev, (e) => {
    e.preventDefault();
    dropTarget.classList.remove('dropping');
  }));
  dropTarget.addEventListener('drop', async (e) => {
    const files = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    if (e.target === preview || preview.contains(e.target)) {
      const { x, y, size } = canvasPos(e);
      const idx = panelAt(state.layout, size.w, size.h, x, y);
      if (idx >= 0) selectedPanel = idx;
    }
    await addFiles(files);
  });

  window.addEventListener('resize', paint);
  await fontsReady();
  syncControls();
  paint();
}
