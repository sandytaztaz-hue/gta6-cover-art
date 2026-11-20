// VICE PURSUIT — magazine cover engine (rebuild r9, six-panel edition).
//
// Plain canvas, no libraries, no network. One draw routine paints the live
// preview and the full-resolution export, so what you see is exactly what
// the PNG holds. The look is a magazine cover in the HEATWAVE style: real
// photographs in a panel collage, a giant gradient headline with a pink
// script subtitle, role tags, location + time labels, a HEAT star badge, a
// HOT seal, a newspaper quote, and a billing strip with a barcode.
//
// Rebuild r9 changes, per Sand's scribbled screenshot + the HEATWAVE
// reference:
//  - SIX photo panels on the main cover (was four): the hero stays big on
//    the left, and FIVE panels stack on the right — the neon driver, the
//    rainy fixer, the misty pier, plus two new photographs made in this
//    session: a desert-canyon sunset getaway and an Everglades airboat at
//    dusk. Every panel is a different hero, mood and weather.
//  - The big five-star wanted pill at the top centre is GONE (Sand
//    scribbled it out; it does not exist in HEATWAVE). wantedStars now
//    defaults to 0, so the main cover never draws it. The portrait/square
//    variants still pass &stars=5 and keep their own pills — they were not
//    part of the scribble.
//  - The small HEAT pill now matches HEATWAVE exactly: "HEAT ★★★★☆" —
//    four filled gold stars and one EMPTY star (r8 had five filled). It
//    sits at the frame's top-right corner, like HEATWAVE, instead of on
//    the hero. The quote strip keeps all five small stars:
//    "★★★★★ 'HOTTER THAN THE ASPHALT' — THE PALM GAZETTE".
//  - The fourth right panel (THE GETAWAY, canyon sunset) sits in the
//    headline's band, so its place + time ride inside its role tag instead
//    of a bottom label the giant title would paint over.
//  - The HOT seal shrinks and parks bottom-left on short stacked panels,
//    so it never swallows the role tag above it.
//
// The photos stay bright on top — no dark overlay over the hero. The
// headline sits across the lower hero so the cars and the chase stay
// visible above it.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080 (post)' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350 (story)' },
  landscape: { w: 1920, h: 1080, label: '1920 × 1080 (wide)' },
};

export const LAYOUTS = {
  magazine: { label: 'Magazine', panels: 6, hint: 'Hero left, five stacked right, billing strip below' },
  five: { label: 'Five panel', panels: 5, hint: '1 hero panel + 4 small below' },
  hero: { label: 'Hero + strip', panels: 4, hint: '1 big panel + 3 small below' },
};

export const GRADES = {
  golden: { label: 'Golden Hour', hint: 'warm amber / gold glow' },
  neon: { label: 'Neon', hint: 'magenta / cyan duotone' },
  vice: { label: 'Vice Night', hint: 'purple / blue night' },
};

export const CAPTION_COLORS = {
  gradient: { label: 'Sunset gradient', value: 'gradient' },
  white: { label: 'White', value: '#ffffff' },
  pink: { label: 'Neon pink', value: '#ff2e88' },
  cyan: { label: 'Cyan', value: '#22d3ee' },
  gold: { label: 'Gold', value: '#ffc93c' },
};

export const TITLE_STYLES = {
  gradient: { label: 'Gradient fill', hint: 'orange to pink, like a magazine masthead' },
  solid: { label: 'Solid fill', hint: 'flat colour, heavy outline' },
  outline: { label: 'Outline only', hint: 'hollow letters, neon glow' },
};

export const CAPTION_FONT = '"Bebas Neue", "Anton", "Archivo Black", sans-serif';
export const SUB_FONT = '"Anton", "Archivo Black", sans-serif';
export const BODY_FONT = '"Archivo Black", "Anton", sans-serif';

/** A fresh default state: Magazine layout, Golden Hour, the chase hero on
 *  top, VICE PURSUIT headline, all magazine furniture switched on — except
 *  the big wanted-stars pill, which is off by default in r9 (Sand had it
 *  scribbled out of the main cover; it lives on only where a shot URL
 *  explicitly asks for it with &stars=). */
export function defaultState() {
  return {
    layout: 'magazine',
    grade: 'golden',
    strength: 0.75,
    contrast: 1.06,
    saturation: 1.25,
    grain: true,
    grainAmount: 0.5,
    vignette: true,
    halftone: false,
    size: 'landscape',
    caption: 'VICE PURSUIT',
    subcaption: 'Coastline Nights',
    captionColor: 'gradient',
    titleStyle: 'gradient',
    captionPosition: 'bottom',
    // GTA wanted level: 0 = off. The big pill is OFF by default in r9 —
    // it does not exist in HEATWAVE. The portrait/square variants still
    // pass &stars=5 and keep theirs.
    wantedStars: 0,
    // Magazine furniture, all on by default — the cover is a magazine.
    roleTags: true,
    locationLabels: true,
    heatBadge: true,
    hotSeal: true,
    quote: true,
    quoteText: 'HOTTER THAN THE ASPHALT',
    quoteSource: 'THE PALM GAZETTE',
    bottomStrip: true,
    stripText: 'ONE COASTLINE · SIX STORIES · NO CURFEW',
    billingText: 'A VICE PURSUIT PICTURE · STARRING YOUR CREW · SHOT ON YOUR OWN CAMERA · INKED BY HAND IN THE STUDIO',
    // Stickers placed on the cover: { type, x, y, scale } in fractions of W/H.
    stickers: [],
    // One slot per panel of the current layout; a slot holds
    // { img, zoom, ox, oy, fit } or null when the panel is empty.
    panels: [null, null, null, null, null, null],
  };
}

/** Panel rectangles + polygons (pixel coords) for a layout at W × H. */
export function layoutPanels(layout, W, H) {
  const rect = (x, y, w, h) => ({
    x, y, w, h,
    poly: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
  });
  const g = Math.max(4, Math.round(W * 0.008));
  if (layout === 'five') {
    const topH = Math.round(H * 0.60);
    const stripY = topH + g;
    const stripH = H - stripY;
    const sw = (W - 3 * g) / 4;
    return [
      rect(0, 0, W, topH),
      rect(0, stripY, sw, stripH),
      rect(sw + g, stripY, sw, stripH),
      rect(2 * (sw + g), stripY, sw, stripH),
      rect(3 * (sw + g), stripY, sw, stripH),
    ];
  }
  if (layout === 'hero') {
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
  // magazine: hero panel left (54% wide), FIVE stacked panels right —
  // six photographs in all, each a different hero / mood / weather.
  // The billing strip along the bottom is furniture, not a photo panel.
  const stripH = Math.round(H * 0.085);
  const bodyH = H - stripH - g;
  const heroW = Math.round(W * 0.54);
  const rightX = heroW + g;
  const rightW = W - rightX;
  const rh = (bodyH - 4 * g) / 5;
  return [
    rect(0, 0, heroW, bodyH),
    rect(rightX, 0, rightW, rh),
    rect(rightX, rh + g, rightW, rh),
    rect(rightX, 2 * (rh + g), rightW, rh),
    rect(rightX, 3 * (rh + g), rightW, rh),
    rect(rightX, 4 * (rh + g), rightW, rh),
  ];
}

/** The neon divider strokes for a layout: pairs of points, pixel coords. */
export function layoutDividers(layout, W, H) {
  const g = Math.max(4, Math.round(W * 0.008));
  if (layout === 'five') {
    const topH = Math.round(H * 0.60);
    const stripY = topH + g;
    const sw = (W - 3 * g) / 4;
    return [
      [[0, topH + g / 2], [W, topH + g / 2]],
      [[sw + g / 2, stripY], [sw + g / 2, H]],
      [[2 * sw + 1.5 * g, stripY], [2 * sw + 1.5 * g, H]],
      [[3 * sw + 2.5 * g, stripY], [3 * sw + 2.5 * g, H]],
    ];
  }
  if (layout === 'hero') {
    const topH = Math.round(H * 0.62);
    const stripY = topH + g;
    const sw = (W - 2 * g) / 3;
    return [
      [[0, topH + g / 2], [W, topH + g / 2]],
      [[sw + g / 2, stripY], [sw + g / 2, H]],
      [[2 * sw + 1.5 * g, stripY], [2 * sw + 1.5 * g, H]],
    ];
  }
  const stripH = Math.round(H * 0.085);
  const bodyH = H - stripH - g;
  const heroW = Math.round(W * 0.54);
  const rightX = heroW + g;
  const rh = (bodyH - 4 * g) / 5;
  const divs = [[[heroW + g / 2, 0], [heroW + g / 2, bodyH]]];
  for (let i = 1; i <= 4; i++) {
    const y = i * rh + (i - 0.5) * g;
    divs.push([[rightX, y], [W, y]]);
  }
  divs.push([[0, bodyH + g / 2], [W, bodyH + g / 2]]);
  return divs;
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
  const rnd = mulberry32(20261120);
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
function photoFilter(grade, contrast, saturation) {
  const c = (contrast || 1).toFixed(2);
  const s = (saturation || 1).toFixed(2);
  if (grade === 'neon') return `saturate(${(s * 1.3).toFixed(2)}) contrast(${(c * 1.08).toFixed(2)}) brightness(1.03)`;
  if (grade === 'vice') return `saturate(${(s * 0.85).toFixed(2)}) contrast(${c}) hue-rotate(-14deg) brightness(0.97)`;
  return `saturate(${(s * 1.15).toFixed(2)}) contrast(${c}) sepia(0.28) brightness(1.06)`;
}

/** Grade tint washed over the whole frame after the panels are painted. */
function gradeWash(ctx, grade, strength, W, H) {
  if (strength <= 0) return;
  const a = strength;
  let stops;
  if (grade === 'neon') stops = ['rgba(255,0,140,0.34)', 'rgba(150,40,255,0.22)', 'rgba(0,220,255,0.34)'];
  else if (grade === 'vice') stops = ['rgba(90,40,180,0.34)', 'rgba(40,60,200,0.20)', 'rgba(10,40,120,0.38)'];
  else stops = ['rgba(255,190,60,0.36)', 'rgba(255,150,30,0.24)', 'rgba(180,90,10,0.30)'];
  const scaled = stops.map((st) => {
    const m = st.match(/([\d.]+)\)$/);
    const v = parseFloat(m[1]) * a;
    return st.replace(/[\d.]+\)$/, `${v.toFixed(3)})`);
  });
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, scaled[0]);
  g.addColorStop(0.55, scaled[1]);
  g.addColorStop(1, scaled[2]);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
}

/** A five-pointed star path, centred at (cx, cy) with radius r. */
function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.42;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + rr * Math.cos(a);
    const py = cy + rr * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** GTA wanted-level HUD: N solid gold stars on a dark pill. Drawn as crisp
 *  vector shapes (never part of a photo) so the stars stay countable at any
 *  export size. rightX is the pill's right edge. r9: the main cover never
 *  draws this — wantedStars defaults to 0, because the big pill does not
 *  exist in HEATWAVE. Only a shot URL that explicitly passes &stars=
 *  (the portrait/square variants) turns it back on. */
export function drawWantedStars(ctx, W, H, count, rightX) {
  const n = Math.max(0, Math.min(5, Math.round(count || 0)));
  if (n === 0) return;
  // Size the stars by the SHORTER side, so a tall portrait frame does not
  // get a pill that swallows the whole hero width.
  const ref = Math.min(W, H);
  const starR = Math.max(14, Math.round(ref * 0.038));
  const gap = Math.round(starR * 0.45);
  const padX = Math.round(starR * 0.9);
  const padY = Math.round(starR * 0.55);
  const pillW = n * starR * 2 + (n - 1) * gap + padX * 2;
  const pillH = starR * 2 + padY * 2;
  const x0 = (rightX ?? W - Math.round(W * 0.025)) - pillW;
  const y0 = Math.round(H * 0.03);
  ctx.save();
  ctx.fillStyle = 'rgba(8,6,16,0.72)';
  ctx.strokeStyle = 'rgba(255,201,60,0.85)';
  ctx.lineWidth = Math.max(2, Math.round(starR * 0.08));
  ctx.beginPath();
  ctx.roundRect(x0, y0, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    const cx = x0 + padX + starR + i * (starR * 2 + gap);
    const cy = y0 + pillH / 2;
    starPath(ctx, cx, cy, starR);
    ctx.fillStyle = '#ffc93c';
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,4,20,0.9)';
    ctx.lineWidth = Math.max(2, Math.round(starR * 0.09));
    ctx.stroke();
  }
  ctx.restore();
}

/** Small white label pill with dark text, like a magazine role tag. */
function tagPill(ctx, text, x, y, H, align = 'left') {
  const fs = Math.max(12, Math.round(H * 0.024));
  ctx.font = `${fs}px ${BODY_FONT}`;
  const padX = Math.round(fs * 0.7);
  const padY = Math.round(fs * 0.45);
  const tw = ctx.measureText(text).width;
  const bx = align === 'right' ? x - tw - padX * 2 : x;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.strokeStyle = 'rgba(10,4,20,0.85)';
  ctx.lineWidth = Math.max(1, Math.round(fs * 0.08));
  ctx.beginPath();
  ctx.roundRect(bx, y, tw + padX * 2, fs + padY * 2, Math.round(fs * 0.25));
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#14061f';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + padX, y + (fs + padY * 2) / 2 + 1);
  ctx.restore();
  return bx + tw + padX * 2;
}

/** Location + time label: dark pill, white place, gold time. */
function placeLabel(ctx, place, time, x, y, H, align = 'right') {
  const fs = Math.max(12, Math.round(H * 0.026));
  ctx.font = `${fs}px ${BODY_FONT}`;
  const label = `${place} · ${time}`;
  const padX = Math.round(fs * 0.8);
  const padY = Math.round(fs * 0.5);
  const tw = ctx.measureText(label).width;
  const bx = align === 'right' ? x - tw - padX * 2 : x;
  ctx.save();
  ctx.fillStyle = 'rgba(8,6,16,0.78)';
  ctx.strokeStyle = 'rgba(255,201,60,0.9)';
  ctx.lineWidth = Math.max(1, Math.round(fs * 0.08));
  ctx.beginPath();
  ctx.roundRect(bx, y, tw + padX * 2, fs + padY * 2, Math.round(fs * 0.3));
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(place, bx + padX, y + (fs + padY * 2) / 2 + 1);
  const pw = ctx.measureText(place).width;
  ctx.fillStyle = '#ffc93c';
  ctx.fillText(` · ${time}`, bx + padX + pw, y + (fs + padY * 2) / 2 + 1);
  ctx.restore();
}

/** HEAT ★★★★☆ badge, exactly like HEATWAVE: dark pill, gold HEAT, four
 *  FILLED gold stars and one EMPTY star — a gold outline over the dark
 *  pill, no gold fill. r8 drew five filled stars; r9 leaves the fifth
 *  star empty, so stars exist in exactly two small places on the cover:
 *  this pill and the five small stars of the quote strip. */
function heatBadge(ctx, x, y, H) {
  const fs = Math.max(13, Math.round(H * 0.028));
  ctx.save();
  ctx.font = `${fs}px ${BODY_FONT}`;
  const text = 'HEAT ';
  const tw = ctx.measureText(text).width;
  const starR = Math.round(fs * 0.55);
  const gap = Math.round(starR * 0.3);
  const padX = Math.round(fs * 0.8);
  const padY = Math.round(fs * 0.5);
  const pillW = padX * 2 + tw + 5 * starR * 2 + 4 * gap;
  const pillH = fs + padY * 2;
  const bx = x - pillW;
  ctx.fillStyle = 'rgba(8,6,16,0.8)';
  ctx.strokeStyle = 'rgba(255,201,60,0.9)';
  ctx.lineWidth = Math.max(1, Math.round(fs * 0.08));
  ctx.beginPath();
  ctx.roundRect(bx, y, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffc93c';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + padX, y + pillH / 2 + 1);
  for (let i = 0; i < 5; i++) {
    const cx = bx + padX + tw + starR + i * (starR * 2 + gap);
    starPath(ctx, cx, y + pillH / 2, starR);
    if (i < 4) {
      ctx.fillStyle = '#ffc93c';
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(8,6,16,0.6)';
      ctx.fill();
      ctx.strokeStyle = '#ffc93c';
      ctx.lineWidth = Math.max(2, Math.round(starR * 0.14));
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** HOT seal: a gold starburst disc with HOT in the middle. */
function hotSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const spikes = 14;
  for (let i = 0; i < spikes * 2; i++) {
    const rr = i % 2 === 0 ? r : r * 0.82;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const px = rr * Math.cos(a);
    const py = rr * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffc93c';
  ctx.fill();
  ctx.strokeStyle = 'rgba(10,4,20,0.9)';
  ctx.lineWidth = Math.max(2, Math.round(r * 0.06));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  ctx.fillStyle = '#ff2e5e';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(r * 0.52)}px ${BODY_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HOT', 0, 1);
  ctx.restore();
}

/** "EST. 2026" round seal, thin gold ring + small caps. */
function estSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(255,201,60,0.95)';
  ctx.lineWidth = Math.max(2, Math.round(r * 0.07));
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffc93c';
  ctx.font = `${Math.round(r * 0.42)}px ${BODY_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EST.', 0, -Math.round(r * 0.22));
  ctx.fillText('2026', 0, Math.round(r * 0.28));
  ctx.restore();
}

/** Deterministic barcode: seeded bars, like a magazine issue code. */
function barcode(ctx, x, y, w, h) {
  const rnd = mulberry32(20261120);
  ctx.save();
  ctx.fillStyle = '#14061f';
  let bx = x;
  while (bx < x + w) {
    const bw = 1 + Math.floor(rnd() * 4);
    if (rnd() > 0.45) ctx.fillRect(bx, y, bw, h);
    bx += bw + 1 + Math.floor(rnd() * 3);
  }
  ctx.restore();
}

/** The big magazine headline + script subtitle. Auto-fits the frame width.
 *  Gradient fill runs orange → pink → purple top to bottom, like HEATWAVE.
 *  The headline block sits at the bottom of the HERO panel (not the frame)
 *  when the hero ends above the strip, so it never covers the strip panels. */
function drawHeadline(ctx, state, W, H, hero) {
  const text = (state.caption || '').trim().toUpperCase();
  if (!text) return;
  const color = (CAPTION_COLORS[state.captionColor] || CAPTION_COLORS.gradient).value;
  const maxW = W * 0.94;
  let size = Math.round(H * 0.19);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const fit = (s) => {
    ctx.font = `${s}px ${CAPTION_FONT}`;
    return ctx.measureText(text).width;
  };
  while (size > 24 && fit(size) > maxW) size = Math.round(size * 0.94);
  ctx.font = `${size}px ${CAPTION_FONT}`;
  const sub = (state.subcaption || '').trim();
  const subSize = Math.max(18, Math.round(size * 0.30));
  const gap = Math.round(size * 0.30);
  const pad = Math.round(H * 0.05);
  const top = state.captionPosition === 'top';
  // Bottom edge of the headline block: the frame bottom, or the hero's
  // bottom edge when the hero ends above the strip panels.
  const heroBottom = hero ? hero.y + hero.h : H;
  const blockBottom = top
    ? pad + size + (sub ? gap + subSize : 0)
    : Math.min(H - pad - Math.round(H * 0.045), heroBottom - Math.round(H * 0.02));
  const baseY = top ? pad + size : blockBottom - (sub ? gap + subSize : 0);
  const cx = W / 2;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  // Dark outline first, then the fill (gradient / solid / hollow).
  ctx.strokeStyle = 'rgba(10,4,20,0.92)';
  ctx.lineWidth = Math.max(3, Math.round(size * 0.075));
  ctx.strokeText(text, cx, baseY);
  if (state.titleStyle === 'outline') {
    ctx.strokeStyle = color === 'gradient' ? '#ffc93c' : color;
    ctx.lineWidth = Math.max(2, Math.round(size * 0.03));
    ctx.shadowColor = color === 'gradient' ? '#ff2e88' : color;
    ctx.shadowBlur = Math.round(size * 0.22);
    ctx.strokeText(text, cx, baseY);
  } else if (color === 'gradient') {
    const grad = ctx.createLinearGradient(0, baseY - size, 0, baseY + size * 0.12);
    grad.addColorStop(0, '#fff3c4');
    grad.addColorStop(0.35, '#ffb03a');
    grad.addColorStop(0.65, '#ff5e78');
    grad.addColorStop(1, '#c93bff');
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = Math.round(size * 0.20);
    ctx.fillStyle = grad;
    ctx.fillText(text, cx, baseY);
    ctx.shadowBlur = 0;
    ctx.fillText(text, cx, baseY);
  } else {
    ctx.shadowColor = color;
    ctx.shadowBlur = Math.round(size * 0.24);
    ctx.fillStyle = color;
    ctx.fillText(text, cx, baseY);
    ctx.shadowBlur = 0;
    ctx.fillText(text, cx, baseY);
  }
  if (sub) {
    // Script subtitle: slanted, pink, overlapping the headline's baseline.
    const subY = baseY + gap + subSize;
    ctx.save();
    ctx.translate(cx, subY);
    ctx.transform(1, 0, -0.22, 1, 0, 0);
    ctx.font = `italic ${subSize}px ${SUB_FONT}`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(10,4,20,0.9)';
    ctx.lineWidth = Math.max(2, Math.round(subSize * 0.12));
    ctx.strokeText(sub, 0, 0);
    ctx.fillStyle = '#ff7ab8';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = Math.round(subSize * 0.35);
    ctx.fillText(sub, 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillText(sub, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/** Newspaper quote line: gold stars + quoted line + source. Scoped to the
 *  hero panel's width so it never runs across the stacked side panels.
 *  The five small stars stay EXACTLY as they are — Sand's star rule
 *  removes only the big pill; the quote keeps ★★★★★, like HEATWAVE. */
function drawQuote(ctx, state, W, H, hero) {
  const quote = (state.quoteText || '').trim();
  if (!quote) return;
  const fs0 = Math.max(13, Math.round(H * 0.026));
  const x0 = hero ? hero.x : 0;
  const qw = hero ? hero.w : W;
  ctx.save();
  // Shrink the quote font until the line fits the hero's width.
  let fs = fs0;
  let line = '';
  for (;;) {
    ctx.font = `${fs}px ${BODY_FONT}`;
    line = `★★★★★  "${quote.toUpperCase()}" — ${state.quoteSource || 'THE PALM GAZETTE'}`;
    if (ctx.measureText(line).width <= qw * 0.96 || fs <= 10) break;
    fs = Math.round(fs * 0.92);
  }
  const tw = ctx.measureText(line).width;
  const x = x0 + Math.max(0, (qw - tw) / 2);
  const y = (hero ? hero.y : 0) + Math.round((hero ? hero.h : H) * 0.36);
  ctx.fillStyle = 'rgba(8,6,16,0.62)';
  ctx.fillRect(x0, y - fs * 0.9, qw, fs * 2.1);
  ctx.fillStyle = '#ffc93c';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('★★★★★', x, y + fs * 0.15);
  const starW = ctx.measureText('★★★★★').width;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`  "${quote.toUpperCase()}" — ${state.quoteSource || 'THE PALM GAZETTE'}`, x + starW, y + fs * 0.15);
  ctx.restore();
}

/** Bottom billing strip: strip text, billing line, barcode, VOL tag. */
function drawBottomStrip(ctx, state, W, H) {
  const stripH = Math.round(H * 0.085);
  const y0 = H - stripH;
  ctx.save();
  // Pink-red gradient band, like a magazine footer.
  const g = ctx.createLinearGradient(0, y0, W, y0);
  g.addColorStop(0, '#ff2e5e');
  g.addColorStop(0.5, '#ff5e78');
  g.addColorStop(1, '#ff2e88');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, stripH);
  ctx.fillStyle = 'rgba(10,4,20,0.55)';
  ctx.fillRect(0, y0, W, Math.max(2, Math.round(stripH * 0.06)));
  const fs = Math.max(12, Math.round(stripH * 0.34));
  ctx.font = `${fs}px ${BODY_FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const strip = (state.stripText || '').toUpperCase();
  ctx.fillText(strip, W / 2, y0 + stripH * 0.36);
  // Billing line + barcode along the very bottom — truncate the billing
  // text so it never runs under the VOL tag or the barcode. The VOL tag is
  // right-aligned ending at volX, so the billing must stop before the tag's
  // left edge, with a gap.
  const bfs = Math.max(9, Math.round(stripH * 0.22));
  const bw = Math.round(W * 0.075);
  const volX = W - bw - Math.round(W * 0.03);
  ctx.font = `${bfs}px ${BODY_FONT}`;
  const volW = ctx.measureText('VOL. 06').width;
  const gap = Math.round(W * 0.03);
  ctx.font = `${bfs}px ${SUB_FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  let billing = (state.billingText || '').toUpperCase();
  const maxBilling = volX - volW - gap - Math.round(W * 0.02);
  while (billing.length > 4 && ctx.measureText(billing).width > maxBilling) {
    billing = billing.slice(0, -1);
  }
  if (billing !== (state.billingText || '').toUpperCase()) billing = billing.replace(/[^A-Z0-9 ]*$/, '') + '…';
  ctx.fillText(billing, Math.round(W * 0.02), y0 + stripH * 0.80);
  barcode(ctx, W - bw - Math.round(W * 0.015), y0 + stripH * 0.62, bw, stripH * 0.32);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.font = `${bfs}px ${BODY_FONT}`;
  ctx.fillText('VOL. 06', volX, y0 + stripH * 0.80);
  ctx.restore();
}

/** User stickers: sun, palm, star, flame, badge — small vector marks. */
function drawStickers(ctx, state, W, H) {
  for (const s of state.stickers || []) {
    const cx = (s.x || 0.5) * W;
    const cy = (s.y || 0.5) * H;
    const r = Math.max(10, Math.round(H * 0.05 * (s.scale || 1)));
    ctx.save();
    ctx.translate(cx, cy);
    if (s.type === 'sun') {
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff9a1e';
      ctx.lineWidth = Math.max(2, r * 0.12);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25);
        ctx.lineTo(Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.6);
        ctx.stroke();
      }
    } else if (s.type === 'palm') {
      ctx.strokeStyle = '#2fae6e';
      ctx.lineWidth = Math.max(3, r * 0.14);
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.quadraticCurveTo(r * 0.2, 0, 0, -r);
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(Math.cos(a) * r * 1.1, -r + Math.sin(a) * r * 0.6, Math.cos(a) * r * 1.4, -r * 0.4 + Math.sin(a) * r * 0.5);
        ctx.stroke();
      }
    } else if (s.type === 'star') {
      ctx.fillStyle = '#ffc93c';
      starPath(ctx, 0, 0, r);
      ctx.fill();
    } else if (s.type === 'flame') {
      ctx.fillStyle = '#ff6a00';
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 0.9, -r * 0.2, r * 0.5, r * 0.6);
      ctx.quadraticCurveTo(r * 0.1, r * 0.9, -r * 0.4, r * 0.6);
      ctx.quadraticCurveTo(-r * 0.9, 0, -r * 0.3, -r * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(0, r * 0.25, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 'badge' — small gold seal
      ctx.fillStyle = '#ffc93c';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#14061f';
      ctx.font = `${Math.round(r * 0.7)}px ${BODY_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 1);
    }
    ctx.restore();
  }
}

/** Halftone dots over the whole frame, print-magazine feel. */
function halftone(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#14061f';
  const step = Math.max(6, Math.round(W * 0.008));
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      const r = step * 0.16 * (1 + 0.5 * Math.sin(x * 0.01 + y * 0.013));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** One row per panel: role tag, place and time. Six panels, six different
 *  stories — sunny chase, neon night, rainy downtown, misty pier, desert
 *  canyon sunset, Everglades dusk. Panel 4 (THE GETAWAY) is the one whose
 *  bottom edge falls inside the giant headline's band, so in the magazine
 *  grid its place + time ride inside the role tag instead of a bottom
 *  label the title would paint over. Panel 5 (THE SMUGGLER) is worse —
 *  even its TOP tag would hide behind the title — so its role + place +
 *  time merge into one white pill at the panel's bottom-right. */
const PANEL_META = [
  { role: 'THE CLOSER', place: 'CORAL CAUSEWAY', time: '7:15 PM' },
  { role: 'THE DRIVER', place: 'OCEAN DRIVE', time: '6:40 PM' },
  { role: 'THE FIXER', place: 'VICE PORT', time: '11:58 PM' },
  { role: 'THE LOOKOUT', place: 'PALM ROW', time: '9:02 PM' },
  { role: 'THE GETAWAY', place: 'RED ROCK PASS', time: '6:02 PM' },
  { role: 'THE SMUGGLER', place: 'GATOR FLATS', time: '5:31 PM' },
];

/** Role tags + location labels for each panel, magazine style. */
function drawPanelFurniture(ctx, state, panels, W, H) {
  panels.forEach((panel, i) => {
    if (panel.w < W * 0.15 || panel.h < H * 0.12) return;
    const meta = PANEL_META[i];
    if (!meta) return;
    const pad = Math.max(6, Math.round(W * 0.008));
    // Merged tags: only the magazine grid's fourth and fifth stacked
    // panels need them (their bottom labels would sit under the headline,
    // and panel 5's top tag would too). Other layouts keep the plain role
    // tag + bottom label, as before.
    const mergedTop = state.layout === 'magazine' && i === 4;
    const mergedBottom = state.layout === 'magazine' && i === 5;
    if (state.roleTags) {
      if (mergedBottom) {
        const fs = Math.max(12, Math.round(H * 0.024));
        const pillH = fs + Math.round(fs * 0.45) * 2;
        tagPill(ctx, `${meta.role} · ${meta.place} · ${meta.time}`, panel.x + panel.w - pad, panel.y + panel.h - pad - pillH, H, 'right');
      } else {
        const tag = mergedTop ? `${meta.role} · ${meta.place} · ${meta.time}` : meta.role;
        tagPill(ctx, tag, panel.x + pad, panel.y + pad, H, 'left');
      }
    }
    if (state.locationLabels && !mergedTop && !mergedBottom) {
      // The hero's bottom is the headline's home — when the hero is short
      // the title fills its lower half, so the hero gets no location label
      // at all; the other panels keep theirs.
      const shortHero = i === 0 && panel.h < H * 0.8 && state.captionPosition === 'bottom';
      if (shortHero) return;
      // The hero's bottom is the headline's home — keep its location label
      // up at 62% of the hero height so the title never covers it.
      const labelY = i === 0
        ? panel.y + Math.round(panel.h * 0.62)
        : panel.y + panel.h - pad - Math.round(H * 0.045);
      placeLabel(ctx, meta.place, meta.time, panel.x + panel.w - pad, labelY, H, 'right');
    }
  });
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
  ctx.filter = photoFilter(state.grade, state.contrast, state.saturation);
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

  gradeWash(ctx, state.grade, state.strength, W, H);

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

  drawPanelFurniture(ctx, state, panels, W, H);

  // HEAT badge: on the six-panel magazine grid it sits at the frame's
  // top-right corner, over the first stacked panel — exactly where
  // HEATWAVE puts it. Other layouts keep the r8 placement (hero-anchored,
  // or the last strip panel when the hero is short).
  if (state.heatBadge && panels[0]) {
    if (state.layout === 'magazine') {
      heatBadge(ctx, W - Math.round(W * 0.015), Math.round(H * 0.03), H);
    } else {
      const shortHero = panels[0].h < H * 0.8;
      if (shortHero && panels[1]) {
        // The badge is wider than one strip panel and the role tags sit at
        // the strip's top — so park it mid-height of the last strip panel,
        // right-aligned, over open photo area.
        const last = panels[panels.length - 1];
        heatBadge(ctx, W - Math.round(W * 0.015), last.y + Math.round(last.h * 0.45), H);
      } else {
        const badgeY = state.wantedStars > 0
          ? panels[0].y + Math.round(H * 0.165)
          : panels[0].y + Math.round(H * 0.03);
        heatBadge(ctx, panels[0].x + panels[0].w - Math.round(W * 0.015), badgeY, H);
      }
    }
  }
  if (state.hotSeal && panels.length > 1 && panels[1]) {
    // Keep the seal disc fully inside its panel — never clipped at an edge.
    // On the six-panel grid the stacked panels are short, so a full-size
    // seal would swallow the role tag: shrink it and park it bottom-left,
    // clear of the tag above and the place label at bottom-right.
    const p1 = panels[1];
    if (p1.h < H * 0.25) {
      const sealR = Math.max(16, Math.round(Math.min(H * 0.055, p1.h * 0.26)));
      hotSeal(ctx, p1.x + sealR + Math.round(W * 0.006), p1.y + p1.h - sealR - Math.round(H * 0.012), sealR);
    } else {
      const sealR = Math.max(18, Math.round(H * 0.055));
      const sx = Math.max(p1.x + sealR, p1.x + Math.round(p1.w * 0.12));
      const sy = Math.max(p1.y + sealR, p1.y + Math.round(p1.h * 0.5));
      hotSeal(ctx, sx, sy, sealR);
    }
  }

  if (state.quote) drawQuote(ctx, state, W, H, panels[0]);
  drawHeadline(ctx, state, W, H, panels[0]);
  drawStickers(ctx, state, W, H);
  if (state.bottomStrip) drawBottomStrip(ctx, state, W, H);

  // EST. 2026 seal: bottom-left of the hero — but when the hero is short
  // and the headline sits at its bottom, park the seal mid-hero instead so
  // the title never covers it.
  if (panels[0]) {
    const shortHero = panels[0].h < H * 0.8 && state.captionPosition === 'bottom';
    const sealY = shortHero
      ? panels[0].y + Math.round(panels[0].h * 0.5)
      : panels[0].y + panels[0].h - Math.round(H * 0.16);
    estSeal(ctx, panels[0].x + Math.round(W * 0.045), sealY, Math.max(16, Math.round(H * 0.042)));
  }

  // Wanted stars sit above everything else so they are never covered —
  // anchored to the hero panel's top-right, not the frame corner. r9: the
  // main cover defaults to 0, so this draws nothing there; only a shot
  // URL that explicitly passes &stars= (the portrait/square variants)
  // draws a pill.
  drawWantedStars(ctx, W, H, state.wantedStars, panels[0] ? panels[0].x + panels[0].w - Math.round(W * 0.015) : undefined);

  if (state.halftone) halftone(ctx, W, H);
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
