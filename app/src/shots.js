// Sunset Cover Studio — deterministic screenshot states.
//
// ?shot=cover   the cover alone, full-bleed: the app renders the PNG it would
//               export at full resolution, shows that PNG, and sets
//               window.__shotReady once it is on screen.
// ?shot=editor  the editor with the built-in samples loaded.
// Both accept &layout= &grade= &size= &caption= &subcaption= &color= &pos=
// and &photo= (boulevard | pier | both). Without ?shot= the plain editor boots.

import { SIZES, renderCover, loadImage, fontsReady } from './cover.js';
import { bootEditor, applyParams, loadSamples, state } from './main.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

/** Which sample photos fill the panels for a cover shot. */
async function samplePhotos() {
  const want = params.get('photo') || 'both';
  const boulevard = await loadImage('samples/boulevard.jpg');
  const pier = await loadImage('samples/pier.jpg');
  if (want === 'boulevard') return [boulevard, boulevard];
  if (want === 'pier') return [pier, pier];
  return [boulevard, pier];
}

/** Cover-only mode: render the real export PNG and show it full-bleed. */
async function coverShot() {
  document.getElementById('app').hidden = true;
  const coverView = document.getElementById('coverShot');
  coverView.hidden = false;
  applyParams(params);
  const [a, b] = await samplePhotos();
  const n = state.panels.length;
  for (let i = 0; i < n; i++) {
    const img = i % 2 === 0 ? a : b;
    const crops = [
      { ox: -0.08, oy: 0 }, { ox: 0.08, oy: -0.04 },
      { ox: 0, oy: 0.08 }, { ox: -0.04, oy: -0.08 },
    ];
    state.panels[i] = { img, name: 'sample', zoom: 1, ox: crops[i % 4].ox, oy: crops[i % 4].oy, fit: 'cover' };
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
