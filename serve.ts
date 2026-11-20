// GOLDEN MILE — a tiny static server for app/ (Node 22, standard
// library only), so the cover studio can be tried locally with no
// build step and no network:
//
//   node serve.ts            serves app/ on http://localhost:8080
//   node serve.ts --port 8090
//
// It sends the MIME types an offline web app needs, refuses any path
// outside app/, and otherwise does nothing clever. Photos are read
// from the visitor's own machine, never uploaded.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const requested = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

function goldenMileSafePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const cleaned = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const target = join(root, cleaned === '/' || cleaned === '' ? 'index.html' : cleaned);
  return target === root || target.startsWith(root + sep) ? target : null;
}

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'content-type': 'text/plain' });
    res.end('method not allowed');
    return;
  }
  const target = goldenMileSafePath(req.url || '/');
  if (!target) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('forbidden');
    return;
  }
  let file = target;
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`GOLDEN MILE app/ is on http://localhost:${port}`);
});
