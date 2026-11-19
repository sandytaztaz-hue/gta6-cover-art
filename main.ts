// Duskline Cover Studio — entry program (Node 22, standard library only).
//
// The app is this directory's app/ folder: plain static files a desktop browser
// loads offline (app/index.html and its ES modules, no library, no network
// request). This program hands it in: it copies app/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library.
//
// The cover maker itself: four multi-panel layouts (Diagonal, Grid,
// Hero + strip, Five panel), four canvas grades (Sunset, Neon, Vice Night,
// Golden Hour), a big outlined glow caption, and full-resolution PNG export
// at 1080×1080, 1080×1350 and 1920×1080. Its five sample photos
// (app/samples/) — a photo-real chase hero (orange supercar + sport bike on
// a sunny palm boulevard) plus four panel photos (driver, beach, detail,
// neon) — were made with an image model and are free to use.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside
// /output's own 1000-entry cap, its screenshots/ and dossier.json).
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copy a tree that may or may not exist yet; report how many top-level entries landed. */
function copyIfPresent(from: string, to: string): number {
  if (!existsSync(from)) return 0;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  return readdirSync(from).length;
}

mkdirSync(out, { recursive: true });
const appEntries = copyIfPresent(join(here, 'app'), join(out, 'app'));
const shotEntries = copyIfPresent(join(here, 'screenshots'), join(out, 'screenshots'));

writeFileSync(join(out, 'dossier.json'), buildDossier(out, DOSSIER_CAPS));

console.log(
  `Duskline Cover Studio — VICE PURSUIT handed in: ${appEntries} app entries, ` +
  `${shotEntries} screenshots, dossier written to ${join(out, 'dossier.json')}`,
);
