// Duskline Cover Studio — deterministic screenshot states.
//
// ?shot=cover   the cover alone, full-bleed: the app renders the PNG it would
//               export at full resolution, shows that PNG, and sets
//               window.__shotReady once it is on screen.
// ?shot=editor  the editor with the built-in samples loaded.
// Both accept &layout= &grade= &size= &caption= &subcaption= &color= &pos=
// and &photo= (chase | driver | beach | detail | neon | all). Without ?shot= the plain editor boots.

import { SIZES, renderCover, loadImage, fontsReady } from './cover.js';
import { bootEditor, applyParams, loadSamples, state } from './main.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

/** The five photo-real samples, in panel order: the chase hero first
 *  (panel 1, the big panel), then driver, beach, detail, neon. */
const SAMPLE_FILES = [
  'samples/media-generation-chase-0-2ec34be2-e327-42be-a54d-cccb749df467.jpg',
  'samples/media-generation-driver-0-1c1bf90c-d164-4bc3-8d77-0d380142b27d.jpg',
  'samples/media-generation-beach-0-9aa1c1c1-ce91-4ab0-b578-97cf5d9d6b67.jpg',
  'samples/media-generation-detail-0-15f66890-fad8-431e-9daa-17cd1d5fcbf8.jpg',
  'samples/media-generation-neon-0-3e780550-f969-4fd0-9588-3129c57b47bf.jpg',
];

/** Which sample art fills the panels for a cover shot: all five photos,
 *  or one photo repeated when &photo= names a single sample. */
async function samplePhotos() {
  const want = params.get('photo') || 'all';
  const photos = await Promise.all(SAMPLE_FILES.map((s) => loadImage(s)));
  const single = { chase: 0, driver: 1, beach: 2, detail: 3, neon: 4 }[want];
  if (single !== undefined) return [photos[single], photos[single]];
  return photos;
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

/** Editor mode: boot the editor, load the samples, then signal ready. */
async function editorShot() {
  await bootEditor(params);
  await loadSamples();
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
