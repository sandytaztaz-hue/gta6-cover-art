# SUNREEL — poster cover studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Turn your photos and a caption into a GTA-style multi-panel magazine cover — in the browser, offline, in three steps. Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/c/gta6-cover-art-01).

## What it does

- **4 cover variants, one switcher** — VICE PURSUIT (Sunset Chase, the approved r10 cover, unchanged: sunny chase hero, neon driver, rainy fixer, canyon getaway, Everglades wildcard), CITY OF CRIME (Diagonal trio: rainy insider, fire-escape lookout, yellow tunnel chase), AFTER DARK (Hero + three: blue coupe hero, night market, truck woman, police helicopter), and MIDNIGHT RUNNERS (Six grid: green pickup, diner, motel bike, skater, speedboat, skyline). Each variant has its own title, script, tagline, quote, grade and strip line — story counts match panel counts (FIVE / THREE / FOUR / SIX STORIES). Switching a variant swaps everything in one click; the HEAT pill reads ★★★★☆ and the big wanted-stars pill stays off.
- **SUNREEL studio UI** — top bar with the SUNREEL logo, steps 1 Add photos → 2 Caption → 3 Export PNG, and Undo/Redo. Left: Add photos (+ Add photos, or drop · paste, photo thumbnail grid, Auto layout, Surprise me), five layouts (Hero mosaic, Hero + three, Six grid, Diagonal trio, Seven mosaic), six grades (Sunset, Neon night, Golden hour, Tropic teal, Heatwave, Ultraviolet), and Caption (Title / Script / Tagline, live). Centre: aspect-ratio switcher (1:1, 4:5, 16:9) and the cover preview. Right: Export PNG (1080×1080, 1080×1350, 1920×1080, Export all three), panel controls (Zoom, Photo prev/next, Reset, Flip, Swap, Face, Name tag), and LOOK & TITLE sliders (Paint, Grade, Halftone, Grain, Glow). Every control is real: layout switching rearranges the grid, grade switching re-grades the cover, caption fields edit the title live, the variant switcher swaps the whole cover.
- **Any photo, any panel** — add photos from your device, drag-drop onto a panel, or load the built-in samples. One photo can fill all panels with different smart crops; each panel gets its own drag-to-position, zoom slider, flip, swap and face framing, plus per-panel replace and clear.
- **Magazine furniture** — a giant gradient headline (orange → pink → purple, like a magazine masthead) with a pink script sub-caption and a gold tagline line, all inside their own dark band between the panels (never painted over a photo), role tags (THE INSIDER, THE LOOKOUT…), a HEAT ★★★★☆ badge (four filled stars, one empty — exactly like HEATWAVE), a gold CERTIFIED NO.1 seal, a COMING SOON corner badge, a newspaper quote ("HOTTER THAN THE ASPHALT" — THE PALM GAZETTE, all five small stars kept), and a bottom billing strip with VOL. 06 and a barcode. Every piece toggles on and off. No big five-star wanted pill anywhere.
- **6 canvas grades** — Sunset, Neon night, Golden hour, Tropic teal, Heatwave, Ultraviolet, each with Paint (saturation), Grade (strength), Halftone, Grain and Glow sliders, plus film grain (seeded, so exports are deterministic), vignette and halftone print dots.
- **Title styles** — gradient fill, solid fill, or outline-only, in five colours, top or bottom.
- **Stickers** — sun, palm, star, flame and badge marks you can drop on the cover.
- **Undo / redo** — full history (Ctrl/Cmd+Z, Ctrl/Cmd+Y), 60 steps deep.
- **Full-resolution export** — 1080×1080, 1080×1350, 1920×1080 PNG, one click each or all three at once. The live preview and the export share one draw routine, so what you see is what the PNG holds. Drawing happens at native resolution, never upscaled, with high-quality smoothing and fonts loaded before the first paint.

## The look

A magazine cover, not a single-photo filter: the hero photo stays bright on top (no dark overlay), the gradient headline spans its own dark band between the panel rows, and the collage panels, badges, seals and billing strip make it read as a newsstand cover. The default cover is V1 in Golden Hour: the sunny palm-boulevard chase hero (orange supercar + sport bike side by side, a police interceptor and a second bike chasing behind) fills the big panel, with the neon night woman, the rainy downtown, the misty fishing pier, the desert canyon sunset getaway and the Everglades dusk smuggler stacked on the right — five photographs, five stories, no big star pill at the top, and the HEAT badge reading ★★★★☆ in the title band, like HEATWAVE.

## How to use

1. Open `app/index.html` in a browser (or serve the folder: `node serve.ts`, then http://localhost:8080). No install, no network, no account.
2. **Add a photo** — pick files, drop them on the preview, or press "Try a sample" / tap a thumbnail.
3. **Pick a layout + caption** — switch layouts, type the caption, choose a colour, a title style and a grade; tune the sliders; toggle the magazine furniture.
4. **Export PNG** — choose a size and press Export PNG, or Export all three. The file downloads at full resolution.

## Screenshots

- `1-cover.jpg` — V1 VICE PURSUIT full cover (landscape 1920×1080, Sunset Chase, Golden Hour) — re-rendered fresh in the r11 session from the unchanged r10 cover, so it matches r10's cover exactly
- `2-editor.jpg` — the SUNREEL editor with the MIDNIGHT RUNNERS variant loaded (Six grid) — left panel (Add photos + layouts + grades + caption), centre preview, right panel (Export PNG + panel controls + LOOK & TITLE sliders), steps on top
- `3-cover-portrait.jpg` — CITY OF CRIME cover (portrait 1080×1350, Diagonal trio, Neon night) — rainy insider, fire-escape lookout, yellow tunnel chase
- `4-cover-square.jpg` — AFTER DARK cover (square 1080×1080, Hero + three, Ultraviolet) — blue coupe hero, night market, truck woman, police helicopter

The covers are the PNGs the app itself wrote, scaled to JPEG for size. `shots.json` lists the deterministic `?shot=` URLs that produce them; `tools/shot.mjs` takes them with headless Chrome.

## Files

- `app/index.html`, `app/style.css` — page and dark SUNREEL editor UI (three columns)
- `app/src/cover.js` — the cover engine: layouts (five SUNREEL layouts + four variant grids), six grades, headline band with tagline, magazine furniture (role tags, HEAT ★★★★☆ badge, CERTIFIED NO.1 seal, quote, billing strip, barcode), wanted-stars HUD (off by default), stickers, halftone, grain, vignette, per-panel flip
- `app/src/main.js` — editor state, controls, drag-drop, per-panel zoom/pan/flip/swap/face, variant switcher, auto layout, surprise me, undo/redo, export (one size or all three)
- `app/src/shots.js` — deterministic `?shot=cover` / `?shot=editor` states
- `app/fonts/` — Bebas Neue, Anton, Archivo Black (SIL Open Font License, OFL.txt beside each)
- `app/samples/` — thirty-four photographs made in this session, one distinct hero and one distinct atmosphere/weather each: V1's five (sunny palm-boulevard chase with orange supercar + sport bike and police behind, neon night driver, rainy downtown fixer, desert canyon sunset getaway, Everglades dusk wildcard) plus the thirteen r11 additions (rainy insider, fire-escape lookout, yellow tunnel chase, blue coupe on a wet boulevard, night market, truck woman at a gas station, police helicopter searchlight, vintage green pickup on a desert highway, drive-in diner at dusk, motel bike, skater at sunset, speedboat at dusk, skyline overlook) and the sixteen older samples
- `main.ts` — hands app/ + screenshots/ to /output with dossier.json (Node 22 stdlib only)
- `serve.ts` — tiny static server for local tries
- `tools/shot.mjs` — deterministic screenshot runner (headless Chrome over CDP)

## Notes

- Everything runs offline: fonts and samples are local files, and the app makes no network requests.
- No Rockstar logo, artwork or font anywhere; the name "SUNREEL" is our own studio name, and "VICE PURSUIT", "CITY OF CRIME", "AFTER DARK" and "MIDNIGHT RUNNERS" are our own headlines.
- The sample photos are photographs made in this session, not Rockstar artwork and not photos of real people.
- No wallet, password or seed prompts, no cookies, no service worker, no `eval`.

## Rebuild r11

V1 (VICE PURSUIT / Sunset Chase) is the r10 cover Sand approved, unchanged — same five photographs, same grid, same grade. The r11 work adds the SUNREEL studio UI and three new variants (CITY OF CRIME, AFTER DARK, MIDNIGHT RUNNERS) with thirteen all-new photographs, five SUNREEL layouts, six grades, and the tagline + Glow controls. Exactly four screenshots ship with this entry.
