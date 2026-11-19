# Duskline Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Turn your photos and a caption into GTA-style multi-panel cover art — in the browser, offline, in three steps. Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/c/gta6-cover-art-01).

## What it does

- **4 multi-panel layouts** — Diagonal (3 slanted panels, poster feel), Grid (2×2), Hero + strip (1 big panel + 3 small — the best frame for the chase hero), Five panel (1 hero panel + 4 small below — five photos on one cover). Every panel is a drop zone.
- **Any photo, any panel** — add photos from your device, drag-drop onto a panel, or load the built-in samples. One photo can fill all panels with different crops; each panel gets its own drag-to-position, zoom slider, and fit/cover switch.
- **Big bold caption** — editable main caption + sub-caption in condensed poster lettering (Bebas Neue / Anton), with colour (white, neon pink, cyan, gold), top/bottom position, dark outline and a coloured glow. The size auto-fits the frame width. The default cover reads "VICE PURSUIT" over "EVERY MILE A GETAWAY".
- **4 canvas grades** — Sunset (orange-pink warmth), Neon (magenta/cyan duotone), Vice Night (purple/blue), Golden Hour (warm amber/gold glow), each with an intensity slider, plus film grain (seeded, so exports are deterministic) and a vignette toggle.
- **Full-resolution export** — 1080×1080, 1080×1350, 1920×1080 PNG, one click. The live preview and the export share one draw routine, so what you see is what the PNG holds. Drawing happens at native resolution, never upscaled, with high-quality smoothing and fonts loaded before the first paint.

## The look

Diagonal panel cuts with thin neon divider lines, a sunset sky band with a glowing sun across the top, and outlined glow lettering — a cover that reads as ours, not a single-photo filter. The five-panel layout packs five moments into one cover, and Golden Hour bathes it in warm amber light. The hero is a photo-real chase: an orange supercar and a sport bike racing side by side down a sunny palm boulevard, big in the frame, with four more photo-real panels below it.

## How to use

1. Open `app/index.html` in a browser (or serve the folder: `node serve.ts`, then http://localhost:8080). No install, no network, no account.
2. **Add a photo** — pick files, drop them on the preview, or press "Try a sample".
3. **Pick a layout + caption** — switch layouts, type the caption, choose a colour and a grade.
4. **Export PNG** — choose a size and press Export PNG. The file downloads at full resolution.

## Screenshots

- `1-cover.jpg` — best exported cover (landscape 1920×1080, Five panel, Golden Hour) — the photo-real Lambo + Ducati chase hero front and centre, "VICE PURSUIT", with driver, beach, police chase and neon panels below it
- `2-editor.jpg` — the editor with the sunset beach scene loaded (Five panel, Golden Hour) — a different lead scene from the cover, so the editor shot never repeats the cover photo
- `3-cover-portrait.jpg` — portrait cover (1080×1350, Hero + strip, Neon) — the neon night street as the hero panel, "NEON PURSUIT"
- `4-cover-square.jpg` — square cover (1080×1080, Hero + strip, Vice Night) — the police-chase scene as the hero panel with the five-star wanted HUD top-right, "VICE LIGHTS"

The covers are the PNGs the app itself wrote, scaled to JPEG for size. `shots.json` lists the deterministic `?shot=` URLs that produce them; `tools/shot.mjs` takes them with headless Chrome.

## Files

- `app/index.html`, `app/style.css` — page and dark editor UI
- `app/src/cover.js` — the cover engine: layouts, grades, sky band, caption, grain, vignette, and the GTA wanted-stars HUD (3–5 solid gold stars on a dark pill, top-right)
- `app/src/main.js` — editor state, controls, drag-drop, per-panel zoom/pan, export
- `app/src/shots.js` — deterministic `?shot=cover` / `?shot=editor` states
- `app/fonts/` — Bebas Neue, Anton, Archivo Black (SIL Open Font License, OFL.txt beside each)
- `app/samples/` — eight photo-real photos made with an image model, one distinct scene each: the chase hero (orange supercar + black/red Ducati side by side on a sunny palm boulevard), a driver with his helmet by the car, a sunset beachfront, a police chase (the same Lambo + Ducati fleeing a black-and-white interceptor with a flashing light bar), a woman in a leather jacket leaning on the orange Lambo, a neon street at night, a supercar headlight close-up, and a desert highway at dusk. Two older starter samples (boulevard.jpg, pier.jpg) are still in the folder but no longer wired in.
- `main.ts` — hands app/ + screenshots/ to /output with dossier.json (Node 22 stdlib only)
- `serve.ts` — tiny static server for local tries

## Notes

- Everything runs offline: fonts and samples are local files, and the app makes no network requests.
- No Rockstar logo, artwork or font anywhere; the name "Duskline Cover Studio" is our own, and "VICE PURSUIT" is our own headline.
- The sample photos are AI-made photographs, not Rockstar artwork and not photos of real people.
- No wallet, password or seed prompts, no cookies, no service worker, no `eval`.
