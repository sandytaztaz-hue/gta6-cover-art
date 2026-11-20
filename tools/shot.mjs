// Screenshot runner for SUNREEL: serves app/ on a local port, then takes
// one screenshot per entry in shots.json into screenshots/.
// Uses puppeteer when it can be loaded, otherwise falls back to headless
// Chrome's own --screenshot flag.
//
//   node tools/shot.mjs [port]
//
// Chrome binary: /home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome

import { spawn, execFile } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');
const shots = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf8')).shots;
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
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: join(outDir, shot.name), type: 'jpeg', quality: 80 });
}

function shotWithChrome(shot) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      `--window-size=${shot.width},${shot.height}`,
      `--screenshot=${join(outDir, shot.name)}`,
      '--virtual-time-budget=6000',
      `http://127.0.0.1:${port}${shot.url}`,
    ];
    execFile(CHROME, args, { timeout: 60000 }, (err) => (err ? reject(err) : resolve()));
  });
}

async function main() {
  const server = spawn(process.execPath, ['serve.ts'], { cwd: repo, stdio: 'ignore' });
  // serve.ts is TypeScript; run it through node's type stripping when needed.
  try {
    await waitForServer(`http://127.0.0.1:${port}/index.html`);
  } catch {
    server.kill();
    throw new Error('serve.ts did not start (needs Node 22 type stripping)');
  }
  let browser = null;
  try {
    const puppeteer = await import('puppeteer').catch(() => null);
    if (puppeteer) {
      browser = await puppeteer.default.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
      const page = await browser.newPage();
      for (const shot of shots) {
        await shotWithPuppeteer(page, shot);
        console.log('shot', shot.name);
      }
    } else {
      for (const shot of shots) {
        await shotWithChrome(shot);
        console.log('shot', shot.name);
      }
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
