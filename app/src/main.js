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

const SAMPLES = ['samples/chase.svg', 'samples/boulevard.jpg', 'samples/pier.jpg'];

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

/** Load the built-in samples into the panels: the drawn chase hero first,
 *  then the two photos, alternating crops. */
export async function loadSamples() {
  try {
    const [chase, a, b] = await Promise.all(SAMPLES.map((s) => loadImage(s)));
    const n = state.panels.length;
    const imgs = [chase, a, b];
    const names = ['chase.svg', 'boulevard.jpg', 'pier.jpg'];
    for (let i = 0; i < n; i++) {
      placePhoto(i, imgs[i % 3], names[i % 3]);
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
