// VICE PURSUIT — deterministic screenshot states (rebuild r10, four-variant edition).
//
// ?shot=cover   the cover alone, full-bleed: the app renders the PNG it
//               would export at full resolution, shows that PNG, and sets
//               window.__shotReady once it is on screen.
// ?shot=editor  the editor with the built-in sample photographs loaded.
// Both accept &variant=sunset|neon|coast|throttle (the r10 way) or
// &layout= &grade= &size= &caption= &subcaption= &color= &pos=
// &style= &stars=0..5 &strength= &contrast= &saturation= and
// &panels=<comma list of scene keys> (panel 1 = the lead photo)
// and &photo=<key> for the old single-photo form. Without ?shot= the plain
// editor boots. Each shot leads with a DIFFERENT variant — the variant
// param is what keeps the screenshots from recycling the same cover.
//
// r10: four variants, five panels each, so the default panel order lists
// the current variant's five scenes: Sunset Chase leads with the sunny
// chase hero, Neon Nights with the neon strip, Golden Coast with the sunny
// coast, Full Throttle with the modern + classic sunset duo. The big
// wanted-stars pill defaults to OFF on every variant — no shot passes
// &stars= any more; the portrait/square shots keep their own grades and
// sizes but the same VICE PURSUIT title and the same star discipline.

import { SIZES, renderCover, loadImage, fontsReady, VARIANTS } from './cover.js';
import { bootEditor, applyParams, loadSamples, state, SAMPLES, SMART_CROPS } from './main.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

/** Panel order for this shot: &panels=chase,driver-new,rain,canyon,
//  everglades picks the photo for each panel in order (panel 1 = the
//  lead photo). Without it, the current variant's five scenes load. */
function panelOrder() {
  const panels = (params.get('panels') || '')
    .split(',').map((s) => s.trim()).filter((k) => SAMPLES[k]);
  if (panels.length) return panels;
  const single = params.get('photo');
  if (single && SAMPLES[single]) return [single];
  const variant = params.get('variant');
  if (variant && VARIANTS[variant]) return VARIANTS[variant].panels;
  const layout = params.get('layout');
  if (layout && VARIANTS[layout]) return VARIANTS[layout].panels;
  return VARIANTS.sunset.panels;
}

/** Load the panel photos for this shot, in panel order. */
async function samplePhotos() {
  const order = panelOrder();
  return Promise.all(order.map((k) => loadImage(SAMPLES[k].file)));
}

/** Per-panel focus offsets for the cover shots: each scene's own smart
 *  crop (main.js SMART_CROPS). The hero crop sits a touch high so the
 *  chase cars, not the sky, fill the wide panel; the driver crops pull
 *  the window UP so her whole head stays in frame (her photo is a
 *  portrait shot with clear sky above her hair — a centre crop on a
 *  short row panel would cut her forehead clean off); the canyon and
 *  Everglades crops pull DOWN hard to keep their low heroes in frame.
 *  drawPanelPhoto clamps every offset to the photo's own excess, so a
 *  crop can never slide a photo out of its panel. */
function shotCrop(key) {
  return SMART_CROPS[key] || { ox: 0, oy: 0 };
}

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
    const crop = shotCrop(key);
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
 *  order (so the editor shot leads with a different variant than the
 *  cover), then signal ready. */
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
