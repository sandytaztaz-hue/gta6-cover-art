// Sunset Cover Studio — the one draw routine shared by the live preview and the PNG export.
// Every cover is painted at full native resolution (1920x1080, 1080x1350 or 1080x1080), never
// upscaled, with high-quality smoothing and the loaded poster fonts, so the export is as sharp
// as the preview. Layouts cut the frame into panels; grades tint the photos; the caption is
// big condensed lettering with an outline and a neon glow.

export const LAYOUTS = {
  diagonal: { label: 'Diagonal', panels: 3 },
  grid: { label: 'Grid', panels: 4 },
  hero: { label: 'Hero + strip', panels: 4 },
};

export const SIZES = {
  landscape: { label: '1920 x 1080', w: 1920, h: 1080 },
  portrait: { label: '1080 x 1350', w: 1080, h: 1350 },
  square: { label: '1080 x 1080', w: 1080, h: 1080 },
};

export const GRADES = {
  sunset: { label: 'Sunset' },
  neon: { label: 'Neon' },
  night: { label: 'Vice Night' },
};

export const CAPTION_COLORS = {
  white: '#ffffff',
  pink: '#ff2e88',
  cyan: '#2ee6ff',
  gold: '#ffc93c',
};

// Panel geometry in fractions of the cover (x, y, w, h) plus, for the diagonal layout, the
// slant of the cut as a fraction of the width. Dividers are the slanted seams between panels.
function panelRects(layout, w, h) {
  if (layout === 'grid') {
    const g = 0.012;
    return [
      { x: 0, y: 0, w: 0.5 - g, h: 0.5 - g, poly: null },
      { x: 0.5 + g, y: 0, w: 0.5 - g, h: 0.5 - g, poly: null },
      { x: 0, y: 0.5 + g, w: 0.5 - g, h: 0.5 - g, poly: null },
      { x: 0.5 + g, y: 0.5 + g, w: 0.5 - g, h: 0.5 - g, poly: null },
    ];
  }
  if (layout === 'hero') {
    const g = 0.012;
    const stripY = 0.66;
    return [
      { x: 0, y: 0, w: 1, h: stripY - g, poly: null },
      { x: 0, y: stripY + g, w: 1 / 3 - g, h: 1 - stripY - g, poly: null },
      { x: 1 / 3 + g / 2, y: stripY + g, w: 1 / 3 - g, h: 1 - stripY - g, poly: null },
      { x: 2 / 3 + g / 2, y: stripY + g, w: 1 / 3 - g, h: 1 - stripY - g, poly: null },
    ];
  }
  // Diagonal: three slanted strips, the poster's signature cut.
  const slant = 0.09;
  const rects = [];
  for (let i = 0; i < 3; i++) {
    const x0 = i / 3;
    const x1 = (i + 1) / 3;
    rects.push({
      x: x0, y: 0, w: 1 / 3, h: 1,
      poly: [
        [x0 + slant, 0], [x1 + slant, 0],
        [x1 - slant, 1], [x0 - slant, 1],
      ],
    });
  }
  return rects;
}

function dividerLines(layout) {
  if (layout === 'grid') {
    return [
      [[0.5, 0], [0.5, 1]],
      [[0, 0.5], [1, 0.5]],
    ];
  }
  if (layout === 'hero') {
    return [
      [[0, 0.66], [1, 0.66]],
      [[1 / 3, 0.66], [1 / 3, 1]],
      [[2 / 3, 0.66], [2 / 3, 1]],
    ];
  }
  const slant = 0.09;
  return [
    [[1 / 3 + slant, 0], [1 / 3 - slant, 1]],
    [[2 / 3 + slant, 0], [2 / 3 - slant, 1]],
  ];
}

// How many panels a layout shows (the editor shows the count beside the layout name).
export function panelCount(layout) {
  return (LAYOUTS[layout] || LAYOUTS.diagonal).panels;
}

// Which panel, if any, contains the point (fractions of the cover). Used for drag-to-position.
export function panelAt(layout, fx, fy) {
  const rects = panelRects(layout, 1, 1);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (r.poly) {
      if (pointInPoly(fx, fy, r.poly)) return i;
    } else if (fx >= r.x && fx <= r.x + r.w && fy >= r.y && fy <= r.y + r.h) {
      return i;
    }
  }
  return -1;
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Deterministic grain: the same seed every paint, so preview and export match exactly.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Draws one photo into one panel rect: cover-fit, then the panel's zoom and drag offset.
function drawPhotoInPanel(ctx, img, rect, w, h, zoom, ox, oy, fit) {
  const px = rect.x * w;
  const py = rect.y * h;
  const pw = rect.w * w;
  const ph = rect.h * h;
  ctx.save();
  ctx.beginPath();
  if (rect.poly) {
    rect.poly.forEach(([fx, fy], i) => {
      if (i === 0) ctx.moveTo(fx * w, fy * h);
      else ctx.lineTo(fx * w, fy * h);
    });
    ctx.closePath();
  } else {
    ctx.rect(px, py, pw, ph);
  }
  ctx.clip();
  ctx.fillStyle = '#1b1226';
  ctx.fillRect(px - 2, py - 2, pw + 4, ph + 4);
  if (img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    let scale = fit === 'fit'
      ? Math.min(pw / iw, ph / ih)
      : Math.max(pw / iw, ph / ih);
    scale *= zoom;
    const dw = iw * scale;
    const dh = ih * scale;
    // Clamp the drag/crop offset so the photo always covers the panel: when the photo
    // exactly matches the panel on one axis, no shift is possible on that axis.
    const oxMax = Math.max(0, (dw - pw) / 2 / pw);
    const oyMax = Math.max(0, (dh - ph) / 2 / ph);
    const cox = Math.max(-oxMax, Math.min(oxMax, ox));
    const coy = Math.max(-oyMax, Math.min(oyMax, oy));
    const dx = px + (pw - dw) / 2 + cox * pw;
    const dy = py + (ph - dh) / 2 + coy * ph;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  ctx.restore();
}

// The colour grade, painted over the photos (under the caption) at the chosen intensity.
function applyGrade(ctx, grade, intensity, w, h) {
  const k = Math.max(0, Math.min(1, intensity));
  if (k <= 0) return;
  ctx.save();
  if (grade === 'sunset') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(255, 150, 60, ${0.10 * k})`);
    g.addColorStop(0.55, `rgba(255, 90, 90, ${0.12 * k})`);
    g.addColorStop(1, `rgba(214, 40, 120, ${0.30 * k})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = `rgba(255, 120, 40, ${0.35 * k})`;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'neon') {
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(255, 0, 140, ${0.22 * k})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, h * 0.4, 0, h);
    g.addColorStop(0, 'rgba(0, 220, 255, 0)');
    g.addColorStop(1, `rgba(0, 200, 255, ${0.25 * k})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(70, 30, 140, ${0.22 * k})`);
    g.addColorStop(1, `rgba(10, 20, 90, ${0.34 * k})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(40, 30, 120, ${0.25 * k})`;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

// The sunset sky band: a warm gradient strip across the top with a bright horizon line.
// It is the cover's signature — the same band on every layout, whatever the photos are.
function drawSkyBand(ctx, w, h) {
  const bandH = h * 0.15;
  const g = ctx.createLinearGradient(0, 0, 0, bandH);
  g.addColorStop(0, 'rgba(255, 176, 66, 0.85)');
  g.addColorStop(0.55, 'rgba(255, 94, 98, 0.75)');
  g.addColorStop(1, 'rgba(255, 94, 98, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, bandH);
  ctx.fillStyle = 'rgba(255, 214, 120, 0.9)';
  ctx.fillRect(0, bandH * 0.55, w, Math.max(2, h * 0.0025));
}

function drawGrain(ctx, w, h) {
  const rnd = mulberry32(20261119);
  const count = Math.floor((w * h) / 1400);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const a = 0.03 + rnd() * 0.09;
    ctx.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    ctx.fillRect(rnd() * w, rnd() * h, 1.4, 1.4);
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// Big condensed caption: auto-fits the width, outlined, with a glow in its own colour.
function drawCaption(ctx, state, w, h) {
  const text = (state.caption || '').trim().toUpperCase();
  const sub = (state.sub || '').trim().toUpperCase();
  if (!text && !sub) return;
  const color = CAPTION_COLORS[state.color] || '#ffffff';
  const atTop = state.pos === 'top';
  const bandH = h * 0.15;
  let size = h * 0.125;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const fitFont = (s) => `400 ${s}px 'Anton', 'Bebas Neue', 'Archivo Black', sans-serif`;
  if (text) {
    ctx.font = fitFont(size);
    while (ctx.measureText(text).width > w * 0.92 && size > 14) {
      size -= 2;
      ctx.font = fitFont(size);
    }
    const baseline = atTop ? bandH + size * 0.95 : h - h * 0.055;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(16, 4, 28, 0.92)';
    ctx.lineWidth = Math.max(3, size * 0.085);
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 0.38;
    ctx.strokeText(text, w / 2, baseline);
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, baseline);
    ctx.restore();
    if (sub) {
      const subSize = Math.max(16, size * 0.30);
      ctx.font = `400 ${subSize}px 'Bebas Neue', 'Anton', sans-serif`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${subSize * 0.22}px`;
      const subBase = atTop ? baseline + subSize * 1.5 : baseline - size * 1.12;
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(16, 4, 28, 0.9)';
      ctx.lineWidth = Math.max(2, subSize * 0.12);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = subSize * 0.3;
      ctx.strokeText(sub, w / 2, subBase);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(sub, w / 2, subBase);
      ctx.restore();
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    }
  }
  // A thin accent bar below the caption (or below the sub-caption for a top caption) —
  // the poster's underline. It sits clear of the lettering, never across it.
  const barW = w * 0.16;
  const barY = atTop
    ? bandH + size * 0.95 + (sub ? size * 0.30 * 2.1 : 0) + size * 0.32
    : h - h * 0.055 + size * 0.32;
  ctx.fillStyle = color;
  ctx.fillRect((w - barW) / 2, barY, barW, Math.max(3, h * 0.004));
}

// Paints the whole cover onto ctx at the canvas's own pixel size. `state.panels` holds one
// entry per panel: { img, zoom, ox, oy, fit }. With fill 'one', the first photo fills every
// panel with a different crop, so one photo still makes a multi-panel cover.
export function drawCover(ctx, state, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#140d1e';
  ctx.fillRect(0, 0, w, h);
  const layout = LAYOUTS[state.layout] ? state.layout : 'diagonal';
  const rects = panelRects(layout, w, h);
  const count = rects.length;
  for (let i = 0; i < count; i++) {
    let panel = state.panels[i] || {};
    if (state.fill === 'one') {
      const first = state.panels[0] || {};
      const shift = (i - (count - 1) / 2) * 0.16;
      panel = { ...first, ox: (first.ox || 0) + shift, oy: first.oy || 0, zoom: first.zoom || 1 };
    }
    drawPhotoInPanel(ctx, panel.img || null, rects[i], w, h,
      panel.zoom || 1, panel.ox || 0, panel.oy || 0, panel.fit || 'cover');
  }
  // Thin neon divider lines along the panel seams.
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 46, 136, 0.95)';
  ctx.lineWidth = Math.max(2, w * 0.0022);
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = Math.max(4, w * 0.006);
  for (const [[x1, y1], [x2, y2]] of dividerLines(layout)) {
    ctx.beginPath();
    ctx.moveTo(x1 * w, y1 * h);
    ctx.lineTo(x2 * w, y2 * h);
    ctx.stroke();
  }
  ctx.restore();
  drawSkyBand(ctx, w, h);
  applyGrade(ctx, state.grade || 'sunset', (state.intensity ?? 70) / 100, w, h);
  if (state.vignette) drawVignette(ctx, w, h);
  if (state.grain) drawGrain(ctx, w, h);
  drawCaption(ctx, state, w, h);
}
