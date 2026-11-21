// VICE PURSUIT — editor logic.
// Owns the studio state (photos per panel, the three texts, the grade, the
// post size, the selected panel), wires the three columns of the editor,
// and paints the live cover preview through cover.js.

import { PANEL_DEFS, SAMPLES, GRADES, SIZES, loadImage, paintCover, layoutFor } from './cover.js';
import { shotViewFromQuery, applyShotView } from './shots.js';

const canvas = document.getElementById('coverCanvas');
const sampleGrid = document.getElementById('sampleGrid');
const gradeList = document.getElementById('gradeList');
const sizeList = document.getElementById('sizeList');
const panelPick = document.getElementById('panelPick');
const zoomSlider = document.getElementById('zoomSlider');

const state = {
  panels: {},
  images: {},
  title: 'VICE PURSUIT',
  subhead: 'Coastline Nights',
  ribbon: 'ONE COASTLINE · FIVE STORIES · NO CURFEW',
  grade: 'golden-hour',
  sizeKey: 'square',
  selected: 'hero',
  selectedSample: 'vice-driver',
};

for (const def of PANEL_DEFS) {
  state.panels[def.id] = { src: def.src, fx: def.fx, fy: def.fy, zoom: 1, ox: 0, oy: 0 };
}

const coverView = shotViewFromQuery(location.search);
if (coverView) applyShotView(state, coverView);

function repaint() {
  paintCover(canvas, state, { banner: !coverView || coverView.mode !== 'cover' });
}

function resizePreviewToSize() {
  const size = SIZES[state.sizeKey];
  canvas.width = size.w;
  canvas.height = size.h;
}

function selectPanel(id) {
  if (!state.panels[id]) return;
  state.selected = id;
  const frame = state.panels[id];
  zoomSlider.value = String(Math.round((frame.zoom || 1) * 100));
  for (const chip of panelPick.querySelectorAll('.panel-chip')) {
    chip.classList.toggle('selected', chip.dataset.panel === id);
  }
  repaint();
}

function frameFor(id) {
  return state.panels[id];
}

async function fillSelectedPanel(src, sampleName) {
  const frame = frameFor(state.selected);
  const def = PANEL_DEFS.find((d) => d.id === state.selected);
  const img = await loadImage(src);
  if (!img) return;
  frame.src = src;
  frame.fx = def.fx;
  frame.fy = def.fy;
  frame.zoom = 1;
  frame.ox = 0;
  frame.oy = 0;
  state.images[state.selected] = img;
  if (sampleName) {
    state.selectedSample = sampleName;
    for (const thumb of sampleGrid.querySelectorAll('.sample-thumb')) {
      thumb.classList.toggle('selected', thumb.dataset.sample === sampleName);
    }
  }
  zoomSlider.value = '100';
  repaint();
}

// ---- left column: sample grid + photo intake ----

for (const name of SAMPLES) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sample-thumb' + (name === state.selectedSample ? ' selected' : '');
  button.dataset.sample = name;
  const thumb = document.createElement('img');
  thumb.src = `samples/${name}.jpg`;
  thumb.alt = name;
  thumb.loading = 'lazy';
  const tag = document.createElement('span');
  tag.textContent = name;
  button.append(thumb, tag);
  button.addEventListener('click', () => fillSelectedPanel(`samples/${name}.jpg`, name));
  sampleGrid.append(button);
}

const dropzone = document.getElementById('dropzone');
const photoPicker = document.getElementById('photoPicker');
document.getElementById('addPhotosButton').addEventListener('click', () => photoPicker.click());

function takeFiles(files) {
  const file = files && files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => fillSelectedPanel(String(reader.result), null);
  reader.readAsDataURL(file);
}
photoPicker.addEventListener('change', () => takeFiles(photoPicker.files));
dropzone.addEventListener('dragover', (event) => { event.preventDefault(); dropzone.classList.add('drag-over'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('drag-over');
  takeFiles(event.dataTransfer.files);
});
document.addEventListener('paste', (event) => takeFiles(event.clipboardData && event.clipboardData.files));

// ---- left column: panel picker + zoom ----

for (const def of PANEL_DEFS) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'panel-chip' + (def.id === state.selected ? ' selected' : '');
  chip.dataset.panel = def.id;
  chip.textContent = def.label || 'HERO';
  chip.addEventListener('click', () => selectPanel(def.id));
  panelPick.append(chip);
}
zoomSlider.addEventListener('input', () => {
  frameFor(state.selected).zoom = Number(zoomSlider.value) / 100;
  repaint();
});
document.getElementById('resetPanelButton').addEventListener('click', () => {
  const def = PANEL_DEFS.find((d) => d.id === state.selected);
  const frame = frameFor(state.selected);
  frame.fx = def.fx;
  frame.fy = def.fy;
  frame.zoom = 1;
  frame.ox = 0;
  frame.oy = 0;
  zoomSlider.value = '100';
  repaint();
});

// ---- centre: drag to move, wheel to zoom, click to select ----

let dragging = null;
function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * canvas.width,
    y: ((event.clientY - box.top) / box.height) * canvas.height,
  };
}
function panelAt(point) {
  const L = layoutFor(canvas.width, canvas.height);
  for (const def of PANEL_DEFS) {
    const r = L.panels[def.id];
    if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) return def.id;
  }
  return null;
}
canvas.addEventListener('pointerdown', (event) => {
  const id = panelAt(canvasPoint(event));
  if (!id) return;
  selectPanel(id);
  dragging = { id, x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const frame = frameFor(dragging.id);
  const img = state.images[dragging.id];
  if (!img) return;
  const L = layoutFor(canvas.width, canvas.height);
  const rect = L.panels[dragging.id];
  const box = canvas.getBoundingClientRect();
  const dx = ((event.clientX - dragging.x) / box.width) * canvas.width;
  const dy = ((event.clientY - dragging.y) / box.height) * canvas.height;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * (frame.zoom || 1);
  frame.ox = (frame.ox || 0) - dx / (base * img.naturalWidth);
  frame.oy = (frame.oy || 0) - dy / (base * img.naturalHeight);
  dragging.x = event.clientX;
  dragging.y = event.clientY;
  repaint();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const id = panelAt(canvasPoint(event)) || state.selected;
  selectPanel(id);
  const frame = frameFor(id);
  const next = (frame.zoom || 1) * (event.deltaY < 0 ? 1.12 : 1 / 1.12);
  frame.zoom = Math.max(1, Math.min(2.6, next));
  zoomSlider.value = String(Math.round(frame.zoom * 100));
  repaint();
}, { passive: false });

// ---- right column: caption inputs ----

document.getElementById('titleInput').addEventListener('input', (event) => { state.title = event.target.value; repaint(); });
document.getElementById('subheadInput').addEventListener('input', (event) => { state.subhead = event.target.value; repaint(); });
document.getElementById('ribbonInput').addEventListener('input', (event) => { state.ribbon = event.target.value; repaint(); });

// ---- right column: grades + sizes ----

for (const [key, grade] of Object.entries(GRADES)) {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'grade-row' + (key === state.grade ? ' selected' : '');
  row.dataset.grade = key;
  const dot = document.createElement('span');
  dot.className = 'grade-dot';
  dot.style.background = grade.dot;
  const name = document.createElement('span');
  name.textContent = grade.name;
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = 'grade';
  row.append(dot, name, tag);
  row.addEventListener('click', () => {
    state.grade = key;
    for (const other of gradeList.querySelectorAll('.grade-row')) {
      other.classList.toggle('selected', other.dataset.grade === key);
    }
    repaint();
  });
  gradeList.append(row);
}

for (const [key, size] of Object.entries(SIZES)) {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'size-row' + (key === state.sizeKey ? ' selected' : '');
  row.dataset.size = key;
  const name = document.createElement('span');
  name.textContent = size.label;
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = 'export';
  row.append(name, tag);
  row.addEventListener('click', () => {
    state.sizeKey = key;
    for (const other of sizeList.querySelectorAll('.size-row')) {
      other.classList.toggle('selected', other.dataset.size === key);
    }
    resizePreviewToSize();
    repaint();
  });
  sizeList.append(row);
}

// ---- export ----

function exportCover(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  paintCover(off, state, { banner: false });
  off.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vice-pursuit-${sizeKey}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}
for (const button of document.querySelectorAll('[data-export]')) {
  button.addEventListener('click', () => exportCover(button.dataset.export));
}

// ---- boot: fonts + photos, then paint and signal readiness ----

async function boot() {
  if (coverView && coverView.mode === 'cover') {
    document.body.classList.add('cover-mode');
    canvas.width = coverView.width;
    canvas.height = coverView.height;
  } else {
    resizePreviewToSize();
  }
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('16px "Archivo Black"'),
      document.fonts.load('16px "Bebas Neue"'),
      document.fonts.load('60px "Great Vibes"'),
      document.fonts.ready,
    ]);
  } catch (err) {
    window.__paintError = String(err);
  }
  const loaded = await Promise.all(PANEL_DEFS.map((def) => loadImage(def.src)));
  PANEL_DEFS.forEach((def, i) => { state.images[def.id] = loaded[i]; });
  repaint();
  window.__shotReady = true;
}

boot();
