// VICE PURSUIT — screenshot runner (rebuild r8, photo edition).
//
// Serves app/ with serve.ts, drives headless Chrome over its DevTools
// protocol (plain WebSocket from Node's standard library, no packages),
// opens each ?shot= URL from shots.json, waits for window.__shotReady,
// and saves a JPEG into screenshots/. Covers are the PNGs the app itself
// wrote, shown full-bleed and captured to JPEG. If a JPEG lands over the
// 256 KiB cap, the quality steps down and the shot is retaken.
//
//   node tools/shot.mjs [--port 8123] [--quality 85]
//
// Chrome: /home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome

import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = '/home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome';
const MAX_BYTES = 262144;

const here = fileURLToPath(new URL('..', import.meta.url));
const argv = process.argv.slice(2);
const pick = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i === -1 ? fallback : Number(argv[i + 1]);
};
const port = pick('--port', 8123);
const startQuality = pick('--quality', 85);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const v = await fn();
      if (v) return v;
    } catch { /* not up yet */ }
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await sleep(250);
  }
}

/** Smallest useful CDP client over Node's built-in WebSocket. */
class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    this.open = new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evalJs(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true });
    return r?.result?.value;
  }

  close() {
    try { this.ws.close(); } catch { /* already closed */ }
  }
}

/** Read the shot list: [{ name, query, w, h }]. */
function loadShots() {
  const raw = readFileSync(join(here, 'shots.json'), 'utf8');
  const list = JSON.parse(raw);
  if (!Array.isArray(list) || !list.length) throw new Error('shots.json is empty');
  return list;
}

// ---------------------------------------------------------------- run

/** One shot: launch a throwaway Chrome, open the ?shot= URL, wait for the
 *  ready flag, capture a JPEG, stepping the quality down if it is too big. */
async function capture(shot, baseUrl) {
  const profile = mkdtempSync(join(tmpdir(), 'vice-shot-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--remote-debugging-port=9222',
    `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: 'ignore' });
  try {
    const version = await waitFor(
      async () => {
        const res = await fetch('http://127.0.0.1:9222/json/version');
        if (!res.ok) throw new Error('devtools not up');
        return res.json();
      },
      20000,
      'chrome devtools',
    );
    void version;
    const targetRes = await fetch(
      `http://127.0.0.1:9222/json/new?${encodeURIComponent(baseUrl + shot.query)}`,
      { method: 'PUT' },
    );
    if (!targetRes.ok) throw new Error(`could not open target (${targetRes.status})`);
    const target = await targetRes.json();
    const cdp = new Cdp(target.webSocketDebuggerUrl);
    await cdp.open;
    try {
      await cdp.send('Page.enable');
      await cdp.send('Runtime.enable');
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: shot.w, height: shot.h, deviceScaleFactor: 1, mobile: false,
      });
      await cdp.send('Page.navigate', { url: baseUrl + shot.query });
      await waitFor(
        async () => (await cdp.evalJs('window.__shotReady === true')) === true,
        30000,
        `__shotReady for ${shot.name}`,
      );
      // One beat to settle after the ready flag, so the paint is complete.
      await sleep(400);
      let quality = startQuality;
      for (;;) {
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality });
        const bytes = Buffer.from(data, 'base64');
        writeFileSync(join(here, 'screenshots', shot.name), bytes);
        console.log(`${shot.name}: ${shot.w}x${shot.h} q${quality} ${bytes.length} bytes`);
        if (bytes.length <= MAX_BYTES || quality <= 50) {
          if (bytes.length > MAX_BYTES) console.warn(`${shot.name}: over 256 KiB at lowest quality`);
          return bytes.length;
        }
        quality -= 15;
      }
    } finally {
      cdp.close();
      try {
        await fetch(`http://127.0.0.1:9222/json/close/${target.id}`);
      } catch { /* chrome is going away anyway */ }
    }
  } finally {
    chrome.kill('SIGKILL');
    // Chrome may still be flushing its profile when it is killed; a failed
    // cleanup must not fail the shot that was just taken.
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
  }
}

const shots = loadShots();
const server = spawn(
  process.execPath,
  [join(here, 'serve.ts'), '--port', String(port)],
  { stdio: 'inherit' },
);
try {
  await waitFor(
    async () => {
      const res = await fetch(`http://127.0.0.1:${port}/index.html`);
      return res.ok;
    },
    15000,
    'serve.ts',
  );
  const baseUrl = `http://127.0.0.1:${port}/`;
  for (const shot of shots) {
    await capture(shot, baseUrl);
  }
  console.log('all shots taken');
} finally {
  server.kill('SIGKILL');
}
