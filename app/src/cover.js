// VICE PURSUIT — cover engine (rebuild r10, four-variant edition).
//
// Plain canvas, no libraries, no network. One draw routine paints the live
// preview and the full-resolution export, so what you see is exactly what
// the PNG holds. The look imitates the SUNSET SYNDICATE reference Sand
// named: a multi-panel photo collage, a giant gradient headline in a band
// across the middle of the grid, a small YELLOW label pill on every panel,
// a gold round seal, a COMING SOON corner badge, and a bottom strip with a
// small-star quote, a production line and a barcode.
//
// Rebuild r10 changes, per Sand's expanded brief (four variants, not one):
//  - FOUR cover variants, each a full collage in the same SUNSET SYNDICATE
//    grid language, each with FIVE distinct photographs — a different hero,
//    mood, weather and location per panel, and different across variants
//    where possible. Sunset Chase (sunny chase hero + neon driver + rainy
//    fixer + canyon getaway + Everglades wildcard), Neon Nights (neon strip
//    + blonde charmer + rooftop + palm boulevard + classic muscle), Golden
//    Coast (sunny coast + beach + misty pier + vintage Cadillac + modern
//    sunset racer), Full Throttle (modern + classic duo + biker + garage
//    mechanic + harbour + desert). Modern AND classic cars both appear,
//    and every variant carries the same VICE PURSUIT / Coastline Nights
//    title. The old magazine / five / hero layouts stay as legacy options.
//  - THE TITLE NEVER COVERS A SUBJECT. The headline lives in its own dark
//    band between the two panel rows — a real gap in the grid, not paint
//    over a photo — so the orange Lambo, the red/black Ducati, the police
//    cars and every face stay fully visible. Sand's hard rule, by
//    construction: no photo pixel sits under the title band.
//  - THE DRIVER IS NEVER CROPPED. Both driver photographs were shot in
//    this session framed from mid-torso up with clear sky above the hair,
//    and their smart crops keep the whole head in frame (oy pulls the
//    window up, never down). The yellow pill sits at the panel's
//    bottom-left, over her jacket — never over her face.
//  - Yellow label pills on EVERY panel (role only, like the reference),
//    a gold CERTIFIED NO.1 round seal inside the title band, a COMING SOON
//    badge at the top-left corner, and a cream bottom strip carrying the
//    five small quote stars, the production line, the strip text and the
//    barcode. Story count is now FIVE STORIES per variant.
//  - Stars discipline, every variant: the HEAT pill reads ★★★★☆ (four
//    filled, one empty) and the quote strip keeps its five small stars.
//    The big wanted-stars pill is still OFF by default (wantedStars 0);
//    only a shot URL that explicitly passes &stars= turns it back on.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080 (post)' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350 (story)' },
  landscape: { w: 1920, h: 1080, label: '1920 × 1080 (wide)' },
};

export const LAYOUTS = {
  sunset: { label: 'Sunset Chase', panels: 5, hint: 'Hero chase wide top-left, driver top-right, fixer / getaway / wildcard below' },
  neon: { label: 'Neon Nights', panels: 5, hint: 'Strip, charmer and rooftop on top; boulevard wide + classic muscle below' },
  coast: { label: 'Golden Coast', panels: 5, hint: 'Coast, beach and lookout on top; classic wide + sunset racer below' },
  throttle: { label: 'Full Throttle', panels: 5, hint: 'Duo + rider wide on top; mechanic, harbour and desert below' },
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

/** The four variants, in showcase order. Each lists its five scene keys in
 *  panel order (panel 1 is the lead photo), its grade and its strip line.
 *  main.js holds the matching photo catalogue. */
export const VARIANTS = {
  sunset: {
    label: 'Sunset Chase', grade: 'golden',
    panels: ['chase', 'driver-new', 'rain', 'canyon', 'everglades'],
    strip: 'ONE COASTLINE · FIVE STORIES · NO CURFEW',
  },
  neon: {
    label: 'Neon Nights', grade: 'neon',
    panels: ['strip', 'driver2', 'rooftop', 'palm-night', 'classic-muscle'],
    strip: 'ONE CITY · FIVE STORIES · LIGHTS NEVER OFF',
  },
  coast: {
    label: 'Golden Coast', grade: 'golden',
    panels: ['coast', 'beach', 'pier', 'vintage-caddy', 'modern-sunset'],
    strip: 'ONE COASTLINE · FIVE STORIES · SALT IN THE AIR',
  },
  throttle: {
    label: 'Full Throttle', grade: 'vice',
    panels: ['sunset-duo', 'biker', 'garage', 'harbor', 'desert'],
    strip: 'ONE COASTLINE · FIVE STORIES · FULL THROTTLE',
  },
};

export const VARIANT_ORDER = ['sunset', 'neon', 'coast', 'throttle'];

/** A fresh default state: Sunset Chase, Golden Hour, the five chase photos,
 *  VICE PURSUIT headline, all magazine furniture switched on — except the
 *  big wanted-stars pill, which is off by default in r10 as in r9 (it does
 *  not exist in SUNSET SYNDICATE either). */
export function defaultState() {
  return {
    layout: 'sunset',
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
    // GTA wanted level: 0 = off. The big pill is OFF by default — it does
    // not exist in the reference. Only a shot URL that explicitly passes
    // &stars= turns it back on.
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
    stripText: 'ONE COASTLINE · FIVE STORIES · NO CURFEW',
    billingText: 'A VICE PURSUIT PICTURE · STARRING YOUR CREW · SHOT ON YOUR OWN CAMERA · INKED BY HAND IN THE STUDIO',
    // Stickers placed on the cover: { type, x, y, scale } in fractions of W/H.
    stickers: [],
    // One slot per panel of the current layout; a slot holds
    // { img, zoom, ox, oy, fit } or null when the panel is empty.
    panels: [null, null, null, null, null],
  };
}

/** True for the four r10 variant grids (collage + title band). */
export function isVariant(layout) {
  return layout === 'sunset' || layout === 'neon' || layout === 'coast' || layout === 'throttle';
}

/** The title band between the two panel rows, for a variant layout at W × H.
 *  Returns { x, y, w, h } — the dark strip the headline lives in. The band
 *  is a real gap in the grid: no photo is ever drawn under it, so the title
 *  can be giant without covering a single car, bike or face. */
export function titleBandRect(layout, W, H) {
  if (!isVariant(layout)) return null;
  const g = Math.max(4, Math.round(W * 0.008));
  const stripH = Math.round(H * 0.085);
  const bodyH = H - stripH - g;
  const bandH = Math.round(H * 0.235);
  const rowH = (bodyH - bandH - g) / 2;
  return { x: 0, y: rowH + g, w: W, h: bandH };
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
  if (isVariant(layout)) {
    // Four r10 variants, one shared 3-unit grid: two panel rows with the
    // title band between them, and a cream billing strip along the bottom.
    // Each variant splits its rows differently, so no two covers share a
    // silhouette: sunset = hero wide top-left; neon = wide panel
    // bottom-left; coast = wide panel bottom-right; throttle = hero wide
    // top-right. Every variant is five photographs, five stories.
    const stripH = Math.round(H * 0.085);
    const bodyH = H - stripH - g;
    const bandH = Math.round(H * 0.235);
    const rowH = (bodyH - bandH - g) / 2;
    const bandY = rowH + g;
    const botY = bandY + bandH + g;
    const colW = (W - 2 * g) / 3;
    const x1 = colW + g;
    const x2 = 2 * (colW + g);
    const wide2 = 2 * colW + g;
    const top3 = [rect(0, 0, colW, rowH), rect(x1, 0, colW, rowH), rect(x2, 0, colW, rowH)];
    const bot3 = [rect(0, botY, colW, rowH), rect(x1, botY, colW, rowH), rect(x2, botY, colW, rowH)];
    if (layout === 'sunset') {
      return [rect(0, 0, wide2, rowH), rect(x2, 0, colW, rowH), ...bot3];
    }
    if (layout === 'neon') {
      return [...top3, rect(0, botY, wide2, rowH), rect(x2, botY, colW, rowH)];
    }
    if (layout === 'coast') {
      return [...top3, rect(0, botY, colW, rowH), rect(x1, botY, wide2, rowH)];
    }
    // throttle: hero wide top-right, three equal below.
    return [rect(0, 0, colW, rowH), rect(x1, 0, wide2, rowH), ...bot3];
  }
  // Fallback: the old magazine grid (hero left, five stacked right).
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
  if (isVariant(layout)) {
    // Variant grids: a neon line only where two panels actually meet.
    // A wide panel spans two unit columns, so the seam inside it is NOT
    // a boundary — drawing one there would cut straight through a photo
    // (r10 first pass did exactly that on the wide chase / rider / racer
    // panels). Derive the seams from the panels themselves: group by row,
    // and every panel that starts right of the frame edge contributes one
    // seam at its left edge, running that row's full height.
    const band = titleBandRect(layout, W, H);
    const panels = layoutPanels(layout, W, H);
    const divs = [];
    const rows = {};
    for (const p of panels) {
      (rows[p.y] ||= []).push(p);
    }
    for (const y of Object.keys(rows)) {
      const row = rows[y];
      const rowH = row[0].h;
      for (const p of row) {
        if (p.x <= 0) continue;
        const sx = p.x - g / 2;
        divs.push([[sx, Number(y)], [sx, Number(y) + rowH]]);
      }
    }
    return divs;
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
  // Clamp the pan offsets so the photo always covers its panel: a large
  // oy on a short row panel would otherwise slide the photo out and leave
  // a dark band. The clamp is in panel fractions, from the photo's own
  // excess height / width at this zoom.
  const maxOx = dw > w ? (dw - w) / (2 * w) : 0;
  const maxOy = dh > h ? (dh - h) / (2 * h) : 0;
  const ox = Math.max(-maxOx, Math.min(maxOx, slot.ox || 0));
  const oy = Math.max(-maxOy, Math.min(maxOy, slot.oy || 0));
  const dx = x + (w - dw) / 2 + ox * w;
  const dy = y + (h - dh) / 2 + oy * h;
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
 *  export size. r10: every variant defaults to 0, so the main covers never
 *  draw this — the big pill does not exist in SUNSET SYNDICATE. Only a
 *  shot URL that explicitly passes &stars= turns it back on. */
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

/** YELLOW label pill, like the reference: gold-yellow fill, dark text, a
 *  thin dark outline. One on EVERY panel, bottom-left corner — over the
 *  least-critical corner of the photo, never over a face (the DRIVER pill
 *  sits over her jacket, well below her chin). */
function tagPill(ctx, text, x, y, H, align = 'left') {
  const fs = Math.max(12, Math.round(H * 0.024));
  ctx.font = `${fs}px ${BODY_FONT}`;
  const padX = Math.round(fs * 0.75);
  const padY = Math.round(fs * 0.42);
  const tw = ctx.measureText(text).width;
  const bx = align === 'right' ? x - tw - padX * 2 : x;
  ctx.save();
  ctx.fillStyle = '#ffc93c';
  ctx.strokeStyle = 'rgba(10,4,20,0.9)';
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

/** Location + time label: dark pill, white place, gold time. Legacy
 *  layouts only — the variant grids use the yellow role pill alone,
 *  exactly like the reference. */
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
 *  pill, no gold fill. In r10 it lives inside the title band at the left
 *  end, so it never covers a photo. Stars exist in exactly two small
 *  places on the cover: this pill and the five small stars of the quote
 *  strip. */
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

/** HOT seal: a gold starburst disc with HOT in the middle. Legacy layouts
 *  only — the variant grids use the CERTIFIED NO.1 seal in the title band. */
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

/** Gold CERTIFIED NO.1 round seal, reference style: a serrated gold disc,
 *  a thin inner ring, CERTIFIED on top, a star, NO.1 below. Drawn inside
 *  the title band at the right end — it never touches a photo. */
function certifiedSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const spikes = 16;
  for (let i = 0; i < spikes * 2; i++) {
    const rr = i % 2 === 0 ? r : r * 0.86;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const px = rr * Math.cos(a);
    const py = rr * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#ffe98a');
  grad.addColorStop(0.6, '#ffc93c');
  grad.addColorStop(1, '#e09c00');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(10,4,20,0.85)';
  ctx.lineWidth = Math.max(2, Math.round(r * 0.05));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(10,4,20,0.75)';
  ctx.lineWidth = Math.max(1, Math.round(r * 0.04));
  ctx.stroke();
  ctx.fillStyle = '#14061f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // CERTIFIED is nine wide caps: keep it small enough to sit inside the
  // inner ring (r*0.30 overflowed the disc on every variant in r10's
  // first screenshots).
  ctx.font = `${Math.round(r * 0.20)}px ${BODY_FONT}`;
  ctx.fillText('CERTIFIED', 0, -Math.round(r * 0.38));
  starPath(ctx, 0, 0, Math.round(r * 0.24));
  ctx.fillStyle = '#14061f';
  ctx.fill();
  ctx.font = `${Math.round(r * 0.34)}px ${BODY_FONT}`;
  ctx.fillText('NO.1', 0, Math.round(r * 0.42));
  ctx.restore();
}

/** COMING SOON corner badge, reference style: a hot-pink pill, white
 *  caps, slightly tilted, parked on the frame's top-left corner over the
 *  first panel's sky — the least-critical corner of the cover. */
function comingSoonBadge(ctx, W, H) {
  const fs = Math.max(12, Math.round(H * 0.026));
  ctx.save();
  ctx.font = `${fs}px ${BODY_FONT}`;
  const text = 'COMING SOON';
  const tw = ctx.measureText(text).width;
  const padX = Math.round(fs * 0.9);
  const padY = Math.round(fs * 0.5);
  // Centre the pill far enough right that it never clips the frame edge:
  // on narrow portrait/square frames W*0.085 is less than half the pill.
  const cx = Math.max(Math.round(W * 0.085), Math.round(tw / 2 + padX + 10));
  ctx.translate(cx, Math.round(H * 0.038));
  ctx.rotate(-0.06);
  ctx.fillStyle = '#ff2e88';
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(1, Math.round(fs * 0.08));
  ctx.beginPath();
  ctx.roundRect(-tw / 2 - padX, -fs / 2 - padY, tw + padX * 2, fs + padY * 2, Math.round(fs * 0.5));
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);
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

/** The title band: dark gradient, gold rules top and bottom, the giant
 *  VICE PURSUIT headline, the pink script subtitle, the HEAT ★★★★☆ pill
 *  at the left end and the gold CERTIFIED NO.1 seal at the right end.
 *  Everything in this function draws INSIDE the band rect — it never
 *  touches a photo, so the title can be as giant as it wants. The headline
 *  auto-fits both the band height and the free width between the pill and
 *  the seal. */
function drawTitleBand(ctx, state, W, H, band) {
  const { x, y, w, h } = band;
  ctx.save();
  // Dark band: deep violet-black, slightly lighter in the middle.
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, '#1a0b26');
  bg.addColorStop(0.5, '#241031');
  bg.addColorStop(1, '#12081c');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  // Gold rules, top and bottom.
  ctx.fillStyle = 'rgba(255,201,60,0.9)';
  ctx.fillRect(x, y, w, Math.max(2, Math.round(h * 0.02)));
  ctx.fillRect(x, y + h - Math.max(2, Math.round(h * 0.02)), w, Math.max(2, Math.round(h * 0.02)));

  const text = (state.caption || '').trim().toUpperCase();
  const color = (CAPTION_COLORS[state.captionColor] || CAPTION_COLORS.gradient).value;
  // The seal takes the right end, the HEAT pill the left: the headline
  // gets the middle ~62% of the width, at most ~72% of the band height.
  const sealR = Math.round(h * 0.40);
  const sealCX = x + w - Math.round(W * 0.035) - sealR;
  const sealCY = y + h / 2;
  // The HEAT pill is right-anchored: its right edge sits at the left
  // margin plus its own width (~0.30 × H), so it never clips the frame.
  const pillRight = Math.round(W * 0.02) + Math.round(H * 0.30);
  const maxW = Math.max(200, sealCX - sealR - pillRight - Math.round(W * 0.04));
  const maxH = h * 0.66;
  let size = Math.round(maxH);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const fit = (s) => {
    ctx.font = `${s}px ${CAPTION_FONT}`;
    return ctx.measureText(text).width;
  };
  while (size > 24 && (fit(size) > maxW || size > maxH)) size = Math.round(size * 0.94);
  ctx.font = `${size}px ${CAPTION_FONT}`;
  const sub = (state.subcaption || '').trim();
  const subSize = Math.max(16, Math.round(size * 0.30));
  // Headline baseline: leave the script room underneath, inside the band.
  const blockH = size + (sub ? Math.round(subSize * 1.15) : 0);
  const baseY = y + (h - blockH) / 2 + size * 0.92;
  const cx = (pillRight + (sealCX - sealR)) / 2;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
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
    // Script subtitle: slanted, pink, tucked under the headline's right
    // half — inside the band, never over a photo.
    const subY = baseY + Math.round(subSize * 1.05);
    ctx.save();
    ctx.translate(cx + Math.round(size * 0.9), subY);
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

  // HEAT pill at the band's left end, seal at the right end.
  if (state.heatBadge) {
    heatBadge(ctx, Math.round(W * 0.02) + Math.round(H * 0.30), y + h / 2 - Math.round(H * 0.028), H);
  }
  if (state.hotSeal) certifiedSeal(ctx, sealCX, sealCY, sealR);
  ctx.restore();
}

/** Legacy headline for the five / hero layouts: the giant title across the
 *  lower hero, as in r9. Variant layouts never call this — their title
 *  lives in the band. */
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
  const heroBottom = hero ? hero.y + hero.h : H;
  const blockBottom = top
    ? pad + size + (sub ? gap + subSize : 0)
    : Math.min(H - pad - Math.round(H * 0.045), heroBottom - Math.round(H * 0.02));
  const baseY = top ? pad + size : blockBottom - (sub ? gap + subSize : 0);
  const cx = W / 2;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
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

/** Cream bottom strip, reference style: a small-star quote line on top
 *  (five small gold stars — the second of the cover's two star places),
 *  then the strip text, the billing line and a barcode along the bottom.
 *  The strip is furniture, never a photo panel. */
function drawBottomStrip(ctx, state, W, H) {
  const stripH = Math.round(H * 0.085);
  const y0 = H - stripH;
  ctx.save();
  const g = ctx.createLinearGradient(0, y0, W, y0);
  g.addColorStop(0, '#fff6df');
  g.addColorStop(0.5, '#ffeec2');
  g.addColorStop(1, '#ffd98a');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, stripH);
  ctx.fillStyle = 'rgba(10,4,20,0.85)';
  ctx.fillRect(0, y0, W, Math.max(2, Math.round(stripH * 0.05)));
  // Quote line: five small gold stars + quoted line + source, centred.
  // Shrink the font until the line fits the frame — on narrow portrait
  // frames the full-size line ran off the right edge (r10 first pass).
  if (state.quote) {
    const quote = (state.quoteText || '').trim();
    let fs = Math.max(11, Math.round(stripH * 0.30));
    let line = '';
    for (;;) {
      ctx.font = `${fs}px ${BODY_FONT}`;
      line = `★★★★★  "${quote.toUpperCase()}" — ${state.quoteSource || 'THE PALM GAZETTE'}`;
      if (ctx.measureText(line).width <= W * 0.96 || fs <= 10) break;
      fs = Math.round(fs * 0.92);
    }
    const tw = ctx.measureText(line).width;
    const x = Math.max(Math.round(W * 0.02), (W - tw) / 2);
    const y = y0 + stripH * 0.36;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c98a00';
    ctx.fillText('★★★★★', x, y);
    const starW = ctx.measureText('★★★★★').width;
    ctx.fillStyle = '#14061f';
    ctx.fillText(`  "${quote.toUpperCase()}" — ${state.quoteSource || 'THE PALM GAZETTE'}`, x + starW, y);
  }
  // Bottom row: strip text left, billing centre, barcode + VOL right.
  const bfs = Math.max(9, Math.round(stripH * 0.22));
  const bw = Math.round(W * 0.075);
  const bcX = W - bw - Math.round(W * 0.015);
  ctx.font = `${bfs}px ${BODY_FONT}`;
  const volW = ctx.measureText('VOL. 06').width;
  const gap = Math.round(W * 0.02);
  const volX = bcX - gap - volW;
  ctx.font = `${bfs}px ${SUB_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#14061f';
  let strip = (state.stripText || '').toUpperCase();
  const maxStrip = volX - gap - Math.round(W * 0.02);
  while (strip.length > 4 && ctx.measureText(strip).width > maxStrip) strip = strip.slice(0, -1);
  if (strip !== (state.stripText || '').toUpperCase()) strip = strip.replace(/[^A-Z0-9 ]*$/, '') + '…';
  ctx.fillText(strip, Math.round(W * 0.02), y0 + stripH * 0.78);
  barcode(ctx, bcX, y0 + stripH * 0.60, bw, stripH * 0.34);
  ctx.fillStyle = '#14061f';
  ctx.textAlign = 'right';
  ctx.font = `${bfs}px ${BODY_FONT}`;
  ctx.fillText('VOL. 06', volX, y0 + stripH * 0.78);
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

// One row per panel: the yellow role pill's text. Five panels, five
// different stories per variant — a different hero, mood, weather and
// location in every panel, and different across the four variants. The
// hero Lambo + Ducati chase leads Sunset Chase; Neon Nights pairs a
// classic muscle car with the blonde charmer; Golden Coast pairs a
// vintage Cadillac with a modern sunset racer; Full Throttle puts the
// modern supercar and the classic muscle car side by side in one frame.
const PANEL_META = {
  sunset: [
    { role: 'THE RIDE', place: 'CORAL CAUSEWAY', time: '7:15 PM' },
    { role: 'THE DRIVER', place: 'OCEAN DRIVE', time: '6:40 PM' },
    { role: 'THE FIXER', place: 'VICE PORT', time: '11:58 PM' },
    { role: 'THE GETAWAY', place: 'RED ROCK PASS', time: '6:02 PM' },
    { role: 'THE WILDCARD', place: 'GATOR FLATS', time: '5:31 PM' },
  ],
  neon: [
    { role: 'THE STRIP', place: 'OCEAN DRIVE', time: '11:47 PM' },
    { role: 'THE CHARMER', place: 'COLADA ROW', time: '10:15 PM' },
    { role: 'THE ROOFTOP', place: 'SKYLINE HOTEL', time: '1:20 AM' },
    { role: 'THE BOULEVARD', place: 'PALM ROW', time: '12:05 AM' },
    { role: 'THE CLASSIC', place: 'VICE PORT', time: '9:40 PM' },
  ],
  coast: [
    { role: 'THE COAST', place: 'SUNNY SHORES', time: '10:30 AM' },
    { role: 'THE BEACH', place: 'PALM BEACH', time: '11:05 AM' },
    { role: 'THE LOOKOUT', place: 'MISTY PIER', time: '6:12 AM' },
    { role: 'THE CLASSIC', place: 'BAYSIDE', time: '4:45 PM' },
    { role: 'THE RACER', place: 'COAST HIGHWAY', time: '5:50 PM' },
  ],
  throttle: [
    { role: 'THE DUO', place: 'COAST HIGHWAY', time: '6:20 PM' },
    { role: 'THE RIDER', place: 'SUNSET STRIP', time: '6:55 PM' },
    { role: 'THE MECHANIC', place: 'BACKSTREET GARAGE', time: '8:10 PM' },
    { role: 'THE HARBOR', place: 'VICE PORT', time: '7:30 PM' },
    { role: 'THE DESERT', place: 'RED ROCK PASS', time: '12:40 PM' },
  ],
};

/** Yellow role pills for each panel. Variant grids: the yellow pill alone,
 *  bottom-left, exactly like the reference. Legacy layouts keep the old
 *  white role tag + bottom location label. */
function drawPanelFurniture(ctx, state, panels, W, H) {
  panels.forEach((panel, i) => {
    if (panel.w < W * 0.15 || panel.h < H * 0.12) return;
    const meta = (PANEL_META[state.layout] || [])[i];
    if (!meta) return;
    const pad = Math.max(6, Math.round(W * 0.008));
    if (state.roleTags) {
      if (isVariant(state.layout)) {
        // Yellow pill, bottom-left. The pill is small and low: on the
        // DRIVER panels it sits over her jacket, never over her face.
        const fs = Math.max(12, Math.round(H * 0.024));
        const pillH = fs + Math.round(fs * 0.42) * 2;
        tagPill(ctx, meta.role, panel.x + pad, panel.y + panel.h - pad - pillH, H, 'left');
      } else {
        tagPill(ctx, meta.role, panel.x + pad, panel.y + pad, H, 'left');
      }
    }
    if (state.locationLabels && !isVariant(state.layout)) {
      const shortHero = i === 0 && panel.h < H * 0.8 && state.captionPosition === 'bottom';
      if (shortHero) return;
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
 *
 * Variant covers: five photos in two rows, the title band between them
 * (headline + script + HEAT pill + gold seal, all inside the band), the
 * COMING SOON badge at the top-left corner, and the cream strip at the
 * bottom. No title text ever touches a photo.
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

  if (isVariant(state.layout)) {
    // The title band: headline, script, HEAT pill and gold seal, all
    // inside the gap between the rows — nothing here covers a photo.
    const band = titleBandRect(state.layout, W, H);
    if (band) drawTitleBand(ctx, state, W, H, band);
    comingSoonBadge(ctx, W, H);
  } else {
    // Legacy layouts: HEAT badge top-right, HOT seal on the second panel,
    // headline across the lower hero, as in r9.
    if (state.heatBadge && panels[0]) {
      const shortHero = panels[0].h < H * 0.8;
      if (shortHero && panels[1]) {
        const last = panels[panels.length - 1];
        heatBadge(ctx, W - Math.round(W * 0.015), last.y + Math.round(last.h * 0.45), H);
      } else {
        const badgeY = state.wantedStars > 0
          ? panels[0].y + Math.round(H * 0.165)
          : panels[0].y + Math.round(H * 0.03);
        heatBadge(ctx, panels[0].x + panels[0].w - Math.round(W * 0.015), badgeY, H);
      }
    }
    if (state.hotSeal && panels.length > 1 && panels[1]) {
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
    drawHeadline(ctx, state, W, H, panels[0]);
  }

  drawStickers(ctx, state, W, H);
  if (state.bottomStrip) drawBottomStrip(ctx, state, W, H);

  // Wanted stars sit above everything else so they are never covered —
  // anchored to the first panel's top-right. r10: every variant defaults
  // to 0, so this draws nothing on the covers; only a shot URL that
  // explicitly passes &stars= draws a pill.
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
