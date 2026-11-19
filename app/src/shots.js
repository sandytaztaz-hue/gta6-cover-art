// Duskline Cover Studio — deterministic screenshot states.
//
// ?shot=cover   the cover alone, full-bleed: the app renders the PNG it would
//               export at full resolution, shows that PNG, and sets
//               window.__shotReady once it is on screen.
// ?shot=editor  the editor with the built-in samples loaded.
// Both accept &layout= &grade= &size= &caption= &subcaption= &color= &pos=
// and &panels=<comma list of scene keys> (panel 1 = the hero/lead photo)
// and &stars=0..5 for the GTA wanted-level HUD. Without ?shot= the plain
// editor boots. Each shot leads with a DIFFERENT scene — the panels param
// is what keeps the four screenshots from recycling the same photo.

import { SIZES, renderCover, loadImage, fontsReady } from './cover.js';
import { bootEditor, applyParams, loadSamples, state } from './main.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

/** The eight photo-real samples, keyed by scene: one distinct photo per
 *  panel, so no two screenshots — and no two panels — repeat a scene. */
const SAMPLES_BY_KEY = {
  chase: 'samples/media-generation-chase-0-2ec34be2-e327-42be-a54d-cccb749df467.jpg',
  driver: 'samples/media-generation-driver-0-1c1bf90c-d164-4bc3-8d77-0d380142b27d.jpg',
  beach: 'samples/media-generation-beach-0-9aa1c1c1-ce91-4ab0-b578-97cf5d9d6b67.jpg',
  police: 'samples/media-generation-media-generation-police-0-0-9a162c3d-8751-4bd9-b694-80e9af009823.jpg',
  woman: 'samples/media-generation-media-generation-woman-0-0-77ef31c1-710b-4f24-8e35-b10f48530de1.jpg',
  neon: 'samples/media-generation-neon-0-3e780550-f969-4fd0-9588-3129c57b47bf.jpg',
  detail: 'samples/media-generation-detail-0-15f66890-fad8-431e-9daa-17cd1d5fcbf8.jpg',
  desert: 'samples/media-generation-media-generation-desert-0-0-0a350fe7-a7ce-4223-9abc-c3d5fddbe128.jpg',
  // New distinct scenes (Sand's 08:06 + 08:07 fixes): each is a different
  // photo and a different condition, so no strip ever repeats a look.
  womaninside: 'samples/media-generation-woman-inside-0-032b851c-2e53-4798-a1a3-6b648868c93c.jpg',
  beachday: 'samples/media-generation-beach-day-0-cbf349ba-457e-48ff-a4dc-2d402c285bba.jpg',
  rooftop: 'samples/media-generation-rooftop-dusk-0-94866e7c-e26f-4a72-8d61-d36aa416924c.jpg',
  desertnoon: 'samples/media-generation-desert-noon-0-41dfc5d7-5556-4985-8a80-5408ee2d0b62.jpg',
};
const DEFAULT_ORDER = ['chase', 'driver', 'beach', 'police', 'woman', 'neon', 'detail', 'desert'];

/** Panel order for this shot: &panels=chase,driver,beach,police,neon picks
 *  the photo for each panel in order (panel 1 = the hero/lead photo).
 *  &photo=<key> is the old single-photo form, kept for compatibility. */
function panelOrder() {
  const panels = (params.get('panels') || '')
    .split(',').map((s) => s.trim()).filter((k) => SAMPLES_BY_KEY[k]);
  if (panels.length) return panels;
  const single = params.get('photo');
  if (single && SAMPLES_BY_KEY[single]) return [single];
  return DEFAULT_ORDER;
}

/** Load the panel photos for this shot, in panel order. */
async function samplePhotos() {
  const order = panelOrder();
  return Promise.all(order.map((k) => loadImage(SAMPLES_BY_KEY[k])));
}

/** Cover-only mode: render the real export PNG and show it full-bleed. */
async function coverShot() {
  document.getElementById('app').hidden = true;
  const coverView = document.getElementById('coverShot');
  coverView.hidden = false;
  applyParams(params);
  const photos = await samplePhotos();
  const n = state.panels.length;
  for (let i = 0; i < n; i++) {
    const img = photos[i % photos.length];
    const crops = [
      // The hero crop sits a touch high so the chase vehicles, not the sky,
      // fill the big panel; the strip panels get their own small shifts.
      { ox: 0, oy: -0.05 }, { ox: 0.08, oy: -0.04 },
      { ox: 0, oy: 0.08 }, { ox: -0.04, oy: -0.08 },
      { ox: 0.06, oy: 0.06 },
    ];
    state.panels[i] = { img, name: 'sample', zoom: 1, ox: crops[i % 5].ox, oy: crops[i % 5].oy, fit: 'cover' };
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
