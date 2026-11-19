// Duskline Cover Studio — editor wiring.
//
// Owns the page state, the controls and the live preview. The cover itself is
// painted by cover.js; this file only moves photos, captions and sliders around
// and calls drawCover whenever anything changes.

import {
  SIZES, LAYOUTS, GRADES, CAPTION_COLORS,
  defaultState, layoutPanels, panelAt, drawCover, renderCover,
  loadImage, fontsReady,
} from './cover.js';

// Eight photo-real samples, made with an image model — one distinct scene
// per photo, so no cover ever repeats the same shot: the chase hero first,
// then driver, beach, police chase, the woman by the Lambo, neon night
// street, headlight detail, and desert highway at dusk.
const SAMPLES = [
  'samples/media-generation-chase-0-2ec34be2-e327-42be-a54d-cccb749df467.jpg',
  'samples/media-generation-driver-0-1c1bf90c-d164-4bc3-8d77-0d380142b27d.jpg',
  'samples/media-generation-beach-0-9aa1c1c1-ce91-4ab0-b578-97cf5d9d6b67.jpg',
  'samples/media-generation-media-generation-police-0-0-9a162c3d-8751-4bd9-b694-80e9af009823.jpg',
  'samples/media-generation-media-generation-woman-0-0-77ef31c1-710b-4f24-8e35-b10f48530de1.jpg',
  'samples/media-generation-neon-0-3e780550-f969-4fd0-9588-3129c57b47bf.jpg',
  'samples/media-generation-detail-0-15f66890-fad8-431e-9daa-17cd1d5fcbf8.jpg',
  'samples/media-generation-media-generation-desert-0-0-0a350fe7-a7ce-4223-9abc-c3d5fddbe128.jpg',
];

/** Short keys for the samples, in the same order — used by ?panels= and
 *  ?photo= so a screenshot can pick a different lead photo per shot. */
export const SAMPLE_KEYS = [
  'chase', 'driver', 'beach', 'police', 'woman', 'neon', 'detail', 'desert',
];
const SAMPLE_NAMES = [
  'chase.jpg', 'driver.jpg', 'beach.jpg', 'police.jpg',
  'woman.jpg', 'neon.jpg', 'detail.jpg', 'desert.jpg',
];

const $ = (id) => document.getElementById(id);
const $$ = (sel) => [...document.querySelectorAll(sel)];

export const state = defaultState();
let selected = 0;
let exported = false;
let previewRaf = 0;

/** Resize the state when the layout changes: keep photos, add empty slots. */
function syncPanels() {
  const n = LAYOUTS[state.layout].panels;
  const next = [];
  for (let i = 0; i < n; i++) next.push(state.panels[i] || null);
  state.panels = next;
  if (selected >= n) selected = 0;
}

function hasPhoto() {
  return state.panels.some((p) => p && p.img);
}

/** Paint the preview canvas at devicePixelRatio, crisp on any screen. */
export function renderPreview() {
  const canvas = $('preview');
  if (!canvas) return;
  const stage = canvas.parentElement;
  const rect = stage.getBoundingClientRect();
  const cssW = Math.max(320, Math.floor(rect.width));
  const size = SIZES[state.size];
  const cssH = Math.round((cssW * size.h) / size.w);
  const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  drawCover(canvas.getContext('2d'), state, canvas.width, canvas.height);
}

function scheduleRender() {
  cancelAnimationFrame(previewRaf);
  previewRaf = requestAnimationFrame(renderPreview);
}

/** Keep the 3 steps honest: photo in, caption set, PNG exported. */
function refreshSteps() {
  const s1 = $('step1');
  const s2 = $('step2');
  const s3 = $('step3');
  if (s1) s1.classList.toggle('done', hasPhoto());
  if (s2) s2.classList.toggle('done', (state.caption || '').trim().length > 0);
  if (s3) s3.classList.toggle('done', exported);
  const note = $('exportNote');
  if (note) {
    note.textContent = hasPhoto()
      ? 'Ready — export writes the full-resolution PNG.'
      : 'Add a photo first, or try a sample below.';
  }
}

function refreshPanelBar() {
  const slot = state.panels[selected];
  const label = $('panelLabel');
  if (label) {
    label.textContent = slot && slot.img
      ? `Panel ${selected + 1} — ${slot.name || 'photo'}`
      : `Panel ${selected + 1} — empty`;
  }
  const zoom = $('zoom');
  if (zoom) {
    zoom.value = slot ? slot.zoom : 1;
    zoom.disabled = !slot;
  }
  const fit = $('fitBtn');
  if (fit) {
    fit.disabled = !slot;
    fit.textContent = slot && slot.fit === 'fit' ? 'Fit: whole photo' : 'Fit: fill panel';
  }
  const clear = $('clearPanelBtn');
  if (clear) clear.disabled = !slot;
  $$('.panel-dot').forEach((d, i) => {
    d.style.display = i < state.panels.length ? '' : 'none';
    d.classList.toggle('active', i === selected);
    d.classList.toggle('filled', Boolean(state.panels[i] && state.panels[i].img));
  });
}

/** Put a loaded image into a panel slot (fresh zoom/pan each time). */
function placePhoto(index, img, name, crop) {
  const crops = [
    { ox: 0, oy: 0 },
    { ox: 0.08, oy: -0.04 },
    { ox: 0, oy: 0.08 },
    { ox: -0.04, oy: -0.08 },
    { ox: 0.06, oy: 0.06 },
  ];
  const c = crop || crops[index % crops.length];
  state.panels[index] = {
    img, name: name || 'photo',
    zoom: 1, ox: c.ox, oy: c.oy, fit: 'cover',
  };
}

/** Load the built-in samples into the panels, one distinct photo per panel.
 *  `order` is an optional array of sample keys (e.g. ['beach','woman',...])
 *  that puts a chosen scene in the hero panel first; without it the default
 *  chase-first order is used. */
export async function loadSamples(order) {
  try {
    const idx = (order && order.length
      ? order.map((k) => SAMPLE_KEYS.indexOf(k)).filter((i) => i >= 0)
      : SAMPLE_KEYS.map((_, i) => i));
    // Fill any missing slots with the remaining samples, still distinct.
    for (let i = 0; i < SAMPLE_KEYS.length; i++) if (!idx.includes(i)) idx.push(i);
    const imgs = await Promise.all(idx.map((i) => loadImage(SAMPLES[i])));
    const n = state.panels.length;
    for (let i = 0; i < n; i++) {
      placePhoto(i, imgs[i % imgs.length], SAMPLE_NAMES[idx[i % idx.length]]);
    }
    selected = 0;
    refreshSteps();
    refreshPanelBar();
    scheduleRender();
    return true;
  } catch (err) {
    console.warn('samples failed to load', err);
    return false;
  }
}

/** Fill every panel with the first photo found, each cropped differently. */
function fillAllFromFirst() {
  const first = state.panels.find((p) => p && p.img);
  if (!first) return;
  state.panels.forEach((_, i) => placePhoto(i, first.img, first.name));
  refreshSteps();
  refreshPanelBar();
  scheduleRender();
}

/** Add files: each file lands in the selected panel, then the next empty one. */
async function addFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  let target = selected;
  for (const file of list) {
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      placePhoto(target, img, file.name);
      target = (target + 1) % state.panels.length;
    } catch {
      // A bad file is skipped; the rest still land.
    }
  }
  selected = 0;
  refreshSteps();
  refreshPanelBar();
  scheduleRender();
}

/** Export the full-resolution PNG for the chosen size and download it. */
export async function exportPng() {
  await fontsReady();
  const canvas = renderCover(state, state.size);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `duskline-cover-${state.size}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  exported = true;
  refreshSteps();
  return blob;
}

// ---------------------------------------------------------------- controls

function bindButtons(attr, current, apply) {
  $$(`[data-${attr}]`).forEach((btn) => {
    btn.addEventListener('click', () => {
      apply(btn.dataset[attr]);
      $$(`[data-${attr}]`).forEach((b) => b.classList.toggle('active', b === btn));
      scheduleRender();
    });
    btn.classList.toggle('active', btn.dataset[attr] === current);
  });
}

function bindControls() {
  const input = $('photoInput');
  if (input) {
    input.addEventListener('change', () => {
      addFiles(input.files);
      input.value = '';
    });
  }
  const sampleBtn = $('sampleBtn');
  if (sampleBtn) sampleBtn.addEventListener('click', () => loadSamples());
  const fillBtn = $('fillAllBtn');
  if (fillBtn) fillBtn.addEventListener('click', fillAllFromFirst);

  bindButtons('layout', state.layout, (v) => {
    state.layout = v;
    syncPanels();
    const hint = $('layoutHint');
    if (hint) hint.textContent = `${LAYOUTS[v].panels} panels — ${LAYOUTS[v].hint}.`;
    refreshPanelBar();
    refreshSteps();
  });
  bindButtons('grade', state.grade, (v) => { state.grade = v; });
  bindButtons('size', state.size, (v) => { state.size = v; });
  bindButtons('color', state.captionColor, (v) => { state.captionColor = v; });
  bindButtons('pos', state.captionPosition, (v) => { state.captionPosition = v; });

  const caption = $('captionInput');
  if (caption) {
    caption.value = state.caption;
    caption.addEventListener('input', () => {
      state.caption = caption.value;
      refreshSteps();
      scheduleRender();
    });
  }
  const sub = $('subInput');
  if (sub) {
    sub.value = state.subcaption;
    sub.addEventListener('input', () => {
      state.subcaption = sub.value;
      scheduleRender();
    });
  }
  const intensity = $('intensity');
  if (intensity) {
    intensity.value = state.intensity;
    intensity.addEventListener('input', () => {
      state.intensity = Number(intensity.value);
      scheduleRender();
    });
  }
  const grain = $('grainToggle');
  if (grain) {
    grain.checked = state.grain;
    grain.addEventListener('change', () => {
      state.grain = grain.checked;
      scheduleRender();
    });
  }
  const grainAmount = $('grainAmount');
  if (grainAmount) {
    grainAmount.value = state.grainAmount;
    grainAmount.addEventListener('input', () => {
      state.grainAmount = Number(grainAmount.value);
      scheduleRender();
    });
  }
  const vignette = $('vignetteToggle');
  if (vignette) {
    vignette.checked = state.vignette;
    vignette.addEventListener('change', () => {
      state.vignette = vignette.checked;
      scheduleRender();
    });
  }
  const wanted = $('wantedToggle');
  if (wanted) {
    wanted.checked = state.wantedStars > 0;
    wanted.addEventListener('change', () => {
      state.wantedStars = wanted.checked ? 5 : 0;
      scheduleRender();
    });
  }
  const zoom = $('zoom');
  if (zoom) {
    zoom.addEventListener('input', () => {
      const slot = state.panels[selected];
      if (slot) {
        slot.zoom = Number(zoom.value);
        scheduleRender();
      }
    });
  }
  const fitBtn = $('fitBtn');
  if (fitBtn) {
    fitBtn.addEventListener('click', () => {
      const slot = state.panels[selected];
      if (!slot) return;
      slot.fit = slot.fit === 'fit' ? 'cover' : 'fit';
      refreshPanelBar();
      scheduleRender();
    });
  }
  const clearBtn = $('clearPanelBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.panels[selected] = null;
      refreshSteps();
      refreshPanelBar();
      scheduleRender();
    });
  }
  const exportBtn = $('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', () => exportPng());

  // Panel dots under the preview: click to pick a panel.
  $$('.panel-dot').forEach((d, i) => {
    d.addEventListener('click', () => {
      selected = i;
      refreshPanelBar();
      scheduleRender();
    });
  });

  // Click a panel in the preview to select it; drag to pan its photo.
  const canvas = $('preview');
  if (canvas) {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let moved = false;
    const toCover = (e) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * canvas.width,
        y: ((e.clientY - r.top) / r.height) * canvas.height,
      };
    };
    canvas.addEventListener('pointerdown', (e) => {
      const p = toCover(e);
      const hit = panelAt(state.layout, canvas.width, canvas.height, p.x, p.y);
      if (hit >= 0) {
        selected = hit;
        refreshPanelBar();
      }
      dragging = true;
      moved = false;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const slot = state.panels[selected];
      if (!slot) return;
      const r = canvas.getBoundingClientRect();
      const panels = layoutPanels(state.layout, canvas.width, canvas.height);
      const panel = panels[selected];
      const dx = ((e.clientX - lastX) / r.width) * canvas.width;
      const dy = ((e.clientY - lastY) / r.height) * canvas.height;
      if (Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY) > 2) moved = true;
      slot.ox = Math.max(-0.5, Math.min(0.5, slot.ox + dx / panel.w));
      slot.oy = Math.max(-0.5, Math.min(0.5, slot.oy + dy / panel.h));
      lastX = e.clientX;
      lastY = e.clientY;
      if (moved) scheduleRender();
    });
    const stop = () => { dragging = false; };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);

    // Drop files straight onto the panel under the cursor.
    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const p = toCover(e);
      const hit = panelAt(state.layout, canvas.width, canvas.height, p.x, p.y);
      if (hit >= 0) selected = hit;
      addFiles(e.dataTransfer.files);
    });
  }

  window.addEventListener('resize', scheduleRender);
}

/** Apply ?shot= style params (layout, grade, size, caption) onto the state. */
export function applyParams(params) {
  if (params.get('layout') && LAYOUTS[params.get('layout')]) {
    state.layout = params.get('layout');
  }
  if (params.get('grade') && GRADES[params.get('grade')]) {
    state.grade = params.get('grade');
  }
  if (params.get('size') && SIZES[params.get('size')]) {
    state.size = params.get('size');
  }
  if (params.get('caption')) state.caption = params.get('caption');
  if (params.get('subcaption')) state.subcaption = params.get('subcaption');
  if (params.get('color') && CAPTION_COLORS[params.get('color')]) {
    state.captionColor = params.get('color');
  }
  if (params.get('pos') === 'top' || params.get('pos') === 'bottom') {
    state.captionPosition = params.get('pos');
  }
  // Wanted stars: &stars=0..5 (5 = full five-star chase). The police-chase
  // shot passes 5; other shots leave it at 0.
  const stars = Number(params.get('stars'));
  if (Number.isFinite(stars)) {
    state.wantedStars = Math.max(0, Math.min(5, Math.round(stars)));
  }
  syncPanels();
}

/** Start the editor. Called by shots.js after it has read the URL params. */
export async function bootEditor(params) {
  applyParams(params);
  bindControls();
  const hint = $('layoutHint');
  if (hint) hint.textContent = `${LAYOUTS[state.layout].panels} panels — ${LAYOUTS[state.layout].hint}.`;
  refreshSteps();
  refreshPanelBar();
  await fontsReady();
  scheduleRender();
  // A handle for the screenshot + verification scripts (not part of the UI).
  window.__dusklineCover = { state, renderPreview, exportPng, loadSamples };
}
