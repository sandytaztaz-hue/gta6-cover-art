// SUNREEL cover renderer: draws one poster cover onto a canvas.
// The cover is three stacked zones: a photo zone, a title band that owns
// all the lettering (so text never covers a car, a bike or a face), and a
// newspaper quote strip. Panels are clipped to their own rectangles, so a
// photo can only ever fill its own panel.

import { GRADES, SIZES } from './shots.js';

const TITLE_FONT = '"Anton", "Archivo Black", sans-serif';
const TAG_FONT = '"Archivo Black", sans-serif';
const SCRIPT_FONT = '"Bebas Neue", sans-serif';

let noiseTile = null;

function makeNoiseTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  noiseTile = c;
  return c;
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  while (px > 12) {
    ctx.font = `${weight || ''} ${px}px ${family}`.trim();
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 2;
  }
  return px;
}

function resolveImg(images, file) {
  if (!file) return null;
  if (images[file]) return images[file];
  if (file.startsWith('data:')) return images[file] || null;
  return images['samples/' + file] || null;
}

function drawPhoto(ctx, img, rect, panel, paint, gradeTint) {
  if (!img || !img.naturalWidth) {
    ctx.fillStyle = '#241533';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    return;
  }
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const zoom = Math.max(0.5, panel.zoom || 1);
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (panel.ox || 0) * rect.w * 0.2;
  const dy = rect.y + (rect.h - dh) / 2 + (panel.oy || 0) * rect.h * 0.2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = `saturate(${1 + paint * 0.35}) contrast(${1 + paint * 0.18}) brightness(${1 + paint * 0.04})`;
  if (panel.flip) {
    ctx.translate(rect.x + rect.w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(rect.x + rect.w / 2), 0);
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
  ctx.filter = 'none';
  if (gradeTint) {
    ctx.fillStyle = gradeTint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
}

function drawTag(ctx, rect, text, show) {
  if (!show || !text) return;
  const pad = Math.max(8, rect.h * 0.02);
  const h = Math.max(20, Math.min(rect.h * 0.085, rect.w * 0.16));
  ctx.font = `bold ${Math.round(h * 0.5)}px ${TAG_FONT}`;
  const tw = ctx.measureText(text).width;
  const w = tw + pad * 2.4;
  const x = rect.x + pad;
  const y = rect.y + rect.h - h - pad;
  ctx.fillStyle = '#ffc531';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2.4);
  ctx.fill();
  ctx.fillStyle = '#160a1e';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + pad * 1.2, y + h / 2 + 1);
}

function drawComingSoon(ctx, rect, show) {
  if (!show) return;
  const h = Math.max(22, Math.min(rect.h * 0.09, rect.w * 0.13));
  const pad = Math.max(10, rect.h * 0.03);
  const text = 'COMING SOON';
  ctx.font = `bold ${Math.round(h * 0.52)}px ${TAG_FONT}`;
  const w = ctx.measureText(text).width + pad * 2;
  const x = rect.x + pad;
  const y = rect.y + pad;
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2.4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + pad, y + h / 2 + 1);
}

function drawSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const spikes = 16;
  for (let i = 0; i <= spikes * 2; i++) {
    const ang = (i / (spikes * 2)) * Math.PI * 2;
    const rad = i % 2 === 0 ? r : r * 0.86;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffc531';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = '#8a5a00';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#160a1e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(r * 0.22)}px ${TAG_FONT}`;
  ctx.fillText('CERTIFIED', 0, -r * 0.26);
  ctx.font = `bold ${Math.round(r * 0.34)}px ${TAG_FONT}`;
  ctx.fillText('NO.1', 0, r * 0.26);
  ctx.restore();
}

function drawHeatPill(ctx, x, y, h) {
  const text = 'HEAT ';
  const stars = '★★★★☆';
  ctx.font = `bold ${Math.round(h * 0.42)}px ${TAG_FONT}`;
  const w = ctx.measureText(text + stars).width + h * 1.1;
  ctx.strokeStyle = '#ffbf3f';
  ctx.lineWidth = Math.max(2, h * 0.07);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.stroke();
  ctx.fillStyle = '#ffbf3f';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + h * 0.55, y + h / 2 + 1);
  const tw = ctx.measureText(text).width;
  ctx.fillText(stars, x + h * 0.55 + tw, y + h / 2 + 1);
  return w;
}

// Panel rectangles for one layout inside the photo zones.
export function panelRects(layout, top, bottom, gap, count) {
  const rects = [];
  const split = (zone, n) => {
    if (n <= 0) return;
    const w = (zone.w - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      rects.push({ x: zone.x + i * (w + gap), y: zone.y, w, h: zone.h });
    }
  };
  if (layout === 'sunset' || layout === 'mosaic') {
    const heroW = (top.w - gap) * 0.62;
    rects.push({ x: top.x, y: top.y, w: heroW, h: top.h });
    rects.push({ x: top.x + heroW + gap, y: top.y, w: top.w - heroW - gap, h: top.h });
    split(bottom, count - 2);
  } else if (layout === 'diagonal') {
    const w = (top.w - gap * (count - 1)) / count;
    for (let i = 0; i < count; i++) {
      rects.push({ x: top.x + i * (w + gap), y: top.y, w, h: top.h, slant: top.w * 0.045 });
    }
  } else if (layout === 'hero3') {
    rects.push({ x: top.x, y: top.y, w: top.w, h: top.h });
    split(bottom, count - 1);
  } else {
    const topN = Math.min(3, Math.ceil(count / 2));
    split(top, topN);
    split(bottom, count - topN);
  }
  return rects;
}

export function drawCover(ctx, W, H, state, images) {
  const grade = GRADES[state.grade] || GRADES.golden;
  const size = SIZES[state.size] || SIZES.landscape;
  const strength = state.strength ?? 0.8;
  const s = state.sliders || { paint: 60, grade: 80, halftone: 20, grain: 50, glow: 50 };
  const t = state.toggles || {};
  const gap = Math.max(3, W * 0.004);
  const bandH = Math.round(H * 0.21);
  const quoteH = t.quote === false ? 0 : Math.round(H * 0.055);
  const photoH = H - bandH - quoteH;
  const isDiag = state.layout === 'diagonal';
  const topH = isDiag ? photoH : Math.round(photoH * 0.56);
  const botH = photoH - topH;
  const top = { x: 0, y: 0, w: W, h: topH };
  const bottom = { x: 0, y: topH, w: W, h: botH };
  const bandY = photoH;

  const paint = (s.paint / 100) * strength;
  const gradeAmt = (s.grade / 100) * strength;
  const panels = state.panels || [];
  const rects = panelRects(state.layout, top, bottom, gap, panels.length);

  // Photos.
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    const p = panels[i];
    if (!p) continue;
    if (r.slant) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(r.x + r.slant, r.y);
      ctx.lineTo(r.x + r.w, r.y);
      ctx.lineTo(r.x + r.w - r.slant, r.y + r.h);
      ctx.lineTo(r.x, r.y + r.h);
      ctx.closePath();
      ctx.clip();
      drawPhoto(ctx, resolveImg(images, p.file), { x: r.x - r.slant, y: r.y, w: r.w + r.slant * 2, h: r.h }, p, paint, gradeAmt ? hexA(grade.overlay, gradeAmt) : null);
      ctx.restore();
      ctx.strokeStyle = grade.bandLine;
      ctx.lineWidth = Math.max(2, W * 0.002);
      ctx.beginPath();
      ctx.moveTo(r.x + r.slant, r.y);
      ctx.lineTo(r.x, r.y + r.h);
      ctx.stroke();
    } else {
      drawPhoto(ctx, resolveImg(images, p.file), r, p, paint, gradeAmt ? hexA(grade.overlay, gradeAmt) : null);
    }
    drawTag(ctx, r, p.label, t.tags !== false);
    if (i === 0) drawComingSoon(ctx, r, t.comingSoon !== false);
  }

  // Neon divider lines around the photo zones.
  ctx.fillStyle = grade.bandLine;
  ctx.fillRect(0, topH - gap / 2, W, gap);
  ctx.fillRect(0, photoH - gap / 2, W, gap);

  // Title band — the only place the title lives.
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, bandY, W, bandH);
  ctx.fillStyle = grade.bandLine;
  ctx.fillRect(0, bandY, W, Math.max(2, H * 0.004));
  ctx.fillRect(0, bandY + bandH - Math.max(2, H * 0.004), W, Math.max(2, H * 0.004));

  const bandPad = W * 0.03;
  const heatH = Math.round(bandH * 0.24);
  let heatW = 0;
  if (t.heat !== false) {
    heatW = drawHeatPill(ctx, bandPad, bandY + bandH * 0.16, heatH);
  }
  const sealR = bandH * 0.36;
  if (t.seal !== false) {
    drawSeal(ctx, W - bandPad - bandH * 0.34, bandY + bandH / 2, sealR);
  }

  const titleZone = {
    x: bandPad + (heatW ? heatW + W * 0.015 : 0),
    w: W - bandPad * 2 - (heatW ? heatW + W * 0.015 : 0) - (t.seal !== false ? sealR * 2 + W * 0.02 : 0),
  };
  const title = (state.title || 'VICE PURSUIT').toUpperCase();
  const titlePx = fitFont(ctx, title, titleZone.w, Math.round(bandH * 0.36), TITLE_FONT, '');
  const grad = ctx.createLinearGradient(0, bandY + bandH * 0.16, 0, bandY + bandH * 0.62);
  grad.addColorStop(0, grade.titleFrom);
  grad.addColorStop(1, grade.titleTo);
  ctx.save();
  if (s.glow > 0) {
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = (s.glow / 100) * bandH * 0.28 * strength;
  }
  ctx.fillStyle = grad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, titleZone.x + titleZone.w / 2, bandY + bandH * 0.38);
  ctx.restore();

  const script = state.script || '';
  if (script) {
    ctx.save();
    ctx.translate(titleZone.x + titleZone.w / 2, bandY + bandH * 0.7);
    ctx.transform(1, 0, -0.12, 1, 0, 0);
    ctx.font = `${Math.round(bandH * 0.22)}px ${SCRIPT_FONT}`;
    ctx.fillStyle = '#ff7ad9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(script, 0, 0);
    ctx.restore();
  }
  const tagline = (state.tagline || '').toUpperCase();
  if (tagline) {
    ctx.font = `bold ${Math.round(bandH * 0.11)}px ${TAG_FONT}`;
    ctx.fillStyle = grade.accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagline, titleZone.x + titleZone.w / 2, bandY + bandH * 0.9);
  }

  // Quote strip.
  if (quoteH > 0) {
    const qy = H - quoteH;
    ctx.fillStyle = '#f2e3c2';
    ctx.fillRect(0, qy, W, quoteH);
    ctx.fillStyle = '#3a2a12';
    ctx.textBaseline = 'middle';
    const qh = Math.round(quoteH * 0.34);
    ctx.font = `${qh}px ${TAG_FONT}`;
    const stars = '★★★★★';
    const sw = ctx.measureText(stars).width;
    ctx.fillStyle = '#b8860b';
    ctx.textAlign = 'left';
    ctx.fillText(stars, W * 0.03, qy + quoteH * 0.38);
    ctx.fillStyle = '#1c1206';
    const qtext = `"${(state.quote || '').toUpperCase()}" — ${state.quoteSource || ''}`;
    const qpx = fitFont(ctx, qtext, W * 0.62, Math.round(quoteH * 0.36), TAG_FONT, 'bold');
    ctx.font = `bold ${qpx}px ${TAG_FONT}`;
    ctx.fillText(qtext, W * 0.03 + sw + W * 0.015, qy + quoteH * 0.38);
    ctx.font = `bold ${Math.round(quoteH * 0.3)}px ${TAG_FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('VOL. 06', W * 0.97, qy + quoteH * 0.38);
    // Barcode ticks.
    const bx = W * 0.78;
    ctx.fillStyle = '#1c1206';
    for (let i = 0; i < 9; i++) {
      const bw = 2 + (i % 3);
      ctx.fillRect(bx + i * 7, qy + quoteH * 0.62, bw, quoteH * 0.24);
    }
    ctx.font = `bold ${Math.round(quoteH * 0.26)}px ${TAG_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText((state.tagline || '').toUpperCase(), W * 0.03, qy + quoteH * 0.78);
  }

  // Halftone dots, grain and vignette on top of everything.
  if (s.halftone > 0 && t.halftoneDots) {
    ctx.save();
    ctx.globalAlpha = (s.halftone / 100) * 0.25 * strength;
    ctx.fillStyle = '#000000';
    const step = Math.max(6, W / 160);
    for (let y = step / 2; y < H; y += step) {
      for (let x = step / 2; x < W; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, step * 0.14, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  if (s.grain > 0 && t.filmGrain !== false) {
    ctx.save();
    ctx.globalAlpha = (s.grain / 100) * 0.12 * strength;
    const tile = makeNoiseTile();
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (t.vignette !== false) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
}

function hexA(rgba, amt) {
  const m = rgba.match(/rgba?\(([^)]+)\)/);
  if (!m) return rgba;
  const parts = m[1].split(',').map((v) => v.trim());
  const a = parts.length > 3 ? Number(parts[3]) * amt : amt;
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${a})`;
}
