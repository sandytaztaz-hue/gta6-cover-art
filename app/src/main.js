// Sunset Cover Studio — wires the editor: photos, layouts, caption, grades, sizes, export.
// The preview canvas and the exported PNG share one draw routine (./cover.js), so what you
// see is exactly what the PNG holds. `?shot=` sets up a fixed scene for a screenshot (./shots.js).
import { drawCover, panelAt, panelCount, LAYOUTS, SIZES, GRADES, CAPTION_COLORS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

// One entry per panel (the layouts use at most 4): the photo plus its own crop.
function blankPanels() {
  return Array.from({ length: 4 }, () => ({ img: null, zoom: 1, ox: 0, oy: 0, fit: 'cover' }));
}

const state = {
  layout: 'diagonal',
  grade: 'sunset',
  sizeKey: 'landscape',
  caption: 'SUNSET HEIST',
  sub: 'VICE CITY • 2026',
  color: 'white',
  pos: 'bottom',
  intensity: 70,
  grain: true,
  vignette: true,
  fill: 'one',
  panels: blankPanels(),
  active: 0,
};

function size() {
  return SIZES[state.sizeKey];
}

function redraw() {
  const { w, h } = size();
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  drawCover(ctx, state, w, h);
  const count = panelCount(state.layout);
  document.getElementById('panel-count').textContent = `${count} panels`;
  document.getElementById('active-panel').textContent = `Panel ${state.active + 1} of ${count}`;
  const active = state.panels[state.active];
  document.getElementById('zoom').value = active.zoom;
  document.getElementById('zoom-val').textContent = `${Math.round(active.zoom * 100)}%`;
  document.getElementById('fit').value = active.fit;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function loadIntoPanel(img, index) {
  state.panels[index] = { ...state.panels[index], img };
  state.active = index;
  redraw();
}

// Files dropped on a panel go to that panel; files picked in the file input fill the panels
// in order (or all panels with the first photo when "one photo" fill is on).
async function addFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  for (let i = 0; i < list.length && i < 4; i++) {
    const img = await loadImage(URL.createObjectURL(list[i]));
    loadIntoPanel(img, i);
  }
  // With "one photo" fill the first photo already fills every panel with its own crop.
  statusEl.textContent = `${list.length} photo${list.length > 1 ? 's' : ''} added — drag a panel to reposition it.`;
}

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  loadIntoPanel(img, 0);
  statusEl.textContent = `Sample "${name}" loaded — try another layout or grade.`;
}

// A row of buttons that picks one value: keeps the pressed button marked.
function wireChoice(id, values, get, set) {
  const group = document.getElementById(id);
  for (const btn of group.querySelectorAll('button')) {
    btn.addEventListener('click', () => {
      set(btn.dataset.value);
      for (const b of group.querySelectorAll('button')) {
        b.setAttribute('aria-pressed', String(b === btn));
      }
      redraw();
    });
  }
}

document.getElementById('photos').addEventListener('change', (e) => addFiles(e.target.files));
document.getElementById('sample-boulevard').addEventListener('click', () => loadSample('boulevard'));
document.getElementById('sample-pier').addEventListener('click', () => loadSample('pier'));
document.getElementById('sample-both').addEventListener('click', async () => {
  const a = await loadImage('samples/boulevard.jpg');
  const b = await loadImage('samples/pier.jpg');
  state.panels[0] = { ...state.panels[0], img: a };
  state.panels[1] = { ...state.panels[1], img: b };
  state.panels[2] = { ...state.panels[2], img: a };
  state.panels[3] = { ...state.panels[3], img: b };
  state.fill = 'each';
  document.getElementById('fill-each').setAttribute('aria-pressed', 'true');
  document.getElementById('fill-one').setAttribute('aria-pressed', 'false');
  state.active = 0;
  redraw();
  statusEl.textContent = 'Two samples loaded across the panels.';
});

wireChoice('layouts', Object.keys(LAYOUTS), () => state.layout, (v) => { state.layout = v; state.active = 0; });
wireChoice('grades', Object.keys(GRADES), () => state.grade, (v) => { state.grade = v; });
wireChoice('sizes', Object.keys(SIZES), () => state.sizeKey, (v) => { state.sizeKey = v; });
wireChoice('colors', Object.keys(CAPTION_COLORS), () => state.color, (v) => { state.color = v; });

document.getElementById('fill-one').addEventListener('click', () => {
  state.fill = 'one';
  document.getElementById('fill-one').setAttribute('aria-pressed', 'true');
  document.getElementById('fill-each').setAttribute('aria-pressed', 'false');
  redraw();
});
document.getElementById('fill-each').addEventListener('click', () => {
  state.fill = 'each';
  document.getElementById('fill-each').setAttribute('aria-pressed', 'true');
  document.getElementById('fill-one').setAttribute('aria-pressed', 'false');
  redraw();
});

const captionInput = document.getElementById('caption');
const subInput = document.getElementById('sub');
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subInput.addEventListener('input', () => { state.sub = subInput.value; redraw(); });
document.getElementById('pos').addEventListener('change', (e) => { state.pos = e.target.value; redraw(); });
document.getElementById('intensity').addEventListener('input', (e) => {
  state.intensity = Number(e.target.value);
  document.getElementById('intensity-val').textContent = `${state.intensity}%`;
  redraw();
});
document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
document.getElementById('vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; redraw(); });
document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[state.active].zoom = Number(e.target.value);
  redraw();
});
document.getElementById('fit').addEventListener('change', (e) => {
  state.panels[state.active].fit = e.target.value;
  redraw();
});

// Drag on the preview to reposition the photo in the panel under the pointer.
let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const fx = (e.clientX - r.left) / r.width;
  const fy = (e.clientY - r.top) / r.height;
  const hit = panelAt(state.layout, fx, fy);
  if (hit < 0) return;
  state.active = hit;
  dragging = { x: e.clientX, y: e.clientY, ox: state.panels[hit].ox, oy: state.panels[hit].oy, w: r.width, h: r.height };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const panel = state.panels[state.active];
  const rectW = canvas.getBoundingClientRect().width;
  const rectH = canvas.getBoundingClientRect().height;
  panel.ox = Math.max(-0.6, Math.min(0.6, dragging.ox + (e.clientX - dragging.x) / rectW));
  panel.oy = Math.max(-0.6, Math.min(0.6, dragging.oy + (e.clientY - dragging.y) / rectH));
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });

document.getElementById('export').addEventListener('click', () => {
  const { w, h } = size();
  redraw();
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunset-cover-${w}x${h}.png`;
    a.click();
    statusEl.textContent = `Saved sunset-cover-${w}x${h}.png at full ${w} x ${h}.`;
  }, 'image/png');
});

// The screenshot scene, or the live editor with a sample already loaded.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, state, { loadImage, redraw, loadSample });
} else {
  loadSample('pier').catch(() => redraw());
  redraw();
}
