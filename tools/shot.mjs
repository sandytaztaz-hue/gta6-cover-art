// VICE PURSUIT — screenshot runner.
// Opens each view from shots.json in headless Chromium over the DevTools
// protocol, waits until the app signals it has painted
// (window.__shotReady), and saves a JPEG under 256 KiB per shot.
//
//   node tools/shot.mjs
//
// Uses only the Node standard library: the browser is driven over a
// WebSocket to its DevTools endpoint (global WebSocket, Node 22+).
//
// The app is plain static files, so it is rendered straight from the
// repository over file:// (this machine's Chromium build blocks
// top-level navigation to a localhost server with its Local Network
// Access checks; --allow-file-access-from-files lets the page's ES
// modules, fonts and photos load from disk). The app itself is served
// over HTTP by serve.ts, exactly as the competition's static hosting
// serves it.

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shotsPath = join(repoRoot, 'shots.json');
const chromeBin = process.env.CHROME_BIN ?? '/opt/meta-chromium/chrome';
const debugPort = Number(process.env.SHOT_DEBUG_PORT ?? 9224);
const maxShotBytes = 262144;

const shots = JSON.parse(readFileSync(shotsPath, 'utf8')).shots;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForJson(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // browser not up yet
    }
    await sleep(200);
  }
  throw new Error(`browser DevTools did not answer at ${url}`);
}

/** Minimal DevTools-protocol client over one browser WebSocket. */
class DevTools {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.ws = new WebSocket(wsUrl);
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }

  ready() {
    return new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }

  close() {
    this.ws.close();
  }
}

async function captureShot(devtools, shot, attemptQuality) {
  const url = `file://${join(repoRoot, 'app', 'index.html')}?shot=${shot.view}`;
  const target = await devtools.send('Target.createTarget', { url });
  const session = await devtools.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const sessionId = session.sessionId;
  try {
    await devtools.send('Page.enable', {}, sessionId);
    await devtools.send('Emulation.setDeviceMetricsOverride', {
      width: shot.width, height: shot.height, deviceScaleFactor: 1, mobile: false,
    }, sessionId);
    const start = Date.now();
    for (;;) {
      const ready = await devtools.send('Runtime.evaluate', {
        expression: 'window.__shotReady === true',
        returnByValue: true,
      }, sessionId);
      if (ready && ready.result && ready.result.value) break;
      if (Date.now() - start > 30000) throw new Error(`shot ${shot.file}: app never signalled ready`);
      await sleep(200);
    }
    await sleep(300);
    for (const quality of attemptQuality) {
      const shotResult = await devtools.send('Page.captureScreenshot', {
        format: 'jpeg', quality, captureBeyondViewport: false,
      }, sessionId);
      const bytes = Buffer.from(shotResult.data, 'base64');
      if (bytes.length <= maxShotBytes || quality === attemptQuality[attemptQuality.length - 1]) {
        return { bytes, quality };
      }
    }
    throw new Error(`shot ${shot.file}: still over ${maxShotBytes} bytes at lowest quality`);
  } finally {
    await devtools.send('Target.closeTarget', { targetId: target.targetId }).catch(() => {});
  }
}

async function main() {
  if (!existsSync(chromeBin)) throw new Error(`no Chromium at ${chromeBin} (set CHROME_BIN)`);
  const workDir = mkdtempSync(join(tmpdir(), 'vice-pursuit-shots-'));
  const policyFile = join(workDir, 'webgl-policy.txt');
  writeFileSync(policyFile, 'hatch-webgl-allowed-domains-v1\nexample.com\n');
  const policySha = createHash('sha256').update(readFileSync(policyFile)).digest('hex');

  const browser = spawn(chromeBin, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--no-first-run', '--hide-scrollbars', '--allow-file-access-from-files',
    `--user-data-dir=${join(workDir, 'profile')}`,
    `--remote-debugging-port=${debugPort}`,
    `--hatch-webgl-allowed-domains-file=${policyFile}`,
    `--hatch-webgl-allowed-domains-sha256=${policySha}`,
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    const version = await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
    const devtools = new DevTools(version.webSocketDebuggerUrl);
    await devtools.ready();
    for (const shot of shots) {
      const { bytes, quality } = await captureShot(devtools, shot, [82, 72, 62, 52]);
      const outPath = join(repoRoot, 'screenshots', shot.file);
      writeFileSync(outPath, bytes);
      console.log(`${shot.file}: ${shot.width}x${shot.height}, ${bytes.length} bytes (quality ${quality})`);
    }
    devtools.close();
  } finally {
    browser.kill('SIGKILL');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
