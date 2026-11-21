// GOLDEN MILE — the cover itself: what a VICE PURSUIT cover is, where
// everything sits, and how it gets painted onto a canvas.
//
// A cover is a magazine collage. Top: a thin masthead strip. Below it a
// five-column photo grid, two rows tall, with one big hero close-up in
// the centre column spanning both rows and one tall panel filling the
// right-hand column. Across the middle, low on the hero's chest and
// clear of his chin, a title band of its own: the big block title, a
// pink script subhead underneath it, and a gold ribbon line. Bottom:
// a COMING SOON strip with credits and a barcode, plus a gold BEST
// SELLER seal overlapping the grid's lower-right corner.
//
// Two render paths share this file. The live DOM preview (main.js)
// reads the same tables and the same layout fractions, so the editor
// and the exported PNG can never drift apart.

export const COVER_TITLE = 'VICE PURSUIT';
export const COVER_SUBHEAD = 'Coastline Nights';
export const COVER_RIBBON = 'ONE COASTLINE · FIVE STORIES · NO CURFEW';
export const COVER_TAGLINE = 'THE HOTTEST RIDE OF THE YEAR';
export const COVER_GAZETTE = 'VICE CITY GAZETTE';
export const COVER_CREDITS = 'GOLDEN MILE PICTURES  ·  A VICE CITY STORY';

// The eight photos that make one cover: the hero in the middle and one
// panel per role. fx/fy marks the point the crop centres on — a face,
// a car, a bike — as a fraction of the photo's own width/height.
export const COVER_PANELS = [
  { role: 'THE DRIVER', file: 'vice-driver.jpg', fx: 0.8, fy: 0.38 },
  { role: 'THE FIXER', file: 'vice-fixer.jpg', fx: 0.74, fy: 0.22 },
  { role: 'HERO', file: 'crime-insider.jpg', fx: 0.56, fy: 0.4 },
  { role: 'THE SMUGGLER', file: 'vice-everglades.jpg', fx: 0.3, fy: 0.6 },
  { role: 'THE BOSS', file: 'dark-market.jpg', fx: 0.5, fy: 0.44 },
  { role: 'THE RIDER', file: 'runners-rider.jpg', fx: 0.68, fy: 0.38 },
  { role: 'THE GETAWAY', file: 'vice-chase.jpg', fx: 0.38, fy: 0.56 },
  { role: 'THE LOOKOUT', file: 'crime-lookout.jpg', fx: 0.5, fy: 0.28 },
];

// Where each panel lives in the 5 x 2 grid. Columns and rows are
// 1-based. The hero takes the whole centre column; the boss takes the
// whole right-hand column; everyone else takes a single cell.
export const COVER_GRID = {
  'THE DRIVER': { col: 1, row: 1, cols: 1, rows: 1 },
  'THE FIXER': { col: 2, row: 1, cols: 1, rows: 1 },
  HERO: { col: 3, row: 1, cols: 1, rows: 2 },
  'THE SMUGGLER': { col: 4, row: 1, cols: 1, rows: 1 },
  'THE BOSS': { col: 5, row: 1, cols: 1, rows: 2 },
  'THE RIDER': { col: 1, row: 2, cols: 1, rows: 1 },
  'THE GETAWAY': { col: 2, row: 2, cols: 1, rows: 1 },
  'THE LOOKOUT': { col: 4, row: 2, cols: 1, rows: 1 },
};

// Five colour grades. `filter` is a CSS/canvas filter string applied to
// each photo, `wash` a translucent tint painted over it, and `title`
// the two stops of the big title gradient for that grade.
export const COVER_GRADES = {
  golden: {
    label: 'Golden Hour',
    filter: 'saturate(1.28) contrast(1.07) sepia(0.26) brightness(1.02)',
    wash: 'rgba(255,140,40,0.10)',
    title: ['#ff2e88', '#ffb03a'],
  },
  neon: {
    label: 'Neon Nights',
    filter: 'saturate(1.65) contrast(1.12) hue-rotate(-14deg) brightness(1.0)',
    wash: 'rgba(255,0,120,0.10)',
    title: ['#ff2ea6', '#ff5e3a'],
  },
  dusk: {
    label: 'Dusk Purple',
    filter: 'saturate(1.18) contrast(1.06) hue-rotate(16deg) brightness(0.94)',
    wash: 'rgba(96,44,168,0.14)',
    title: ['#ff4fa3', '#c77dff'],
  },
  vice: {
    label: 'Vice Teal',
    filter: 'saturate(1.38) contrast(1.1) brightness(1.01)',
    wash: 'rgba(0,205,180,0.08)',
    title: ['#ff2e88', '#2ee6c8'],
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(0.55) contrast(1.28) brightness(0.96)',
    wash: 'rgba(0,0,0,0.08)',
    title: ['#ff5c8a', '#ffd23e'],
  },
};

export const COVER_GRADE_IDS = Object.keys(COVER_GRADES);

// The three post sizes the bounty asks for.
export const COVER_SIZES = {
  square: { label: 'Square · 1080 × 1080', width: 1080, height: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', width: 1080, height: 1350 },
  landscape: { label: 'Wide · 1920 × 1080', width: 1920, height: 1080 },
};

// Per-size crop tweaks, as deltas on a panel's own fx/fy/zoom. The
// portrait DRIVER cell is much narrower than the square one, so her
// default face point (fx 0.8) puts her nose right on the cell's left
// edge; in portrait only, pull the crop back a touch so her whole face
// sits inside the frame with margin. Deltas, not absolutes, so dragging
// a panel in the editor still moves it and every other panel and size
// keeps its default crop exactly.
export const COVER_CROP_TWEAKS = {
  portrait: {
    // -0.02 moved her nose from cut to ~3 px inside the edge (measured
    // on the render); -0.04 left the nose ~3 px and the lips ~2 px from
    // the edge — visible but tighter than the square renders. -0.05
    // puts the nose ~10 px inside, matching the square renders, with
    // the ear still ~13 px clear of the right edge.
    'THE DRIVER': { fx: -0.05 },
  },
};

// The crop that actually applies to one panel at one post size.
export function coverPanelCrop(panel, sizeId) {
  const tweak = COVER_CROP_TWEAKS[sizeId]?.[panel.role];
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  return {
    fx: clamp01(panel.fx + (tweak?.fx ?? 0)),
    fy: clamp01(panel.fy + (tweak?.fy ?? 0)),
    zoom: (panel.zoom || 1) * (tweak?.zoom ?? 1),
  };
}

// A fresh cover: the Golden Mile defaults, golden grade, square size.
export function coverDefaultState() {
  return {
    title: COVER_TITLE,
    script: COVER_SUBHEAD,
    ribbon: COVER_RIBBON,
    grade: 'golden',
    size: 'square',
    panels: COVER_PANELS.map((p) => ({
      role: p.role,
      src: 'samples/' + p.file,
      fx: p.fx,
      fy: p.fy,
      zoom: 1,
      flip: false,
    })),
  };
}

// Cover geometry, all in fractions of the cover width/height, so the
// DOM preview and the canvas export agree exactly.
export function coverLayout(sizeId) {
  const wide = sizeId === 'landscape';
  const tall = sizeId === 'portrait';
  return {
    masthead: { x: 0, y: 0, w: 1, h: wide ? 0.052 : tall ? 0.042 : 0.05 },
    grid: {
      x: 0.008,
      y: wide ? 0.062 : tall ? 0.05 : 0.058,
      w: 0.984,
      h: wide ? 0.86 : tall ? 0.884 : 0.862,
      gap: 0.006,
      cols: [0.16, 0.16, 0.36, 0.16, 0.16],
    },
    // The title band sits low on the hero's chest, below the chin, so
    // the lettering never covers a face; it overlaps only the bottom
    // row of panels, magazine-style. r15f: lowered a touch (Sand 08:42)
    // so the title clears the hero's chin/jaw with daylight to spare.
    titleBand: { x: 0, y: wide ? 0.585 : tall ? 0.625 : 0.615, w: 1, h: 0.24 },
    foot: { x: 0, y: wide ? 0.93 : tall ? 0.942 : 0.928, w: 1, h: 0.072 },
    seal: { x: 0.885, y: wide ? 0.8 : tall ? 0.845 : 0.815, r: wide ? 0.048 : 0.055 },
  };
}

// Pixel rectangle of one grid cell on a cover of W x H.
export function coverCellRect(layout, W, H, role) {
  const g = layout.grid;
  const cell = COVER_GRID[role];
  const colW = (i) => g.cols[i] * g.w * W;
  const rowH = (g.h * H) / 2;
  let x = g.x * W;
  for (let i = 0; i < cell.col - 1; i += 1) x += colW(i) + g.gap * W;
  const y = g.y * H + (cell.row - 1) * (rowH + g.gap * H);
  let w = 0;
  for (let i = 0; i < cell.cols; i += 1) w += colW(cell.col - 1 + i);
  w += (cell.cols - 1) * g.gap * W;
  const h = rowH * cell.rows + (cell.rows - 1) * g.gap * H;
  return { x, y, w, h };
}

// ---- Canvas painting ----------------------------------------------------

const BLOCK_FONT = '"Anton", "Archivo Black", sans-serif';
const LABEL_FONT = '"Archivo Black", sans-serif';
const SCRIPT_FONT = '"Great Vibes", cursive';

// Paint one photo into its cell, cover-fitting around the face point.
function paintPhoto(ctx, img, rect, panel, grade, sizeId) {
  const crop = coverPanelCrop(panel, sizeId);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (crop.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  // Keep the face point at the cell centre as far as the photo allows.
  const cx = crop.fx * dw;
  const cy = crop.fy * dh;
  let dx = rect.x + rect.w / 2 - cx;
  let dy = rect.y + rect.h / 2 - cy;
  dx = Math.min(rect.x, Math.max(rect.x + rect.w - dw, dx));
  dy = Math.min(rect.y, Math.max(rect.y + rect.h - dh, dy));
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = grade.filter;
  if (panel.flip) {
    ctx.translate(rect.x + rect.w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, dx - rect.x - rect.w, dy, dw, dh);
  } else {
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  ctx.filter = 'none';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // Thin gold frame, then the role chip at the panel's bottom-left.
  ctx.strokeStyle = 'rgba(255, 210, 90, 0.85)';
  ctx.lineWidth = Math.max(1.5, rect.w * 0.008);
  ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  if (panel.role === 'HERO') return;
  const fs = Math.max(11, rect.w * 0.085);
  ctx.font = `${fs}px ${LABEL_FONT}`;
  const tw = ctx.measureText(panel.role).width;
  const pad = fs * 0.55;
  const bx = rect.x + rect.w * 0.04;
  // THE BOSS fills the bottom-right corner of the grid, so a
  // bottom-left chip would sit under the gold BEST SELLER seal (the
  // seal spans the panel's whole bottom-left corner) and the ribbon
  // bar leaves no gap above the seal either. Its chip goes top-left
  // instead — same pill, same gold text, fully visible.
  const by =
    panel.role === 'THE BOSS'
      ? rect.y + rect.h * 0.04
      : rect.y + rect.h - fs * 2.1;
  ctx.fillStyle = 'rgba(10, 4, 12, 0.88)';
  ctx.fillRect(bx, by, tw + pad * 2, fs * 1.7);
  ctx.fillStyle = '#ffd23e';
  ctx.textBaseline = 'middle';
  ctx.fillText(panel.role, bx + pad, by + fs * 0.85);
}

function paintBarcode(ctx, x, y, w, h) {
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#14100c';
  let bx = x + w * 0.06;
  const bars = [3, 1, 2, 1, 1, 3, 2, 2, 1, 1, 4, 1, 2, 3, 1, 2, 1, 1, 3, 2];
  for (const b of bars) {
    const bw = w * 0.028 * b;
    ctx.fillRect(bx, y + h * 0.08, bw, h * 0.72);
    bx += bw + w * 0.02;
    if (bx > x + w * 0.94) break;
  }
}

function paintSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const gold = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  gold.addColorStop(0, '#ffe98a');
  gold.addColorStop(0.55, '#f5b81e');
  gold.addColorStop(1, '#a86e00');
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.lineWidth = r * 0.07;
  ctx.strokeStyle = '#7a4d00';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
  ctx.lineWidth = r * 0.04;
  ctx.strokeStyle = 'rgba(122, 77, 0, 0.8)';
  ctx.stroke();
  ctx.fillStyle = '#4d2f00';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.42}px ${LABEL_FONT}`;
  ctx.fillText('★ BEST ★', cx, cy - r * 0.2);
  ctx.font = `${r * 0.34}px ${LABEL_FONT}`;
  ctx.fillText('SELLER', cx, cy + r * 0.26);
  ctx.restore();
}

// Paint the whole cover onto ctx at W x H.
// `images` maps a panel src to a loaded HTMLImageElement.
export function paintCover(ctx, state, images, W, H) {
  const grade = COVER_GRADES[state.grade] || COVER_GRADES.golden;
  const layout = coverLayout(state.size);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#160a12';
  ctx.fillRect(0, 0, W, H);

  // Photo grid.
  for (const panel of state.panels) {
    const img = images[panel.src];
    if (!img) continue;
    paintPhoto(ctx, img, coverCellRect(layout, W, H, panel.role), panel, grade, state.size);
  }

  // Masthead strip.
  const mh = layout.masthead.h * H;
  ctx.fillStyle = '#12060d';
  ctx.fillRect(0, 0, W, mh);
  ctx.fillStyle = '#ffd23e';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const mfs = mh * 0.42;
  ctx.font = `${mfs}px ${LABEL_FONT}`;
  ctx.fillText('★★★★★', W * 0.018, mh * 0.52);
  ctx.fillStyle = '#f5f0e6';
  ctx.font = `${mfs * 0.92}px ${LABEL_FONT}`;
  ctx.fillText(COVER_TAGLINE, W * 0.115, mh * 0.52);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff7ab8';
  ctx.fillText(COVER_GAZETTE, W * 0.62, mh * 0.52);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd23e';
  const volW = W * 0.075;
  ctx.fillRect(W * 0.915, mh * 0.18, volW, mh * 0.64);
  ctx.fillStyle = '#14100c';
  ctx.font = `${mfs * 0.85}px ${LABEL_FONT}`;
  ctx.fillText('VOL. 1', W * 0.915 + volW / 2, mh * 0.52);
  ctx.textAlign = 'left';
  ctx.strokeStyle = 'rgba(255, 210, 90, 0.6)';
  ctx.lineWidth = Math.max(1, H * 0.0015);
  ctx.beginPath();
  ctx.moveTo(0, mh);
  ctx.lineTo(W, mh);
  ctx.stroke();

  // Title band: its own zone across the middle, so the lettering never
  // covers a car, a bike, a person or a face.
  const bandY = layout.titleBand.y * H;
  const bandH = layout.titleBand.h * H;
  const grad = ctx.createLinearGradient(W * 0.1, 0, W * 0.9, 0);
  grad.addColorStop(0, grade.title[0]);
  grad.addColorStop(0.55, '#ff7a18');
  grad.addColorStop(1, grade.title[1]);
  ctx.textAlign = 'center';
  const titleSize = Math.min(W * 0.115, bandH * 0.52);
  ctx.font = `${titleSize}px ${BLOCK_FONT}`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = titleSize * 0.12;
  ctx.shadowOffsetY = titleSize * 0.05;
  ctx.fillStyle = grad;
  ctx.fillText(state.title, W / 2, bandY + titleSize * 0.62);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  // Pink script subhead, Palmline/Golden Mile style: delicate flowing
  // cursive, small accent, strongly slanted (~25-30 deg lean), soft
  // light-pink with a subtle glow only — NO white outline. r15f: sits
  // in its own space BELOW the title (never overlapping a title
  // letter), and is slightly thicker than r15e via a very thin
  // SAME-COLOUR pink stroke, so it reads at a glance and stays elegant.
  const scriptSize = bandH * 0.27;
  const scriptY = bandY + titleSize * 1.12 + scriptSize * 0.75;
  ctx.save();
  ctx.translate(W / 2, scriptY);
  ctx.transform(1, 0, -0.47, 1, 0, 0);
  ctx.font = `${scriptSize}px ${SCRIPT_FONT}`;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255, 143, 192, 0.55)';
  ctx.shadowBlur = scriptSize * 0.18;
  ctx.shadowOffsetY = scriptSize * 0.02;
  ctx.lineWidth = scriptSize * 0.05;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffa8cc';
  ctx.fillStyle = '#ffa8cc';
  ctx.strokeText(state.script, 0, 0);
  ctx.fillText(state.script, 0, 0);
  ctx.restore();
  // Ribbon line.
  ctx.font = `${bandH * 0.115}px ${LABEL_FONT}`;
  const ribbonText = state.ribbon;
  const rw = ctx.measureText(ribbonText).width + bandH * 0.3;
  const rx = (W - rw) / 2;
  const ry = scriptY + scriptSize * 0.8;
  const rg = ctx.createLinearGradient(rx, 0, rx + rw, 0);
  rg.addColorStop(0, '#ffd23e');
  rg.addColorStop(1, '#ff7a18');
  ctx.fillStyle = rg;
  ctx.fillRect(rx, ry, rw, bandH * 0.17);
  ctx.fillStyle = '#2a0a12';
  ctx.fillText(ribbonText, W / 2, ry + bandH * 0.085);

  // Bottom strip: COMING SOON, credits, barcode.
  const footY = layout.foot.y * H;
  const footH = layout.foot.h * H;
  ctx.fillStyle = '#12060d';
  ctx.fillRect(0, footY, W, footH);
  ctx.fillStyle = '#ffd23e';
  ctx.font = `${footH * 0.42}px ${LABEL_FONT}`;
  ctx.fillText('—  COMING SOON  —', W * 0.018, footY + footH * 0.52);
  ctx.fillStyle = 'rgba(245, 240, 230, 0.75)';
  ctx.font = `${Math.max(9, footH * 0.16)}px ${LABEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(COVER_CREDITS, W * 0.5, footY + footH * 0.52);
  ctx.textAlign = 'left';
  paintBarcode(ctx, W * 0.86, footY + footH * 0.14, W * 0.115, footH * 0.72);

  // Gold BEST seal, overlapping the bottom-right of the grid.
  paintSeal(ctx, layout.seal.x * W, layout.seal.y * H, layout.seal.r * W);
}

// Render the cover to a PNG blob at one of the three post sizes.
export async function exportCoverPng(state, images, sizeId) {
  const size = COVER_SIZES[sizeId] || COVER_SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  const renderState = { ...state, size: sizeId };
  paintCover(ctx, renderState, images, size.width, size.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// Backwards-compatible names for the earlier revisions.
export {
  COVER_TITLE as GOLDEN_MILE_TITLE,
  COVER_SUBHEAD as GOLDEN_MILE_SCRIPT,
  COVER_RIBBON as GOLDEN_MILE_RIBBON,
  COVER_TAGLINE as GOLDEN_MILE_TAGLINE,
  COVER_GAZETTE as GOLDEN_MILE_GAZETTE,
  COVER_CREDITS as GOLDEN_MILE_CREDITS,
  COVER_PANELS as GOLDEN_MILE_PANELS,
  COVER_GRID as GOLDEN_MILE_GRID,
  COVER_GRADES as GOLDEN_MILE_GRADES,
  COVER_GRADE_IDS as GOLDEN_MILE_GRADE_IDS,
  COVER_SIZES as GOLDEN_MILE_SIZES,
  COVER_CROP_TWEAKS as GOLDEN_MILE_CROP_OVERRIDES,
  coverPanelCrop as goldenMilePanelCrop,
  coverDefaultState as goldenMileDefaultState,
  coverLayout as goldenMileLayout,
  coverCellRect as goldenMileCellRect,
  paintCover as drawGoldenMileCover,
  exportCoverPng as exportGoldenMilePng,
};
