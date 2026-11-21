// VICE PURSUIT — cover renderer.
// Draws the whole magazine cover (masthead, photo collage, title block,
// ribbon, gold seal, footer) onto a canvas from the editor state.
// All geometry is derived from the canvas size, so the same painter serves
// the square, portrait and wide exports and the live preview.

export const PANEL_DEFS = [
  { id: 'driver', label: 'THE DRIVER', src: 'samples/vice-driver.jpg', fx: 0.72, fy: 0.38, labelAt: 'bottom' },
  { id: 'fixer', label: 'THE FIXER', src: 'samples/vice-fixer.jpg', fx: 0.68, fy: 0.32, labelAt: 'bottom' },
  { id: 'hero', label: '', src: 'samples/crime-insider.jpg', fx: 0.5, fy: 0.3, labelAt: 'none' },
  { id: 'smuggler', label: 'THE SMUGGLER', src: 'samples/vice-everglades.jpg', fx: 0.3, fy: 0.62, labelAt: 'bottom' },
  { id: 'boss', label: 'THE BOSS', src: 'samples/dark-market.jpg', fx: 0.55, fy: 0.45, labelAt: 'top' },
  { id: 'rider', label: 'THE RIDER', src: 'samples/runners-rider.jpg', fx: 0.62, fy: 0.5, labelAt: 'bottom' },
  { id: 'getaway', label: 'THE GETAWAY', src: 'samples/vice-chase.jpg', fx: 0.28, fy: 0.55, labelAt: 'bottom' },
  { id: 'lookout', label: 'THE LOOKOUT', src: 'samples/crime-lookout.jpg', fx: 0.5, fy: 0.32, labelAt: 'bottom' },
];

export const SAMPLES = [
  'crime-getaway', 'crime-insider', 'crime-lookout', 'dark-driver',
  'dark-market', 'dark-ride', 'dark-sky', 'runners-boat', 'runners-diner',
  'runners-overlook', 'runners-pickup', 'runners-rider', 'runners-skater',
  'vice-canyon', 'vice-chase', 'vice-driver', 'vice-everglades', 'vice-fixer',
];

export const GRADES = {
  'golden-hour': { name: 'Golden Hour', dot: '#ff8a2a', tint: '#ff7a1a', tintAlpha: 0.1, blend: 'overlay', titleFrom: '#ff4d6d', titleTo: '#ff8a00', subhead: '#ff7ad9' },
  'neon-nights': { name: 'Neon Nights', dot: '#b04dff', tint: '#c44dff', tintAlpha: 0.13, blend: 'overlay', titleFrom: '#ff2e88', titleTo: '#c44dff', subhead: '#ff8af0' },
  'dusk-purple': { name: 'Dusk Purple', dot: '#8a4dff', tint: '#7a3cff', tintAlpha: 0.15, blend: 'overlay', titleFrom: '#e06bff', titleTo: '#ff5e8a', subhead: '#ff9ae2' },
  'vice-teal': { name: 'Vice Teal', dot: '#2ee6c8', tint: '#14b8a6', tintAlpha: 0.12, blend: 'overlay', titleFrom: '#2ee6c8', titleTo: '#ff7a3c', subhead: '#7ef0d4' },
  'noir': { name: 'Noir', dot: '#555555', tint: '#000000', tintAlpha: 0.12, blend: 'multiply', titleFrom: '#f5f5f5', titleTo: '#c9c9c9', subhead: '#e8e8e8', desaturate: true },
};

export const SIZES = {
  square: { name: 'Square', w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  portrait: { name: 'Portrait', w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  wide: { name: 'Wide', w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

/** Load one image file; resolves with the element (or null on failure). */
export function loadImage(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = path;
  });
}

/** The cover geometry for a canvas of W × H. */
export function layoutFor(W, H) {
  const pad = Math.round(W * 0.009);
  const mastH = Math.round(H * 0.048);
  const footH = Math.round(H * 0.082);
  const gap = Math.max(3, Math.round(W * 0.005));
  const cx = pad;
  const cy = pad + mastH + gap;
  const cw = W - pad * 2;
  const ch = H - pad * 2 - mastH - footH - gap * 2;
  const fracs = [0.164, 0.164, 0.344, 0.164, 0.164];
  const freeW = cw - gap * 4;
  const colW = fracs.map((f) => Math.round(f * freeW));
  colW[2] += freeW - colW.reduce((a, b) => a + b, 0);
  const colX = [];
  let acc = cx;
  for (const w of colW) { colX.push(acc); acc += w + gap; }
  const rowH = (ch - gap) / 2;
  const rowY = [cy, cy + rowH + gap];
  const rect = (col, row, rows = 1) => ({
    x: colX[col], y: rowY[row], w: colW[col], h: rows === 2 ? ch : rowH,
  });
  return {
    W, H, pad, mastH, footH, gap, cx, cy, cw, ch,
    panels: {
      driver: rect(0, 0), fixer: rect(1, 0), hero: rect(2, 0, 2),
      smuggler: rect(3, 0), boss: rect(4, 0, 2),
      rider: rect(0, 1), getaway: rect(1, 1), lookout: rect(3, 1),
    },
    heroCentreX: colX[2] + colW[2] / 2,
    titleTop: cy + ch * 0.655,
    ribbon: { x: colX[1], y: cy + ch * 0.875, w: colX[3] + colW[3] - colX[1], h: Math.round(H * 0.048) },
    seal: { x: W - pad - W * 0.088, y: cy + ch * 0.93, r: W * 0.058 },
  };
}

function drawStar(ctx, cx, cy, rOuter, rInner) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/** Deterministic pseudo-random bars for the barcode. */
function barcodeBars(seed, count) {
  let s = seed;
  const bars = [];
  for (let i = 0; i < count; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    bars.push(1 + (s % 4));
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    bars.push(1 + (s % 3));
  }
  return bars;
}

function coverFitPhoto(ctx, img, rect, frame) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const zoom = frame.zoom || 1;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const sw = rect.w / base;
  const sh = rect.h / base;
  let sx = frame.fx * iw - sw / 2 + (frame.ox || 0) * iw;
  let sy = frame.fy * ih - sh / 2 + (frame.oy || 0) * ih;
  sx = Math.max(0, Math.min(iw - sw, sx));
  sy = Math.max(0, Math.min(ih - sh, sy));
  ctx.drawImage(img, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
}

function paintPanelLabel(ctx, def, rect, L) {
  if (def.labelAt === 'none' || !def.label) return;
  const fs = Math.max(11, Math.round(L.W * 0.0155));
  ctx.font = `${fs}px "Archivo Black", sans-serif`;
  const tw = ctx.measureText(def.label).width;
  const padX = Math.round(fs * 0.45);
  const padY = Math.round(fs * 0.35);
  const bw = tw + padX * 2;
  const bh = fs + padY * 2;
  const bx = rect.x + 6;
  const by = def.labelAt === 'top'
    ? rect.y + Math.round(rect.h * 0.06)
    : rect.y + rect.h - bh - 6;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#f2c14e';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(def.label, bx + padX, by + bh / 2 + 1);
}

function paintMasthead(ctx, L) {
  const midY = L.pad + L.mastH / 2;
  const starR = Math.max(6, L.W * 0.0085);
  ctx.fillStyle = '#f2c14e';
  let sx = L.pad + 10 + starR;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, sx, midY, starR, starR * 0.45);
    sx += starR * 2.4;
  }
  const fs = Math.max(11, Math.round(L.W * 0.016));
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `${fs}px "Archivo Black", sans-serif`;
  try { ctx.letterSpacing = `${Math.round(fs * 0.18)}px`; } catch (e) { /* older canvas */ }
  ctx.fillStyle = '#ffffff';
  ctx.fillText('THE HOTTEST RIDE OF THE YEAR', sx + 8, midY + 1);
  try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }

  const badgeText = 'VOL. 1';
  ctx.font = `${fs}px "Archivo Black", sans-serif`;
  const badgeW = ctx.measureText(badgeText).width + fs * 1.1;
  const badgeH = L.mastH * 0.62;
  const bx = L.W - L.pad - 8 - badgeW;
  ctx.fillStyle = '#f2c14e';
  ctx.fillRect(bx, midY - badgeH / 2, badgeW, badgeH);
  ctx.fillStyle = '#1a1206';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, bx + badgeW / 2, midY + 1);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ff4d8d';
  ctx.fillText('VICE CITY GAZETTE', bx - 14, midY + 1);
  ctx.textAlign = 'left';
}

function paintTitleBlock(ctx, state, grade, L) {
  const heroX = L.heroCentreX;
  const targetW = L.W * 0.6;
  let fs = Math.round(L.W * 0.115);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const setTitleFont = (size) => { ctx.font = `${size}px Anton, "Archivo Black", sans-serif`; };
  setTitleFont(fs);
  const measured = ctx.measureText(state.title || 'VICE PURSUIT').width;
  if (measured > targetW) fs = Math.max(20, Math.floor(fs * (targetW / measured)));
  // On short frames (wide covers) the title must also fit the collage height.
  fs = Math.min(fs, Math.round(L.ch * 0.13));
  setTitleFont(fs);

  const grad = ctx.createLinearGradient(heroX - targetW / 2, 0, heroX + targetW / 2, 0);
  grad.addColorStop(0, grade.titleFrom);
  grad.addColorStop(1, grade.titleTo);
  const baseY = L.titleTop + fs * 0.78;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = Math.round(fs * 0.1);
  ctx.shadowOffsetY = Math.round(fs * 0.03);
  ctx.fillStyle = grad;
  ctx.fillText(state.title || 'VICE PURSUIT', heroX, baseY);
  ctx.restore();
  ctx.lineWidth = Math.max(2, fs * 0.045);
  ctx.strokeStyle = 'rgba(24, 6, 12, 0.9)';
  ctx.strokeText(state.title || 'VICE PURSUIT', heroX, baseY);

  // Script subhead — own space below the title, slanted, pink, no white outline.
  const subFs = Math.round(fs * 0.48);
  ctx.save();
  ctx.translate(heroX, baseY + subFs * 1.15);
  ctx.rotate(-0.14);
  ctx.font = `${subFs}px "Great Vibes", cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = grade.subhead;
  ctx.fillText(state.subhead || 'Coastline Nights', 0, 0);
  ctx.lineWidth = Math.max(1, subFs * 0.03);
  ctx.strokeStyle = grade.subhead;
  ctx.strokeText(state.subhead || 'Coastline Nights', 0, 0);
  ctx.restore();
  // Remember where the script ends so the ribbon never touches it.
  L.subheadBottom = baseY + subFs * 1.15 + subFs * 0.55;
}

function paintRibbon(ctx, state, L) {
  const r = { ...L.ribbon };
  // Keep clear of the script subhead on short frames.
  if (L.subheadBottom) r.y = Math.max(r.y, L.subheadBottom + Math.round(L.H * 0.008));
  const grad = ctx.createLinearGradient(r.x, 0, r.x + r.w, 0);
  grad.addColorStop(0, '#f7c948');
  grad.addColorStop(1, '#ff7a1a');
  ctx.fillStyle = grad;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  let fs = Math.round(r.h * 0.44);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1a1206';
  const fit = () => {
    ctx.font = `${fs}px "Archivo Black", sans-serif`;
    try { ctx.letterSpacing = `${Math.max(1, Math.round(fs * 0.22))}px`; } catch (e) { /* ignore */ }
    return ctx.measureText(state.ribbon || '').width;
  };
  while (fit() > r.w - 20 && fs > 10) fs -= 1;
  fit();
  ctx.fillText(state.ribbon || '', r.x + r.w / 2, r.y + r.h / 2 + 1);
  try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }
}

function paintSeal(ctx, L) {
  const { x, y, r } = L.seal;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.21);
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#ffe27a');
  grad.addColorStop(0.6, '#f2c14e');
  grad.addColorStop(1, '#c98f1b');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = '#a87a12';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.strokeStyle = 'rgba(120, 84, 8, 0.7)';
  ctx.stroke();
  ctx.fillStyle = '#241703';
  drawStar(ctx, 0, -r * 0.52, r * 0.14, r * 0.06);
  const fs = Math.round(r * 0.3);
  ctx.font = `${fs}px "Archivo Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BEST', 0, -r * 0.08);
  ctx.fillText('SELLER', 0, r * 0.28);
  ctx.restore();
}

function paintFooter(ctx, L) {
  const midY = L.H - L.pad - L.footH / 2;
  const fs = Math.max(12, Math.round(L.W * 0.02));
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `${fs}px "Archivo Black", sans-serif`;
  try { ctx.letterSpacing = `${Math.round(fs * 0.22)}px`; } catch (e) { /* ignore */ }
  ctx.fillStyle = '#f2c14e';
  ctx.fillText('— COMING SOON —', L.pad + 8, midY);

  const small = Math.max(9, Math.round(L.W * 0.0095));
  ctx.font = `${small}px "Archivo Black", sans-serif`;
  try { ctx.letterSpacing = `${Math.round(small * 0.14)}px`; } catch (e) { /* ignore */ }
  ctx.fillStyle = '#cbb9a8';
  ctx.textAlign = 'center';
  ctx.fillText('GOLDEN MILE PICTURES · A VICE CITY STORY', L.W / 2, midY);
  try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }

  // Barcode: black bars on a white strip.
  const bw = Math.round(L.W * 0.1);
  const bh = Math.round(L.footH * 0.62);
  const bx = L.W - L.pad - 8 - bw;
  const by = midY - bh / 2;
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#111111';
  const bars = barcodeBars(20261121, 34);
  let px = bx + 3;
  for (let i = 0; i < bars.length && px < bx + bw - 3; i += 2) {
    const wBar = bars[i] * (L.W / 1080);
    ctx.fillRect(px, by + 2, wBar, bh - 4);
    px += wBar + bars[i + 1] * (L.W / 1080);
  }
  ctx.textAlign = 'left';
}

function paintSelectedBanner(ctx, state, L) {
  const rect = L.panels[state.selected];
  if (!rect) return;
  const h = Math.max(18, Math.round(L.W * 0.024));
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(rect.x, rect.y, rect.w, h);
  const fs = Math.max(10, Math.round(h * 0.5));
  ctx.font = `${fs}px "Archivo Black", sans-serif`;
  ctx.fillStyle = '#2b0313';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SELECTED — drag to move · wheel to zoom', rect.x + rect.w / 2, rect.y + h / 2 + 1);
}

/**
 * Paint the whole cover onto `canvas` from `state`.
 * state: { panels: {id: {src, fx, fy, zoom, ox, oy}}, images: {id: HTMLImageElement},
 *          title, subhead, ribbon, grade, selected }
 * options: { banner: boolean } — draw the pink SELECTED strip (editor preview only).
 */
export function paintCover(canvas, state, options = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const L = layoutFor(W, H);
  const grade = GRADES[state.grade] || GRADES['golden-hour'];

  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#150e0c';
  ctx.fillRect(0, 0, W, H);

  // Photos.
  if (grade.desaturate) ctx.filter = 'grayscale(0.8) brightness(0.88) contrast(1.08)';
  for (const def of PANEL_DEFS) {
    const rect = L.panels[def.id];
    const frame = state.panels[def.id] || {};
    const img = state.images ? state.images[def.id] : null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (img) {
      coverFitPhoto(ctx, img, rect, { fx: frame.fx ?? def.fx, fy: frame.fy ?? def.fy, zoom: frame.zoom ?? 1, ox: frame.ox ?? 0, oy: frame.oy ?? 0 });
    } else {
      ctx.fillStyle = '#241a16';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  }
  ctx.filter = 'none';

  // Colour grade: a warm tint washed over the collage only.
  ctx.save();
  ctx.globalCompositeOperation = grade.blend;
  ctx.globalAlpha = grade.tintAlpha;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(L.cx, L.cy, L.cw, L.ch);
  ctx.restore();
  const vig = ctx.createRadialGradient(W / 2, L.cy + L.ch / 2, Math.min(L.cw, L.ch) * 0.35, W / 2, L.cy + L.ch / 2, Math.max(L.cw, L.ch) * 0.75);
  vig.addColorStop(0, 'rgba(20, 8, 4, 0)');
  vig.addColorStop(1, 'rgba(20, 8, 4, 0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(L.cx, L.cy, L.cw, L.ch);

  // Thin gold/dark borders around every panel.
  ctx.strokeStyle = 'rgba(190, 150, 70, 0.55)';
  ctx.lineWidth = Math.max(1, Math.round(W * 0.0018));
  for (const def of PANEL_DEFS) {
    const r = L.panels[def.id];
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  }

  for (const def of PANEL_DEFS) paintPanelLabel(ctx, def, L.panels[def.id], L);

  paintMasthead(ctx, L);
  paintTitleBlock(ctx, state, grade, L);
  paintRibbon(ctx, state, L);
  paintSeal(ctx, L);
  paintFooter(ctx, L);

  if (options.banner) paintSelectedBanner(ctx, state, L);
  ctx.restore();
  return L;
}
