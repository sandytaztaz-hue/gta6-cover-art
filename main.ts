// Sunset Cover Studio — the make.fun entry program for gta6-cover-art-01 (Node 22, stdlib only).
//
// What it hands in: this directory's app/ folder — a plain offline single-page app
// (index.html plus ES modules, no library, no network request) — and the screenshots/ folder,
// four JPEGs whose first file by name is the landscape cover. The program copies both trees
// into /output and writes /output/dossier.json, the summary the judge reads, using the
// vendored make.fun library. The app itself is the entry: a multi-panel GTA-style cover
// maker with three layouts, three colour grades, editable condensed caption lettering, and
// full-resolution PNG export at 1920x1080, 1080x1350 or 1080x1080. Its two sample photos
// (app/samples/) were made for make.fun with an image model and are free to use.
//
// Try it locally: `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The folder this file lives in, and the folder the grader collects from. Both are resolved
// from this file's own URL so the program works wherever the repo is checked out.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps (reference/gate.json): text_max_bytes shapes the dossier bytes;
// the rest refuse an entry the scorer would refuse — more than 4 screenshots or one over
// 256 KiB; more than 993 files in app/ or 48 MiB of app files in all; or a path under app/
// over 1000 bytes. (app/ counts beside /output's own 1000-entry cap, its screenshots/ and
// dossier.json.)
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
}

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_LIMITS));
