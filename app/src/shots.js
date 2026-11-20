// VICE PURSUIT — deterministic screenshot states (rebuild r9, six-panel edition).
//
// ?shot=cover   the cover alone, full-bleed: the app renders the PNG it
//               would export at full resolution, shows that PNG, and sets
//               window.__shotReady once it is on screen.
// ?shot=editor  the editor with the built-in sample photographs loaded.
// Both accept &layout= &grade= &size= &caption= &subcaption= &color= &pos=
// &style= &stars=0..5 &strength= &contrast= &saturation= and
// &panels=<comma list of scene keys> (panel 1 = the hero/lead photo)
// and &photo=<key> for the old single-photo form. Without ?shot= the plain
// editor boots. Each shot leads with a DIFFERENT scene — the panels param
// is what keeps the screenshots from recycling the same photo.
//
// r9: the magazine grid is SIX panels now (hero + five stacked right), so
// the default panel order lists six scenes: the sunny chase hero, the neon
// driver, the rainy fixer, the misty pier, the desert-canyon getaway and
// the Everglades smuggler. The big wanted-stars pill defaults to OFF —
// the main cover shot omits &stars= entirely; only the portrait/square
// variants still pass &stars=5, keeping their pills exactly as before.

import { SIZES, renderCover, loadImage, fontsReady } from './cover.js';
import { bootEditor, applyParams, loadSamples, state, SAMPLES } from './main.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

/** Panel order for this shot: &panels=chase,neon,beach,rain picks the
 *  photo for each panel in order (panel 1 = the hero/lead photo). */
function panelOrder() {
  const panels = (params.get('panels') || '')
    .split(',').map((s) => s.trim()).filter((k) => SAMPLES[k]);
  if (panels.length) return panels;
  const single = params.get('photo');
  if (single && SAMPLES[single]) return [single];
  return ['chase', 'neon', 'rain', 'pier', 'canyon', 'everglades'];
}

/** Load the panel photos for this shot, in panel order. */
async function samplePhotos() {
  const order = panelOrder();
  return Promise.all(order.map((k) => loadImage(SAMPLES[k].file)));
}

/** Per-panel focus offsets for the cover shots: the hero crop sits a touch
 *  high so the chase cars, not the sky, fill the big panel; the strip
 *  panels get their own small shifts. The two new r9 panels are wide,
 *  short strips, so their crops pull DOWN hard to keep the hero in frame:
 *  the canyon's orange muscle car sits low-right in its photo, and the
 *  Everglades airboat + heron sit low in theirs — a centre crop would cut
 *  both clean off. */
const SHOT_CROPS = [
  { ox: 0, oy: -0.06 }, { ox: 0.08, oy: -0.04 },
  { ox: 0, oy: 0.08 }, { ox: -0.04, oy: -0.08 },
  { ox: 0, oy: -0.50 }, { ox: 0, oy: -0.28 },
];

/** Cover-only mode: render the real export PNG and show it full-bleed. */
async function coverShot() {
  document.getElementById('app').hidden = true;
  const coverView = document.getElementById('coverShot');
  coverView.hidden = false;
  applyParams(params);
  const photos = await samplePhotos();
  const order = panelOrder();
  const n = state.panels.length;
  for (let i = 0; i < n; i++) {
    const img = photos[i % photos.length];
    const key = order[i % photos.length];
    const crop = SHOT_CROPS[i % SHOT_CROPS.length];
    state.panels[i] = { img, name: key, zoom: 1, ox: crop.ox, oy: crop.oy, fit: 'cover' };
  }
  await fontsReady();
  const size = SIZES[state.size] || SIZES.landscape;
  const canvas = renderCover(state, state.size);
  const img = document.getElementById('coverImg');
  img.width = size.w;
  img.height = size.h;
  img.src = canvas.toDataURL('image/png');
  await new Promise((resolve) => {
    if (img.complete) resolve();
    else img.onload = resolve;
  });
  window.__shotReady = true;
}

/** Editor mode: boot the editor, load the samples in this shot's panel
 *  order (so the editor shot leads with a different scene than the cover),
 *  then signal ready. */
async function editorShot() {
  await bootEditor(params);
  const order = panelOrder();
  await loadSamples(order);
  // Let the preview paint once before the screenshot is taken.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}

if (shot === 'cover') {
  coverShot().catch((err) => {
    console.error(err);
    window.__shotReady = true;
  });
} else if (shot === 'editor') {
  editorShot().catch((err) => {
    console.error(err);
    window.__shotReady = true;
  });
} else {
  bootEditor(params);
}
