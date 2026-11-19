// Sunset Cover Studio — cover drawing engine.
//
// Plain canvas, no libraries. One draw routine paints both the live preview
// and the full-resolution export, so what you see is exactly what the PNG holds.
// Layouts cut the frame into panels, grades tint the whole frame, and a big
// outlined caption with a sunset sky band gives every cover the same signature.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080 (post)' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350 (story)' },
  landscape: { w: 1920, h: 1080, label: '1920 × 1080 (wide)' },
};

export const LAYOUTS = {
  diagonal: { label: 'Diagonal', panels: 3, hint: '3 slanted panels, poster feel' },
  grid: { label: 'Grid', panels: 4, hint: '2 × 2 four panels' },
  hero: { label: 'Hero + strip', panels: 4, hint: '1 big panel + 3 small below' },
};

export const GRADES = {
  sunset: { label: 'Sunset', hint: 'orange-pink warmth' },
  neon: { label: 'Neon', hint: 'magenta / cyan duotone' },
  vice: { label: 'Vice Night', hint: 'purple / blue night' },
};

export const CAPTION_COLORS = {
  white: { label: 'White', value: '#ffffff' },
  pink: { label: 'Neon pink', value: '#ff2e88' },
  cyan: { label: 'Cyan', value: '#22d3ee' },
  gold: { label: 'Gold', value: '#ffc93c' },
};

export const CAPTION_FONT = '"Bebas Neue", "Anton", "Archivo Black", sans-serif';
export const SUB_FONT = '"Anton", "Archivo Black", sans-serif';

/** A fresh default state: diagonal sunset cover, ready for a photo. */
export function defaultState() {
  return {
    layout: 'diagonal',
    grade: 'sunset',
    intensity: 0.75,
    grain: true,
    grainAmount: 0.5,
    vignette: true,
    size: 'landscape',
    caption: 'SUNSET HEIST',
    subcaption: 'A SUNSET STORY',
    captionColor: 'white',
    captionPosition: 'bottom',
    // One slot per panel of the current layout; a slot holds
    // { img, zoom, ox, oy, fit } or null when the panel is empty.
    panels: [null, null, null],
  };
}

/** Panel rectangles + polygons (pixel coords) for a layout at W × H. */
export function layoutPanels(layout, W, H) {
  const rect = (x, y, w, h) => ({
    x, y, w, h,
    poly: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
  });
  if (layout === 'grid') {
    const g = Math.max(4, Math.round(W * 0.008));
    const hw = (W - g) / 2;
    const hh = (H - g) / 2;
    return [
      rect(0, 0, hw, hh),
      rect(hw + g, 0, hw, hh),
      rect(0, hh + g, hw, hh),
      rect(hw + g, hh + g, hw, hh),
    ];
  }
  if (layout === 'hero') {
    const g = Math.max(4, Math.round(W * 0.008));
    const topH = Math.round(H * 0.62);
    const stripY = topH + g;
    const stripH = H - stripY;
    const sw = (W - 2 * g) / 3;
    return [
      rect(0, 0, W, topH),
      rect(0, stripY, sw, stripH),
      rect(sw + g, stripY, sw, stripH),
      rect(2 * (sw + g), stripY, sw, stripH),
    ];
  }
  // diagonal: three slanted panels, cuts leaning like a poster fold.
  const cut = (xTop, xBottom) => [[xTop, 0], [xBottom, H]];
  const poly = (pts) => {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return {
      x: Math.min(...xs), y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
      poly: pts,
    };
  };
  const c1 = cut(W * 0.36, W * 0.30);
  const c2 = cut(W * 0.68, W * 0.62);
  return [
    poly([[0, 0], c1[0], c1[1], [0, H]]),
    poly([c1[0], c2[0], c2[1], c1[1]]),
    poly([c2[0], [W, 0], [W, H], c2[1]]),
  ];
}

/** The neon divider strokes for a layout: pairs of points, pixel coords. */
export function layoutDividers(layout, W, H) {
  if (layout === 'grid') {
    const g = Math.max(4, Math.round(W * 0.008));
    const hw = (W - g) / 2;
    const hh = (H - g) / 2;
    return [
      [[hw + g / 2, 0], [hw + g / 2, H]],
      [[0, hh + g / 2], [W, hh + g / 2]],
    ];
  }
  if (layout === 'hero') {
    const g = Math.max(4, Math.round(W * 0.008));
    const topH = Math.round(H * 0.62);
    const stripY = topH + g;
    const sw = (W - 2 * g) / 3;
    return [
      [[0, topH + g / 2], [W, topH + g / 2]],
      [[sw + g / 2, stripY], [sw + g / 2, H]],
      [[2 * sw + 1.5 * g, stripY], [2 * sw + 1.5 * g, H]],
    ];
  }
  return [
    [[W * 0.36, 0], [W * 0.30, H]],
    [[W * 0.68, 0], [W * 0.62, H]],
  ];
}

/** Point-in-polygon hit test, for clicking a panel in the preview. */
export function panelAt(layout, W, H, x, y) {
  const panels = layoutPanels(layout, W, H);
  for (let i = panels.length - 1; i >= 0; i--) {
    const poly = panels[i].poly;
    let inside = false;
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
      const [ax, ay] = poly[a];
      const [bx, by] = poly[b];
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
    }
    if (inside) return i;
  }
  return -1;
}

/** Load an image from a URL (local sample or object URL), decoded. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

/** Wait until the poster fonts are usable, so lettering is never a fallback. */
export async function fontsReady() {
  try {
    await Promise.all([
      document.fonts.load('100px "Bebas Neue"'),
      document.fonts.load('100px "Anton"'),
      document.fonts.load('100px "Archivo Black"'),
    ]);
    await document.fonts.ready;
  } catch {
    // A missing font falls back to the next in the stack; drawing still works.
  }
}

// Deterministic grain: the same seed every run, so screenshots never flicker.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile = null;
/** A small tiled noise canvas, generated once from a fixed seed. */
export function noiseTile() {
  if (grainTile) return grainTile;
  const s = 160;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d');
  const data = g.createImageData(s, s);
  const rnd = mulberry32(20261119);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  grainTile = c;
  return c;
}

// ---------------------------------------------------------------- drawing

/** Draw one panel's photo, cover-fit with the panel's zoom and pan offsets. */
function drawPanelPhoto(ctx, panel, slot) {
  const img = slot.img;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const { x, y, w, h } = panel;
  let scale;
  if (slot.fit === 'fit') {
    scale = Math.min(w / iw, h / ih) * slot.zoom;
  } else {
    scale = Math.max(w / iw, h / ih) * slot.zoom;
  }
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2 + (slot.ox || 0) * w;
  const dy = y + (h - dh) / 2 + (slot.oy || 0) * h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Empty-panel placeholder: dusk gradient + a drop hint. */
function drawEmptyPanel(ctx, panel, index, W, H) {
  const g = ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + panel.h);
  g.addColorStop(0, '#2a1b3d');
  g.addColorStop(1, '#120d1e');
  ctx.fillStyle = g;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `${Math.max(14, Math.round(H * 0.028))}px ${SUB_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PANEL ${index + 1} — DROP A PHOTO`, panel.x + panel.w / 2, panel.y + panel.h / 2);
}

/** Per-grade photo filter applied while the photos are drawn. */
function photoFilter(grade) {
  if (grade === 'neon') return 'saturate(1.55) contrast(1.12) brightness(1.03)';
  if (grade === 'vice') return 'saturate(1.08) contrast(1.06) hue-rotate(-14deg) brightness(0.97)';
  return 'saturate(1.28) contrast(1.06) brightness(1.02)';
}

/** Grade tint washed over the whole frame after the panels are painted. */
function gradeWash(ctx, grade, intensity, W, H) {
  if (intensity <= 0) return;
  const a = intensity;
  if (grade === 'sunset') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(255,140,50,${0.30 * a})`);
    g.addColorStop(0.55, `rgba(255,70,110,${0.22 * a})`);
    g.addColorStop(1, `rgba(110,40,160,${0.26 * a})`);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(255,120,40,${0.08 * a})`;
    ctx.fillRect(0, 0, W, H);
  } else if (grade === 'neon') {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, `rgba(255,0,140,${0.34 * a})`);
    g.addColorStop(1, `rgba(0,220,255,${0.34 * a})`);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = `rgba(255,0,160,${0.10 * a})`;
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(90,40,180,${0.34 * a})`);
    g.addColorStop(1, `rgba(10,40,120,${0.38 * a})`);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(40,60,220,${0.08 * a})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalCompositeOperation = 'source-over';
}

/** The signature sky band: a gradient strip + glowing sun across the top. */
function skyBand(ctx, grade, intensity, W, H) {
  const bandH = Math.round(H * 0.26);
  const stops = {
    sunset: ['#ff9a3c', '#ff5e78', '#7a2d8f'],
    neon: ['#ff2e88', '#b537f2', '#22d3ee'],
    vice: ['#5b2a86', '#2b3a8f', '#0e1e5c'],
  }[grade] || ['#ff9a3c', '#ff5e78', '#7a2d8f'];
  const g = ctx.createLinearGradient(0, 0, 0, bandH);
  g.addColorStop(0, stops[0]);
  g.addColorStop(0.55, stops[1]);
  g.addColorStop(1, stops[2]);
  ctx.save();
  ctx.globalAlpha = 0.28 + 0.62 * intensity;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, bandH);
  // Fade the band's lower edge into the photos below it.
  const fade = ctx.createLinearGradient(0, bandH * 0.55, 0, bandH);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, bandH * 0.55, W, bandH * 0.45);
  // The sun: a soft glowing disc sitting in the band.
  const sunR = Math.round(H * 0.085);
  const sunX = Math.round(W * 0.80);
  const sunY = Math.round(bandH * 0.52);
  const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.2);
  sun.addColorStop(0, 'rgba(255,240,180,0.95)');
  sun.addColorStop(0.35, 'rgba(255,200,90,0.55)');
  sun.addColorStop(1, 'rgba(255,160,60,0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The big outlined glow caption + sub-caption. Auto-fits the frame width. */
function drawCaption(ctx, state, W, H) {
  const text = (state.caption || '').trim().toUpperCase();
  if (!text) return;
  const color = (CAPTION_COLORS[state.captionColor] || CAPTION_COLORS.white).value;
  const maxW = W * 0.92;
  let size = Math.round(H * 0.17);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const fit = (s) => {
    ctx.font = `${s}px ${CAPTION_FONT}`;
    return ctx.measureText(text).width;
  };
  while (size > 24 && fit(size) > maxW) size = Math.round(size * 0.94);
  ctx.font = `${size}px ${CAPTION_FONT}`;
  const sub = (state.subcaption || '').trim().toUpperCase();
  const subSize = Math.max(16, Math.round(size * 0.20));
  const gap = Math.round(size * 0.28);
  const pad = Math.round(H * 0.045);
  const blockH = size + (sub ? gap + subSize : 0);
  const top = state.captionPosition === 'top';
  const baseY = top ? pad + size : H - pad - (sub ? gap + subSize : 0);
  const cx = W / 2;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  // Dark outline first, then a coloured glow pass, then the crisp fill.
  ctx.strokeStyle = 'rgba(10,4,20,0.9)';
  ctx.lineWidth = Math.max(3, Math.round(size * 0.07));
  ctx.strokeText(text, cx, baseY);
  ctx.shadowColor = color;
  ctx.shadowBlur = Math.round(size * 0.28);
  ctx.fillStyle = color;
  ctx.fillText(text, cx, baseY);
  ctx.shadowBlur = 0;
  ctx.fillText(text, cx, baseY);
  if (sub) {
    try { ctx.letterSpacing = `${Math.max(2, Math.round(subSize * 0.28))}px`; } catch { /* older canvas */ }
    ctx.font = `${subSize}px ${SUB_FONT}`;
    const subY = top ? baseY + gap + subSize : baseY + gap + subSize;
    ctx.strokeStyle = 'rgba(10,4,20,0.85)';
    ctx.lineWidth = Math.max(2, Math.round(subSize * 0.14));
    ctx.strokeText(sub, cx, subY);
    ctx.fillStyle = '#ffd76a';
    ctx.fillText(sub, cx, subY);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
  ctx.restore();
}

/**
 * Paint the whole cover onto ctx at W × H. The preview and the export both
 * call this — the only difference is the canvas they hand in.
 */
export function drawCover(ctx, state, W, H) {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#120d1e';
  ctx.fillRect(0, 0, W, H);

  const panels = layoutPanels(state.layout, W, H);
  ctx.filter = photoFilter(state.grade);
  panels.forEach((panel, i) => {
    const slot = state.panels[i];
    ctx.save();
    ctx.beginPath();
    panel.poly.forEach(([x, y], k) => (k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.clip();
    if (slot && slot.img) drawPanelPhoto(ctx, panel, slot);
    else drawEmptyPanel(ctx, panel, i, W, H);
    ctx.restore();
  });
  ctx.filter = 'none';

  gradeWash(ctx, state.grade, state.intensity, W, H);
  skyBand(ctx, state.grade, state.intensity, W, H);

  // Neon dividers: a dark seam, then a thin glowing line down its middle.
  const dividers = layoutDividers(state.layout, W, H);
  const seam = Math.max(3, Math.round(W * 0.004));
  ctx.save();
  ctx.lineCap = 'round';
  for (const [[x1, y1], [x2, y2]] of dividers) {
    ctx.strokeStyle = 'rgba(8,6,16,0.95)';
    ctx.lineWidth = seam + Math.max(2, Math.round(W * 0.002));
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, '#ff2e88');
    grad.addColorStop(1, '#22d3ee');
    ctx.strokeStyle = grad;
    ctx.lineWidth = Math.max(2, Math.round(W * 0.002));
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = Math.round(W * 0.008);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();

  drawCaption(ctx, state, W, H);

  if (state.grain) {
    const tile = noiseTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.05 + 0.09 * (state.grainAmount ?? 0.5);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.vignette) {
    const v = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.75,
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/** Render the cover at full native resolution for its size. Returns a canvas. */
export function renderCover(state, sizeKey) {
  const size = SIZES[sizeKey || state.size] || SIZES.landscape;
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), state, size.w, size.h);
  return canvas;
}
