// VICE PURSUIT — editor (rebuild r9, six-panel edition).
//
// Wires the cover engine to the page: photo add / drag-drop / per-panel
// zoom + pan, layouts, grades, sliders, title styles, callouts, stickers,
// undo/redo, smart crops, and full-resolution PNG export. The live preview
// and the export share drawCover, so what you see is what the PNG holds.
// r9: the Magazine layout is six panels (hero + five stacked right), the
// big wanted-stars pill defaults to off, the HEAT badge reads ★★★★☆, and
// the sample strip holds ten photographs — the r8 eight plus a desert
// canyon sunset and an Everglades dusk, both made in this session.

import {
  SIZES, LAYOUTS, GRADES, CAPTION_COLORS, TITLE_STYLES,
  defaultState, layoutPanels, panelAt, loadImage, fontsReady,
  drawCover, renderCover,
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
    size: state.size,
    caption: state.caption,
    subcaption: state.subcaption,
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
    panels: state.panels.map((p) => (p ? { zoom: p.zoom, ox: p.ox, oy: p.oy, fit: p.fit, name: p.name || '', src: p.src || '' } : null)),
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
  const n = (LAYOUTS[state.layout] || LAYOUTS.magazine).panels;
  const slot = state.panels[selectedPanel];
  const label = $('panelLabel');
  if (label) {
    label.textContent = slot && slot.img
      ? `Panel ${selectedPanel + 1} — ${slot.name || 'photo'} (zoom ${Number(slot.zoom || 1).toFixed(2)}×)`
      : `Panel ${selectedPanel + 1} — empty`;
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

/** Apply ?shot= / URL params to state (layout, grade, size, caption,
 *  colours, position, stars, furniture toggles, stickers). */
export function applyParams(params) {
  const set = (key, values, fn) => {
    const v = params.get(key);
    if (v && values.includes(v)) fn(v);
  };
  set('layout', Object.keys(LAYOUTS), (v) => { state.layout = v; });
  set('grade', Object.keys(GRADES), (v) => { state.grade = v; });
  set('size', Object.keys(SIZES), (v) => { state.size = v; });
  set('color', Object.keys(CAPTION_COLORS), (v) => { state.captionColor = v; });
  set('style', Object.keys(TITLE_STYLES), (v) => { state.titleStyle = v; });
  set('pos', ['top', 'bottom'], (v) => { state.captionPosition = v; });
  const caption = params.get('caption');
  if (caption) state.caption = caption.slice(0, 40);
  const sub = params.get('subcaption');
  if (sub) state.subcaption = sub.slice(0, 60);
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
  const n = (LAYOUTS[state.layout] || LAYOUTS.magazine).panels;
  while (state.panels.length < n) state.panels.push(null);
  state.panels.length = n;
  if (selectedPanel >= n) selectedPanel = 0;
}

// ---------------------------------------------------------------- samples

/** The ten in-session photographs, keyed by scene: one distinct hero and
 *  one distinct atmosphere/weather per photo, so no two panels — and no two
 *  screenshots — ever repeat a look. All ten are real photographs made in
 *  this session: the chase hero is an edit of the owner's own car photo, the
 *  other nine are AI-generated photographs. The two r9 additions sit at
 *  the end of the order so the older eight keep their places: a desert
 *  canyon at sunset with an orange muscle car on a winding road, and an
 *  Everglades airboat at dusk with a heron in the shallows. */
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
};
export const SAMPLE_ORDER = ['chase', 'neon', 'beach', 'rain', 'desert', 'harbor', 'rooftop', 'pier', 'canyon', 'everglades'];

/** Smart crops: per-scene focus offsets, so each sample lands with its
 *  hero in frame instead of a blind centre crop. The two r9 photos keep
 *  their heroes low in the frame (the canyon's car, the Everglades boat
 *  and heron), so their offsets pull down hard — a centre crop on a short
 *  stacked panel would cut both clean off. */
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
};

function slotFor(img, name, src, key) {
  const crop = SMART_CROPS[key] || { ox: 0, oy: 0 };
  return { img, name, src, zoom: 1, ox: crop.ox, oy: crop.oy, fit: 'cover' };
}

/** Load samples in the given key order into the panels (panel 1 = hero). */
export async function loadSamples(order) {
  const keys = (order && order.length ? order : SAMPLE_ORDER).filter((k) => SAMPLES[k]);
  const n = (LAYOUTS[state.layout] || LAYOUTS.magazine).panels;
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
  const n = (LAYOUTS[state.layout] || LAYOUTS.magazine).panels;
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
  const n = (LAYOUTS[state.layout] || LAYOUTS.magazine).panels;
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
  const n = (LAYOUTS[state.layout] || LAYOUTS.magazine).panels;
  for (let i = 0; i < list.length; i++) {
    const idx = (selectedPanel + i) % n;
    const url = URL.createObjectURL(list[i]);
    try {
      const img = await loadImage(url);
      state.panels[idx] = { img, name: list[i].name, src: url, zoom: 1, ox: 0, oy: 0, fit: 'cover' };
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
    state.panels[selectedPanel] = { img, name: file.name, src: url, zoom: 1, ox: 0, oy: 0, fit: 'cover' };
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

// ---------------------------------------------------------------- export

/** Export the cover at full native resolution for the chosen size. */
export async function exportPng() {
  await fontsReady();
  const canvas = renderCover(state, state.size);
  const size = SIZES[state.size];
  const a = document.createElement('a');
  a.download = `vice-pursuit-${state.size}-${size.w}x${size.h}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  $('step3')?.classList.add('done');
}

// ---------------------------------------------------------------- controls

/** Reflect state back into every control (after undo/redo or a ?shot=). */
export function syncControls() {
  const setVal = (id, v) => { const el = $(id); if (el) el.value = v; };
  const setCheck = (id, v) => { const el = $(id); if (el) el.checked = !!v; };
  setVal('captionInput', state.caption);
  setVal('subInput', state.subcaption);
  setVal('quoteInput', state.quoteText);
  setVal('quoteSourceInput', state.quoteSource);
  setVal('stripInput', state.stripText);
  setVal('intensity', state.strength);
  setVal('contrast', state.contrast);
  setVal('saturation', state.saturation);
  setVal('grainAmount', state.grainAmount);
  setCheck('grainToggle', state.grain);
  setCheck('vignetteToggle', state.vignette);
  setCheck('halftoneToggle', state.halftone);
  setCheck('wantedToggle', state.wantedStars > 0);
  setCheck('tagsToggle', state.roleTags);
  setCheck('placesToggle', state.locationLabels);
  setCheck('heatToggle', state.heatBadge);
  setCheck('sealToggle', state.hotSeal);
  setCheck('quoteToggle', state.quote);
  setCheck('stripToggle', state.bottomStrip);
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
  const hint = $('layoutHint');
  if (hint) hint.textContent = (LAYOUTS[state.layout] || {}).hint || '';
  const starSel = $('starCount');
  if (starSel) starSel.value = String(state.wantedStars); // r9 default 0 — the big pill is off unless a shot URL asks for it
  updateSliderLabels();
}

function updateSliderLabels() {
  const set = (id, text) => { const el = $(id); if (el) el.textContent = text; };
  set('intensityVal', `${Math.round(state.strength * 100)}%`);
  set('contrastVal', `${state.contrast.toFixed(2)}×`);
  set('saturationVal', `${state.saturation.toFixed(2)}×`);
  set('grainVal', `${Math.round(state.grainAmount * 100)}%`);
}

/** Build the sample thumbnail strip under the preview. */
function buildSampleStrip() {
  const strip = $('sampleStrip');
  if (!strip) return;
  strip.innerHTML = '';
  for (const key of SAMPLE_ORDER) {
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
    strip.appendChild(btn);
  }
}

/** Boot the editor: wire every control, then paint. */
export async function bootEditor(params) {
  if (params) applyParams(params);
  resizePanels();
  buildSampleStrip();

  const on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); };
  const mark = (attr, value) => {
    document.querySelectorAll(`[data-${attr}]`).forEach((b) => {
      b.classList.toggle('active', b.dataset[attr] === value);
    });
  };

  // Photos
  on('photoInput', 'change', (e) => { addFiles(e.target.files); e.target.value = ''; });
  on('sampleBtn', 'click', trySample);
  on('fillAllBtn', 'click', fillAllFromSelected);
  on('replaceBtn', 'click', () => $('replaceInput')?.click());
  on('replaceInput', 'change', (e) => { replaceSelected(e.target.files[0]); e.target.value = ''; });
  on('clearPanelBtn', 'click', clearSelected);

  // Layout / grade / size / colour / style / position
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

  // Caption + callouts
  on('captionInput', 'input', (e) => { state.caption = e.target.value.slice(0, 40); paint(); });
  on('captionInput', 'change', pushHistory);
  on('subInput', 'input', (e) => { state.subcaption = e.target.value.slice(0, 60); paint(); });
  on('subInput', 'change', pushHistory);
  on('quoteInput', 'input', (e) => { state.quoteText = e.target.value.slice(0, 80); paint(); });
  on('quoteInput', 'change', pushHistory);
  on('quoteSourceInput', 'input', (e) => { state.quoteSource = e.target.value.slice(0, 40); paint(); });
  on('stripInput', 'input', (e) => { state.stripText = e.target.value.slice(0, 80); paint(); });
  on('stripInput', 'change', pushHistory);

  // Grade sliders
  const slider = (id, field) => on(id, 'input', (e) => {
    state[field] = Number(e.target.value);
    updateSliderLabels();
    paint();
  });
  slider('intensity', 'strength');
  slider('contrast', 'contrast');
  slider('saturation', 'saturation');
  slider('grainAmount', 'grainAmount');
  on('intensity', 'change', pushHistory);
  on('contrast', 'change', pushHistory);
  on('saturation', 'change', pushHistory);
  on('grainAmount', 'change', pushHistory);

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
  toggle('placesToggle', 'locationLabels');
  toggle('heatToggle', 'heatBadge');
  toggle('sealToggle', 'hotSeal');
  toggle('quoteToggle', 'quote');
  toggle('stripToggle', 'bottomStrip');
  on('wantedToggle', 'change', (e) => {
    pushHistory();
    state.wantedStars = e.target.checked ? 5 : 0;
    const sel = $('starCount');
    if (sel) sel.value = String(state.wantedStars);
    paint();
  });
  on('starCount', 'change', (e) => {
    pushHistory();
    state.wantedStars = Number(e.target.value) || 0;
    const t = $('wantedToggle');
    if (t) t.checked = state.wantedStars > 0;
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

  // Panel tools
  on('zoom', 'input', (e) => {
    const slot = state.panels[selectedPanel];
    if (!slot) return;
    slot.zoom = Number(e.target.value);
    paint();
  });
  on('zoom', 'change', pushHistory);
  on('fitBtn', 'click', () => {
    const slot = state.panels[selectedPanel];
    if (!slot) return;
    pushHistory();
    slot.fit = slot.fit === 'fit' ? 'cover' : 'fit';
    $('fitBtn').textContent = slot.fit === 'fit' ? 'Fit: whole photo' : 'Fit: fill panel';
    paint();
  });
  document.querySelectorAll('.panel-dot').forEach((dot, i) => dot.addEventListener('click', () => {
    selectedPanel = i;
    const slot = state.panels[selectedPanel];
    const z = $('zoom');
    if (z) z.value = slot ? slot.zoom : 1;
    paint();
  }));

  // Export
  on('exportBtn', 'click', exportPng);

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
