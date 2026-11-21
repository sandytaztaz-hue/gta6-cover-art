// GOLDEN MILE editor: builds the live magazine cover from state, wires
// the studio controls, and exports real PNGs. Photos come from the
// bundled samples or from the user's own files, read locally with
// FileReader and never uploaded anywhere.

import {
  COVER_TITLE,
  COVER_SUBHEAD,
  COVER_RIBBON,
  COVER_TAGLINE,
  COVER_GAZETTE,
  COVER_CREDITS,
  COVER_GRADES,
  COVER_GRADE_IDS,
  COVER_SIZES,
  coverDefaultState,
  coverPanelCrop,
  paintCover,
  exportCoverPng,
} from './cover.js';
import {
  COVER_SAMPLES,
  COVER_GRADE_SWATCH,
  readCoverQuery,
  applyCoverQuery,
} from './shots.js';

const query = readCoverQuery(window.location.search);
const state = applyCoverQuery(coverDefaultState(), query);
let selected = 2; // the hero panel, centre of the cover
const images = {}; // src -> loaded HTMLImageElement
const userPhotos = [];

const $ = (id) => document.getElementById(id);
const coverMount = $('coverMount');
const shotWrap = $('shotWrap');

function loadImage(src) {
  if (images[src]) return Promise.resolve(images[src]);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      images[src] = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function loadAllPanelImages() {
  return Promise.all(state.panels.map((p) => loadImage(p.src)));
}

function hintText() {
  const p = state.panels[selected];
  return `Selected: ${p.role} — ${p.src.split('/').pop()}. Drag the photo to move it, scroll to zoom.`;
}

// Build the DOM cover for the current state. The structure mirrors the
// canvas renderer in cover.js: masthead, five-column grid, title band
// in its own zone, bottom strip, gold seal.
function buildCoverEl() {
  const cover = document.createElement('div');
  cover.className = 'gm-cover';
  cover.dataset.grade = state.grade;
  cover.dataset.size = state.size;

  const mast = document.createElement('header');
  mast.className = 'gm-masthead';
  mast.innerHTML =
    '<span class="stars">★★★★★</span>' +
    `<span class="tag">${COVER_TAGLINE}</span>` +
    `<span class="gazette">${COVER_GAZETTE}</span>` +
    '<span class="vol">VOL. 1</span>';
  cover.appendChild(mast);

  const grid = document.createElement('div');
  grid.className = 'gm-grid';
  state.panels.forEach((panel, i) => {
    const cell = document.createElement('div');
    cell.className =
      'gm-panel' +
      (panel.role === 'HERO' ? ' hero' : '') +
      (panel.role === 'THE BOSS' ? ' boss' : '');
    if (i === selected) cell.classList.add('selected');
    cell.dataset.index = String(i);
    const img = document.createElement('img');
    img.src = panel.src;
    img.alt = panel.role;
    img.draggable = false;
    // Same per-size crop the PNG renderer uses, so the preview and the
    // export always agree (portrait DRIVER is pulled back a touch).
    const crop = coverPanelCrop(panel, state.size);
    img.style.objectPosition = `${crop.fx * 100}% ${crop.fy * 100}%`;
    if (panel.flip) img.style.transform = 'scaleX(-1)';
    if (crop.zoom && crop.zoom !== 1) {
      img.style.width = `${crop.zoom * 100}%`;
      img.style.height = `${crop.zoom * 100}%`;
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
      img.style.left = `${(1 - crop.zoom) * 50}%`;
      img.style.top = `${(1 - crop.zoom) * 50}%`;
    }
    cell.appendChild(img);
    const wash = document.createElement('div');
    wash.className = 'wash';
    cell.appendChild(wash);
    if (panel.role !== 'HERO') {
      const role = document.createElement('span');
      role.className = 'role';
      role.textContent = panel.role;
      cell.appendChild(role);
    }
    cell.addEventListener('pointerdown', (ev) => startDrag(ev, i, cell));
    grid.appendChild(cell);
  });
  cover.appendChild(grid);

  const band = document.createElement('div');
  band.className = 'gm-titleband';
  const title = document.createElement('h1');
  title.className = 'gm-title';
  title.textContent = state.title;
  band.appendChild(title);
  const script = document.createElement('p');
  script.className = 'gm-script';
  script.textContent = state.script;
  band.appendChild(script);
  const ribbon = document.createElement('p');
  ribbon.className = 'gm-ribbon';
  ribbon.textContent = state.ribbon;
  band.appendChild(ribbon);
  cover.appendChild(band);

  const foot = document.createElement('footer');
  foot.className = 'gm-foot';
  foot.innerHTML =
    '<span class="soon">—&nbsp; COMING SOON &nbsp;—</span>' +
    `<span class="credits">${COVER_CREDITS}</span>` +
    '<span class="gm-barcode" aria-hidden="true"></span>';
  cover.appendChild(foot);

  const seal = document.createElement('div');
  seal.className = 'gm-seal';
  seal.innerHTML = '★ BEST ★<br>SELLER';
  cover.appendChild(seal);

  return cover;
}

function render() {
  coverMount.replaceChildren(buildCoverEl());
  if (document.body.classList.contains('shot-cover')) {
    shotWrap.replaceChildren(buildCoverEl());
  }
  const hint = $('panelHint');
  if (hint) hint.textContent = hintText();
  document.querySelectorAll('#gradeList .gm-chip').forEach((chip) => {
    chip.classList.toggle('on', chip.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizeList .gm-chip').forEach((chip) => {
    chip.classList.toggle('on', chip.dataset.size === state.size);
  });
}

// ---- Panel interaction: drag to pan, wheel to zoom ----------------------

function startDrag(ev, index, cell) {
  ev.preventDefault();
  selected = index;
  document.querySelectorAll('.gm-panel').forEach((el, i) => {
    el.classList.toggle('selected', i === index);
  });
  const hint = $('panelHint');
  if (hint) hint.textContent = hintText();
  const panel = state.panels[index];
  const img = cell.querySelector('img');
  const startX = ev.clientX;
  const startY = ev.clientY;
  const startFx = panel.fx;
  const startFy = panel.fy;
  const rect = cell.getBoundingClientRect();
  function move(e2) {
    panel.fx = Math.min(1, Math.max(0, startFx - (e2.clientX - startX) / rect.width));
    panel.fy = Math.min(1, Math.max(0, startFy - (e2.clientY - startY) / rect.height));
    img.style.objectPosition = `${panel.fx * 100}% ${panel.fy * 100}%`;
  }
  function up() {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    render();
  }
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function attachWheel() {
  coverMount.addEventListener(
    'wheel',
    (ev) => {
      const cell = ev.target.closest('.gm-panel');
      if (!cell) return;
      ev.preventDefault();
      const panel = state.panels[Number(cell.dataset.index)];
      panel.zoom = Math.min(2.5, Math.max(1, (panel.zoom || 1) * (ev.deltaY < 0 ? 1.12 : 0.9)));
      render();
    },
    { passive: false },
  );
}

// ---- Controls -----------------------------------------------------------

function buildControls() {
  const gradeList = $('gradeList');
  for (const id of COVER_GRADE_IDS) {
    const grade = COVER_GRADES[id];
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'gm-chip';
    chip.dataset.grade = id;
    chip.innerHTML =
      `<span class="dot" style="background:${COVER_GRADE_SWATCH[id]}"></span>` +
      `<span style="flex:1">${grade.label}</span><small>grade</small>`;
    chip.addEventListener('click', () => {
      state.grade = id;
      render();
    });
    gradeList.appendChild(chip);
  }
  const sizeList = $('sizeList');
  for (const [id, size] of Object.entries(COVER_SIZES)) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'gm-chip';
    chip.dataset.size = id;
    chip.innerHTML = `<span style="flex:1">${size.label}</span><small>export</small>`;
    chip.addEventListener('click', () => {
      state.size = id;
      render();
    });
    sizeList.appendChild(chip);
  }
}

function buildSamples() {
  const strip = $('sampleStrip');
  for (const file of COVER_SAMPLES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gm-sample';
    btn.title = file;
    const img = document.createElement('img');
    img.src = 'samples/' + file;
    img.alt = file;
    img.loading = 'lazy';
    btn.appendChild(img);
    const tag = document.createElement('span');
    tag.textContent = file.replace('.jpg', '');
    btn.appendChild(tag);
    btn.addEventListener('click', async () => {
      const panel = state.panels[selected];
      panel.src = 'samples/' + file;
      await loadImage(panel.src);
      render();
      refreshSampleMarks();
    });
    strip.appendChild(btn);
  }
  refreshSampleMarks();
}

function refreshSampleMarks() {
  const used = new Set(state.panels.map((p) => p.src.split('/').pop()));
  document.querySelectorAll('#sampleStrip .gm-sample').forEach((btn) => {
    btn.classList.toggle('used', used.has(btn.title));
  });
}

function addUserPhoto(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    const src = String(reader.result);
    userPhotos.push(src);
    const panel = state.panels[selected];
    panel.src = src;
    panel.fx = 0.5;
    panel.fy = 0.4;
    panel.zoom = 1;
    images[src] = await loadImage(src);
    render();
  };
  reader.readAsDataURL(file);
}

function wireControls() {
  $('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value.toUpperCase() || COVER_TITLE;
    render();
  });
  $('scriptInput').addEventListener('input', (e) => {
    state.script = e.target.value || COVER_SUBHEAD;
    render();
  });
  $('ribbonInput').addEventListener('input', (e) => {
    state.ribbon = e.target.value.toUpperCase() || COVER_RIBBON;
    render();
  });
  $('flipBtn').addEventListener('click', () => {
    const p = state.panels[selected];
    p.flip = !p.flip;
    render();
  });
  $('faceBtn').addEventListener('click', () => {
    const p = state.panels[selected];
    p.fx = 0.5;
    p.fy = 0.35;
    p.zoom = 1;
    render();
  });
  $('swapBtn').addEventListener('click', () => {
    const next = (selected + 1) % state.panels.length;
    const a = state.panels[selected];
    const b = state.panels[next];
    [a.src, b.src] = [b.src, a.src];
    [a.fx, b.fx] = [b.fx, a.fx];
    [a.fy, b.fy] = [b.fy, a.fy];
    selected = next;
    render();
    refreshSampleMarks();
  });
  $('resetBtn').addEventListener('click', () => {
    const fresh = coverDefaultState().panels[selected];
    state.panels[selected] = { ...fresh };
    render();
    refreshSampleMarks();
  });
  $('addPhotosBtn').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (e) => {
    for (const f of e.target.files) addUserPhoto(f);
    e.target.value = '';
  });
  const drop = $('dropZone');
  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    for (const f of e.dataTransfer.files) addUserPhoto(f);
  });
  window.addEventListener('paste', (e) => {
    for (const item of e.clipboardData?.items || []) {
      if (item.type.startsWith('image/')) addUserPhoto(item.getAsFile());
    }
  });
  const exporters = [
    ['exportSquareBtn', 'square'],
    ['exportPortraitBtn', 'portrait'],
    ['exportWideBtn', 'landscape'],
  ];
  for (const [id, sizeId] of exporters) {
    $(id).addEventListener('click', async () => {
      const btn = $(id);
      btn.disabled = true;
      btn.textContent = 'Rendering…';
      try {
        await loadAllPanelImages();
        const blob = await exportCoverPng(state, images, sizeId);
        const size = COVER_SIZES[sizeId];
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `vice-pursuit-${size.width}x${size.height}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      } finally {
        btn.disabled = false;
        btn.textContent = `⬇ PNG ${COVER_SIZES[sizeId].width} × ${COVER_SIZES[sizeId].height}`;
      }
    });
  }
}

// ---- Boot ---------------------------------------------------------------

async function boot() {
  if (query.shot === 'cover') {
    document.body.classList.add('shot-cover');
    document.title = 'VICE PURSUIT — cover';
  }
  buildControls();
  buildSamples();
  wireControls();
  attachWheel();
  await loadAllPanelImages();
  await document.fonts.ready;
  render();
  // Keep the canvas renderer honest: it must be able to draw the same
  // cover the DOM shows, so warm its image cache too.
  if (query.shot === 'cover') {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    paintCover(canvas.getContext('2d'), state, images, 32, 32);
  }
}

boot();
