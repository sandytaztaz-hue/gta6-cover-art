// Screenshot runner for Sunset Cover Studio. Serves app/ on a local port, captures every
// scene in shots.json with headless Chrome, and converts the PNG captures to JPEGs sized
// for the make.fun gate (long side <= 1280, short side >= 480, each <= 256 KiB).
// Run from the repo root:  node tools/shot.mjs
// Requires: the Chrome binary at CHROME and python3 + PIL for the JPEG conversion.

import { spawn } from 'node:child_process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const repo = fileURLToPath(new URL('..', import.meta.url));
const CHROME = '/home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome';
const PORT = 8091;
const NODE = '/home/hatch/workspace/makefun/github-core-clone-01/node-v22.21.1-linux-x64/bin/node';

const shots = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf8'));

function waitForServer(url, tries = 40) {
  return new Promise((resolve, reject) => {
    const tick = async (left) => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch { /* not up yet */ }
      if (left <= 0) return reject(new Error('server did not come up'));
      setTimeout(() => tick(left - 1), 250);
    };
    tick(tries);
  });
}

function shotChrome(url, png, w, h) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--force-device-scale-factor=1', '--virtual-time-budget=9000',
      `--window-size=${w},${h}`, `--screenshot=${png}`, url,
    ];
    const proc = spawn(CHROME, args, { stdio: 'pipe' });
    let err = '';
    proc.stderr.on('data', (d) => { err += d; });
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`chrome ${code}: ${err.slice(-400)}`))));
  });
}

// PNG capture -> JPEG at the shot's own dimensions, quality tuned to stay under 256 KiB.
async function toJpeg(png, jpg, w, h) {
  const script = `
from PIL import Image
im = Image.open(${JSON.stringify(png)}).convert('RGB')
im = im.resize((${w}, ${h}), Image.LANCZOS)
q = 90
while True:
    im.save(${JSON.stringify(jpg)}, 'JPEG', quality=q, optimize=True)
    import os
    if os.path.getsize(${JSON.stringify(jpg)}) <= 250 * 1024 or q <= 55:
        break
    q -= 5
print(im.size, q)
`;
  const { stdout } = await run('python3', ['-c', script]);
  return stdout.trim();
}

const server = spawn(NODE, ['serve.ts', '--port', String(PORT)], { cwd: repo, stdio: 'pipe' });
try {
  await waitForServer(`http://127.0.0.1:${PORT}/`);
  console.log(`serving app/ on :${PORT}`);
  for (const s of shots) {
    const url = `http://127.0.0.1:${PORT}/${s.query}`;
    // Keep the intermediate PNG in /tmp: anything left in screenshots/ would be copied
    // into the entry and count against the 4-screenshot cap.
    const png = `/tmp/shot-${s.name}.png`;
    const jpg = join(repo, 'screenshots', s.name);
    await shotChrome(url, png, s.w, s.h);
    const info = await toJpeg(png, jpg, s.w, s.h);
    console.log(`${s.name}: ${info}`);
  }
} finally {
  server.kill();
}
console.log('done');
