// Fixed scenes for screenshots: ?shot=cover shows the cover alone, full-bleed; ?shot=editor
// shows the editor with samples loaded. &layout= &grade= &size= &caption= &sub= &photo= make
// every shot deterministic, and window.__shotReady is set once the fonts are in and the
// cover is painted, so a headless screenshot never catches a half-drawn frame.
//
// Examples:
//   ?shot=cover&layout=diagonal&grade=sunset&size=landscape&photo=pier&caption=SUNSET%20HEIST
//   ?shot=editor&layout=diagonal&grade=sunset&size=landscape&photo=both
// photo= takes one sample name (boulevard, pier) or "both" to spread both samples over panels.

const SIZE_KEYS = { landscape: 'landscape', portrait: 'portrait', square: 'square' };

export async function runShot(shot, query, state, hooks) {
  const { loadImage, redraw, loadSample } = hooks;
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const layout = query.get('layout');
  if (layout === 'diagonal' || layout === 'grid' || layout === 'hero') state.layout = layout;
  const grade = query.get('grade');
  if (grade === 'sunset' || grade === 'neon' || grade === 'night') state.grade = grade;
  const sizeKey = SIZE_KEYS[query.get('size')] || 'landscape';
  state.sizeKey = sizeKey;
  const caption = query.get('caption');
  if (caption !== null) {
    state.caption = caption;
    const input = document.getElementById('caption');
    if (input) input.value = caption;
  }
  const sub = query.get('sub');
  if (sub !== null) {
    state.sub = sub;
    const input = document.getElementById('sub');
    if (input) input.value = sub;
  }
  const color = query.get('color');
  if (color === 'white' || color === 'pink' || color === 'cyan' || color === 'gold') state.color = color;

  const photo = query.get('photo') ?? 'pier';
  if (photo === 'both') {
    const a = await loadImage('samples/boulevard.jpg');
    const b = await loadImage('samples/pier.jpg');
    state.panels[0] = { ...state.panels[0], img: a };
    state.panels[1] = { ...state.panels[1], img: b };
    state.panels[2] = { ...state.panels[2], img: a };
    state.panels[3] = { ...state.panels[3], img: b };
  } else {
    await loadSample(photo);
  }
  state.active = 0;

  // Wait for the poster fonts before painting, so the lettering is crisp, not a fallback.
  // A second paint after fonts settle guards against a font that arrives a beat late.
  try { await document.fonts.ready; } catch { /* fonts are local; a miss still paints */ }
  redraw();
  await new Promise((resolve) => setTimeout(resolve, 60));
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
