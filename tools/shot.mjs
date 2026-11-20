// Screenshot runner for GOLDEN MILE: serves app/ on a local port, then
// takes one screenshot per entry in shots.json into screenshots/.
// Uses puppeteer when it can be loaded, otherwise falls back to headless
// Chrome's own --screenshot flag.
//
//   node tools/shot.mjs [port] [name-substring]
//
// With a name substring only matching shots are taken, so the first
// cover can be rendered on its own while the rest of the build lands.
// The shots use the app's own ?shot=cover / ?shot=editor presets, so
// every screenshot is the app itself, never a composite.
//
// Chrome binary: /home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome

import { spawn, execFile } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');
const allShots = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf8')).shots;
const only = process.argv[3] || '';
const shots = only ? allShots.filter((s) => s.name.includes(only)) : allShots;
if (!shots.length) {
  console.error(`no shots match "${only}"`);
  process.exit(1);
}
const outDir = join(repo, 'screenshots');
mkdirSync(outDir, { recursive: true });
const port = Number(process.argv[2] || 8080);
const CHROME = '/home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome';

function waitForServer(url, tries = 40) {
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch { /* not up yet */ }
      if (--tries <= 0) return reject(new Error('server did not come up: ' + url));
      setTimeout(tick, 250);
    };
    tick();
  });
}

async function shotWithPuppeteer(page, shot) {
  await page.setViewport({ width: shot.width, height: shot.height, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}${shot.url}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: join(outDir, shot.name), type: 'jpeg', quality: 82 });
}

function shotWithChrome(shot) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      `--window-size=${shot.width},${shot.height}`,
      `--screenshot=${join(outDir, shot.name)}`,
      '--virtual-time-budget=8000',
      `http://127.0.0.1:${port}${shot.url}`,
    ];
    execFile(CHROME, args, (err) => (err ? reject(err) : resolve()));
  });
}

async function runGoldenMileShots() {
  const nodeBin = process.execPath;
  const server = spawn(nodeBin, ['serve.ts', '--port', String(port)], { cwd: repo, stdio: 'ignore' });
  try {
    await waitForServer(`http://127.0.0.1:${port}/`);
    let puppeteer = null;
    try {
      puppeteer = (await import('puppeteer')).default;
    } catch { /* fall back to plain headless Chrome */ }
    if (puppeteer) {
      const browser = await puppeteer.launch({
        executablePath: CHROME,
        headless: true,
        args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
      });
      const page = await browser.newPage();
      for (const shot of shots) {
        await shotWithPuppeteer(page, shot);
        console.log('shot', shot.name);
      }
      await browser.close();
    } else {
      for (const shot of shots) {
        await shotWithChrome(shot);
        console.log('shot', shot.name);
      }
    }
  } finally {
    server.kill();
  }
}

runGoldenMileShots().catch((err) => {
  console.error(err);
  process.exit(1);
});
