// SUNREEL editor: wires the three-column studio to the cover renderer.
// State is one plain object; every control mutates it and calls render().
// Photos come from the bundled samples or from the user's own files, read
// locally with FileReader and never uploaded anywhere.

import { VARIANTS, GRADES, LAYOUTS, SIZES, SAMPLE_DIR, variantById, gradeById, readQuery, freshPanels } from './shots.js';
import { drawCover, panelRects } from './cover.js';

const query = readQuery(window.location.search);
const canvas = document.getElementById('coverCanvas');
const ctx = canvas.getContext('2d');
const images = {};
const userPhotos = [];

const state = {
  variant: query.variant,
  grade: query.grade || variantById(query.variant).grade,
  layout: variantById(query.variant).layout,
  size: query.size in SIZES ? query.size : 'landscape',
  title: query.caption || variantById(query.variant).title,
  script: query.subcaption || variantById(query.variant).script,
  tagline: variantById(query.variant).tagline,
  quote: variantById(query.variant).quote,
  quoteSource: variantById(query.variant).quoteSource,
  panels: freshPanels(variantById(query.variant), query.panels),
  selected: 0,
  strength: query.strength,
  sliders: { paint: 63, grade: 80, halftone: 20, grain: 50, glow: 50 },
  toggles: {
    tags: true, heat: true, seal: true, quote: true,
    comingSoon: true, vignette: true, filmGrain: true, halftoneDots: false,
  },
};

const history = [];
let historyIndex = -1;

function snapshot() {
  return JSON.stringify({
    variant: state.variant, grade: state.grade, layout: state.layout,
    title: state.title, script: state.script, tagline: state.tagline,
    quote: state.quote, quoteSource: state.quoteSource,
    panels: state.panels, sliders: state.sliders, toggles: state.toggles,
  });
}

function pushHistory() {
  history.length = historyIndex + 1;
  history.push(snapshot());
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  syncUndoButtons();
}

function applySnapshot(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  syncAllControls();
  render();
}

function undo() {
  if (historyIndex > 0) {
    historyIndex -= 1;
    applySnapshot(history[historyIndex]);
    syncUndoButtons();
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex += 1;
    applySnapshot(history[historyIndex]);
    syncUndoButtons();
  }
}

function syncUndoButtons() {
  const u = document.getElementById('undoBtn');
  const r = document.getElementById('redoBtn');
  if (u) u.disabled = historyIndex <= 0;
  if (r) r.disabled = historyIndex >= history.length - 1;
}

function loadImage(src) {
  if (images[src]) return Promise.resolve(images[src]);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { images[src] = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function preloadVariant() {
  const files = new Set();
  for (const v of VARIANTS) for (const p of v.panels) files.add(SAMPLE_DIR + p.file);
  for (const u of userPhotos) files.add(u.src);
  await Promise.all([...files].map(loadImage));
}

function currentSize() {
  return SIZES[state.size];
}

function render() {
  const size = currentSize();
  const scale = Math.min(1, 860 / size.w);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), size.w, size.h, state, images);
  ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  const info = document.getElementById('panelInfo');
  const p = state.panels[state.selected];
  if (info && p) {
    info.textContent = `Panel ${state.selected + 1} of ${state.panels.length} — ${p.label} (zoom ${p.zoom.toFixed(2)}×)`;
  }
  const ready = document.getElementById('readyLine');
  if (ready) ready.textContent = `Ready — export at ${size.label}.`;
}

// ---- photo tray -------------------------------------------------------

function photoEntries() {
  const v = variantById(state.variant);
  const samples = v.panels.map((p) => ({ src: SAMPLE_DIR + p.file, name: p.file.replace('.jpg', ''), label: p.label, sample: true }));
  return [...samples, ...userPhotos];
}

function renderTray() {
  const tray = document.getElementById('photoTray');
  if (!tray) return;
  tray.innerHTML = '';
  for (const entry of photoEntries()) {
    const cell = document.createElement('button');
    cell.className = 'tray-cell';
    cell.type = 'button';
    const img = document.createElement('img');
    img.src = entry.src;
    img.alt = entry.name;
    const cap = document.createElement('span');
    cap.textContent = entry.label || entry.name;
    cell.append(img, cap);
    cell.addEventListener('click', () => {
      placePhoto(entry.src, entry.label);
    });
    tray.appendChild(cell);
  }
  const count = document.getElementById('trayCount');
  if (count) count.textContent = `Show all ${photoEntries().length} photos`;
}

function placePhoto(src, label) {
  const p = state.panels[state.selected];
  if (!p) return;
  p.file = src.replace(SAMPLE_DIR, '');
  if (src.startsWith('data:')) {
    p.file = src;
    p.custom = true;
  }
  p.zoom = 1;
  p.ox = 0;
  p.oy = 0;
  if (label) p.label = label;
  pushHistory();
  render();
}

function addUserFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  let done = 0;
  for (const f of list) {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result;
      images[src] = null;
      const img = new Image();
      img.onload = () => {
        images[src] = img;
        userPhotos.push({ src, name: f.name.replace(/\.[^.]+$/, ''), label: 'YOUR PHOTO', sample: false });
        done += 1;
        if (done === list.length) {
          renderTray();
          placePhoto(userPhotos[userPhotos.length - 1].src, 'YOUR PHOTO');
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(f);
  }
}

// ---- variant / layout / grade ----------------------------------------

function applyVariant(id) {
  const v = variantById(id);
  state.variant = v.id;
  state.layout = v.layout;
  state.grade = v.grade;
  state.title = v.title;
  state.script = v.script;
  state.tagline = v.tagline;
  state.quote = v.quote;
  state.quoteSource = v.quoteSource;
  state.panels = freshPanels(v, []);
  state.selected = 0;
  pushHistory();
  syncAllControls();
  renderTray();
  render();
}

function buildButtons(containerId, items, activeId, onPick) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick-btn' + (item.id === activeId ? ' active' : '');
    b.textContent = item.name;
    b.title = item.desc || item.name;
    b.addEventListener('click', () => onPick(item.id));
    box.appendChild(b);
  }
}

function syncPickButtons() {
  buildButtons('variantBtns', VARIANTS.map((v) => ({ id: v.id, name: v.name })), state.variant, applyVariant);
  buildButtons('layoutBtns', Object.values(LAYOUTS).map((l) => ({ id: l.id, name: l.name, desc: l.desc })), state.layout, (id) => {
    state.layout = id;
    pushHistory();
    syncPickButtons();
    render();
  });
  buildButtons('gradeBtns', Object.values(GRADES).map((g) => ({ id: g.id, name: g.name })), state.grade, (id) => {
    state.grade = id;
    pushHistory();
    syncPickButtons();
    render();
  });
  buildButtons('sizeBtns', Object.values(SIZES).map((s) => ({ id: s.id, name: s.label })), state.size, (id) => {
    state.size = id;
    syncPickButtons();
    render();
  });
}

// ---- panel controls ----------------------------------------------------

function panelButtons() {
  const box = document.getElementById('panelDots');
  if (!box) return;
  box.innerHTML = '';
  state.panels.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'panel-dot' + (i === state.selected ? ' active' : '');
    b.textContent = String(i + 1);
    b.addEventListener('click', () => {
      state.selected = i;
      panelButtons();
      syncPanelControls();
      render();
    });
    box.appendChild(b);
  });
}

function syncPanelControls() {
  const p = state.panels[state.selected];
  const zoom = document.getElementById('zoomSlider');
  if (zoom && p) zoom.value = String(Math.round(p.zoom * 100));
  const tag = document.getElementById('nameTagChk');
  if (tag) tag.checked = state.toggles.tags;
}

function allPanelRects() {
  const size = currentSize();
  const gap = Math.max(3, size.w * 0.004);
  const bandH = Math.round(size.h * 0.21);
  const quoteH = state.toggles.quote === false ? 0 : Math.round(size.h * 0.055);
  const photoH = size.h - bandH - quoteH;
  const isDiag = state.layout === 'diagonal';
  const topH = isDiag ? photoH : Math.round(photoH * 0.56);
  return panelRects(state.layout, { x: 0, y: 0, w: size.w, h: topH }, { x: 0, y: topH, w: size.w, h: photoH - topH }, gap, state.panels.length);
}

function selectedPanelRect() {
  return allPanelRects()[state.selected];
}

function canvasPos(evt) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - r.left) * (canvas.width / r.width),
    y: (evt.clientY - r.top) * (canvas.height / r.height),
  };
}

// ---- export ------------------------------------------------------------

function exportPNG(sizeId) {
  const size = SIZES[sizeId];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), size.w, size.h, { ...state, size: sizeId }, images);
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunreel-${state.variant}-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

// ---- controls sync ------------------------------------------------------

function syncAllControls() {
  syncPickButtons();
  panelButtons();
  syncPanelControls();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  set('titleInput', state.title);
  set('scriptInput', state.script);
  set('taglineInput', state.tagline);
  set('quoteInput', state.quote);
  for (const [key, val] of Object.entries(state.sliders)) {
    const el = document.getElementById('slider-' + key);
    if (el) el.value = String(val);
    const lab = document.getElementById('slider-' + key + '-val');
    if (lab) lab.textContent = String(val);
  }
  for (const [key, val] of Object.entries(state.toggles)) {
    const el = document.getElementById('toggle-' + key);
    if (el) el.checked = !!val;
  }
}

function bindControls() {
  const bind = (id, fn, evt = 'input') => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, fn);
  };
  bind('titleInput', (e) => { state.title = e.target.value.toUpperCase(); render(); }, 'input');
  bind('scriptInput', (e) => { state.script = e.target.value; render(); });
  bind('taglineInput', (e) => { state.tagline = e.target.value.toUpperCase(); render(); });
  bind('quoteInput', (e) => { state.quote = e.target.value; render(); });
  bind('titleInput', () => pushHistory(), 'change');
  bind('scriptInput', () => pushHistory(), 'change');

  for (const key of Object.keys(state.sliders)) {
    bind('slider-' + key, (e) => {
      state.sliders[key] = Number(e.target.value);
      const lab = document.getElementById('slider-' + key + '-val');
      if (lab) lab.textContent = e.target.value;
      render();
    });
  }
  for (const key of Object.keys(state.toggles)) {
    bind('toggle-' + key, (e) => {
      state.toggles[key] = e.target.checked;
      pushHistory();
      render();
    }, 'change');
  }

  bind('zoomSlider', (e) => {
    const p = state.panels[state.selected];
    if (p) { p.zoom = Number(e.target.value) / 100; render(); }
  });
  bind('zoomSlider', () => pushHistory(), 'change');

  const act = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
  act('flipBtn', () => { const p = state.panels[state.selected]; if (p) { p.flip = !p.flip; pushHistory(); render(); } });
  act('swapBtn', () => {
    const n = state.panels.length;
    const a = state.selected;
    const b = (a + 1) % n;
    [state.panels[a], state.panels[b]] = [state.panels[b], state.panels[a]];
    state.selected = b;
    pushHistory();
    panelButtons();
    render();
  });
  act('resetPanelBtn', () => {
    const p = state.panels[state.selected];
    if (p) { p.zoom = 1; p.ox = 0; p.oy = 0; p.flip = false; pushHistory(); syncPanelControls(); render(); }
  });
  act('faceBtn', () => {
    const p = state.panels[state.selected];
    if (p) { p.zoom = 1; p.ox = 0; p.oy = -0.15; pushHistory(); render(); }
  });
  act('replaceBtn', () => { const f = document.getElementById('fileInput'); if (f) f.click(); });
  act('clearPanelBtn', () => {
    const p = state.panels[state.selected];
    if (p) { p.file = ''; pushHistory(); render(); }
  });
  act('nameTagChk', (e) => { state.toggles.tags = e.target.checked; render(); }, 'change');
  act('undoBtn', undo);
  act('redoBtn', redo);
  act('autoLayoutBtn', () => {
    const layouts = Object.keys(LAYOUTS);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    pushHistory();
    syncPickButtons();
    render();
  });
  act('surpriseBtn', () => {
    const v = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
    applyVariant(v.id);
  });
  act('sampleBtn', () => applyVariant('vice'));
  act('onePhotoBtn', () => {
    const first = state.panels[0] ? state.panels[0].file : '';
    for (const p of state.panels) p.file = first;
    pushHistory();
    render();
  });
  act('exportAllBtn', () => { exportPNG('square'); exportPNG('portrait'); exportPNG('landscape'); });
  act('exportCurrentBtn', () => exportPNG(state.size));
  for (const sizeId of Object.keys(SIZES)) {
    act('export-' + sizeId, () => exportPNG(sizeId));
  }

  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.addEventListener('change', (e) => { addUserFiles(e.target.files); e.target.value = ''; });
  const drop = document.getElementById('dropZone');
  if (drop) {
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('drag');
      addUserFiles(e.dataTransfer.files);
    });
    drop.addEventListener('click', () => { if (fileInput) fileInput.click(); });
  }
  document.addEventListener('paste', (e) => {
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
    if (files.length) addUserFiles(files);
  });

  let dragging = false;
  let last = null;
  canvas.addEventListener('pointerdown', (e) => {
    const pos = canvasPos(e);
    const size = currentSize();
    const scale = canvas.width / size.w;
    const rects = allPanelRects();
    const px = pos.x / scale;
    const py = pos.y / scale;
    const idx = rects.findIndex((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
    if (idx >= 0) {
      state.selected = idx;
      panelButtons();
      syncPanelControls();
      render();
    }
    dragging = true;
    last = pos;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging || !last) return;
    const pos = canvasPos(e);
    const p = state.panels[state.selected];
    if (p) {
      p.ox += (pos.x - last.x) / canvas.width * 2;
      p.oy += (pos.y - last.y) / canvas.height * 2;
      render();
    }
    last = pos;
  });
  canvas.addEventListener('pointerup', () => { if (dragging) pushHistory(); dragging = false; last = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[state.selected];
    if (!p) return;
    p.zoom = Math.max(0.5, Math.min(3, p.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
    syncPanelControls();
    render();
  }, { passive: false });
  canvas.addEventListener('dblclick', () => {
    const p = state.panels[state.selected];
    if (p) { p.zoom = 1; p.ox = 0; p.oy = 0; pushHistory(); syncPanelControls(); render(); }
  });
}

// ---- boot ---------------------------------------------------------------

async function boot() {
  if (query.shot === 'cover') {
    document.body.classList.add('cover-only');
    const v = variantById(query.variant);
    state.variant = v.id;
    state.layout = v.layout;
    state.grade = query.grade || v.grade;
    state.title = query.caption || v.title;
    state.script = query.subcaption || v.script;
    state.tagline = v.tagline;
    state.quote = v.quote;
    state.quoteSource = v.quoteSource;
    state.panels = freshPanels(v, query.panels);
    await preloadVariant();
    try {
      await Promise.all([
        document.fonts.load('40px "Anton"'),
        document.fonts.load('40px "Archivo Black"'),
        document.fonts.load('40px "Bebas Neue"'),
      ]);
    } catch { /* fonts fall back to system sans */ }
    await document.fonts.ready;
    const size = currentSize();
    canvas.width = size.w;
    canvas.height = size.h;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.objectFit = 'contain';
    drawCover(ctx, size.w, size.h, state, images);
    return;
  }
  bindControls();
  syncAllControls();
  await preloadVariant();
  try {
    await Promise.all([
      document.fonts.load('40px "Anton"'),
      document.fonts.load('40px "Archivo Black"'),
      document.fonts.load('40px "Bebas Neue"'),
    ]);
  } catch { /* fonts fall back to system sans */ }
  pushHistory();
  renderTray();
  render();
}

boot();
