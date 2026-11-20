// VICE PURSUIT — sample-scene renderer (rebuild r7).
//
// Drives headless Chrome over its DevTools protocol (plain WebSocket, no
// library), loads tools/samples.html, calls window.renderScene(key) for
// each of the eight scenes, and saves the JPEGs into app/samples/. Every
// sample is drawn in this session — no copied image files anywhere.
//
//   node tools/render-samples.mjs
//
// Chrome: /home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CHROME = '/home/hatch/.cache/puppeteer/chrome/linux-157.0.8103.50/chrome-linux64/chrome';
const SCENES = ['chase', 'neon', 'beach', 'rain', 'desert', 'harbor', 'rooftop', 'pier'];

const here = fileURLToPath(new URL('..', import.meta.url));
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

/** Minimal CDP client over Node's built-in WebSocket. */
class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  ready() {
    return new Promise((resolve, reject) => {
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

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(`page error: ${JSON.stringify(r.exceptionDetails)}`);
    return r.result.value;
  }

  close() {
    try { this.ws.close(); } catch { /* already closed */ }
  }
}

// ---------------------------------------------------------------- run

const profile = mkdtempSync(join(tmpdir(), 'vice-samples-'));
const pageUrl = pathToFileURL(join(here, 'tools', 'samples.html')).href;
const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--remote-debugging-port=9223',
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' });

try {
  await waitFor(
    async () => {
      const res = await fetch('http://127.0.0.1:9223/json/version');
      if (!res.ok) throw new Error('devtools not up');
      return res.json();
    },
    20000,
    'chrome devtools',
  );
  const targetRes = await fetch(
    `http://127.0.0.1:9223/json/new?${encodeURIComponent(pageUrl)}`,
    { method: 'PUT' },
  );
  if (!targetRes.ok) throw new Error(`could not open target (${targetRes.status})`);
  const target = await targetRes.json();
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.ready();
  try {
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: pageUrl });
    await waitFor(
      async () => (await cdp.eval('window.__samplesReady === true')) === true,
      30000,
      '__samplesReady',
    );
    for (const key of SCENES) {
      const dataUrl = await cdp.eval(`window.renderScene(${JSON.stringify(key)})`);
      const base64 = dataUrl.split(',')[1];
      const bytes = Buffer.from(base64, 'base64');
      writeFileSync(join(here, 'app', 'samples', `${key}.jpg`), bytes);
      console.log(`${key}.jpg: ${bytes.length} bytes`);
    }
    console.log('all 8 samples rendered in-session');
  } finally {
    cdp.close();
    try { await fetch(`http://127.0.0.1:9223/json/close/${target.id}`); } catch { /* chrome is going away */ }
  }
} finally {
  chrome.kill('SIGKILL');
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
}
