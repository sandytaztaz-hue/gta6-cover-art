// SUNREEL — poster cover studio (rebuild r12, entry program, Node 22 stdlib only).
//
// r12: three photo swaps only — CITY OF CRIME's LOOKOUT is re-cast as a
// tattooed gangster man, AFTER DARK's MARKET and DRIVER are re-shot as
// a neon street party and a mid-chase driver. Everything else is r11.
//
// The app is this directory's app/ folder: plain static files a desktop
// browser loads offline (app/index.html and its ES modules, no library, no
// network request). This program hands it in: it copies app/ and
// screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library.
//
// The cover maker itself: a SUNREEL poster studio with four cover
// variants — V1 VICE PURSUIT (Sunset Chase, the approved r10 cover,
// unchanged), CITY OF CRIME (Diagonal trio, 3 photos), AFTER DARK
// (Hero + three, 4 photos) and MIDNIGHT RUNNERS (Six grid, 6 photos) —
// each with its own title, script, tagline, quote, grade and strip line,
// in five SUNREEL layouts with six grades, live caption editing, panel
// controls (zoom, flip, swap, face, name tag), LOOK & TITLE sliders
// (Paint, Grade, Halftone, Grain, Glow), and full-resolution PNG export
// at 1080×1080, 1080×1350 and 1920×1080. The big wanted-stars pill is
// OFF by default on every variant — it does not exist in the reference,
// and the HEAT pill reads ★★★★☆ (four filled, one empty) with five
// small stars on the quote strip only. Its thirty-seven sample photos
// (app/samples/) are real photographs made in this session — V1's five
// (the sunny palm boulevard chase with orange supercar + sport bike and
// police behind, the neon night driver, the rainy downtown fixer, the
// desert canyon sunset getaway and the Everglades dusk wildcard) plus
// the thirteen r11 additions (a rainy insider, a fire-escape lookout,
// a yellow tunnel chase, a blue coupe on a wet boulevard, a night
// market, a truck woman at a gas station, a police helicopter
// searchlight, a vintage green pickup, a drive-in diner, a motel bike,
// a skater at sunset, a speedboat at dusk and a skyline overlook) plus
// the three r12 replacements (a tattooed gangster lookout in a neon
// alley, a chase driver gripping the wheel mid high-speed chase, a neon
// boulevard street party with lowriders) and the sixteen older samples.
// The three r11 photos the r12 shots replace stay on disk, unreferenced.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB
// of app files, in all, or a path under app/ over 1000 bytes: app/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
// NOTE (r11): the entry ships exactly FOUR screenshots in screenshots/
// (V1 cover, editor, CITY OF CRIME portrait, AFTER DARK square) — inside
// the scorer's 4-screenshot cap above.
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
  `VICE PURSUIT STUDIO handed in: ${appEntries} app entries, ` +
  `${shotEntries} screenshots, dossier written to ${join(out, 'dossier.json')}`,
);
