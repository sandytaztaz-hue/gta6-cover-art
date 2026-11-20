# VICE PURSUIT STUDIO

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Turn your photos and a caption into a GTA-style multi-panel magazine cover — in the browser, offline, in three steps. Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/c/gta6-cover-art-01).

## What it does

- **8 multi-panel layouts** — Magazine (hero left, three stacked right, billing strip below — the HEATWAVE look), Five panel (1 hero + 4 small), Hero + strip (1 big + 3 small), Grid (2×2), Diagonal (3 slanted panels), Triptych (3 tall panels), Collage (hero + 5 mosaic), Spotlight (one full-bleed photo). Every panel is a drop zone.
- **Any photo, any panel** — add photos from your device, drag-drop onto a panel, or load the built-in samples. One photo can fill all panels with different smart crops; each panel gets its own drag-to-position, zoom slider, and fit/cover switch, plus per-panel replace and clear.
- **Magazine furniture** — a giant gradient headline (orange → pink → purple, like a magazine masthead) with a pink script sub-caption, role tags (THE CLOSER, THE DRIVER, THE FIXER…), location + time labels (CORAL CAUSEWAY · 7:15 PM), a HEAT ★★★★★ badge, a HOT starburst seal, an EST. 2026 seal, a newspaper quote ("HOTTER THAN THE ASPHALT" — THE PALM GAZETTE), the five-star GTA wanted HUD, and a bottom billing strip with VOL. 06 and a barcode. Every piece toggles on and off.
- **6 canvas grades** — Sunset, Neon, Vice Night, Golden Hour, Noir, Miami Teal, each with strength, contrast and saturation sliders, plus film grain (seeded, so exports are deterministic), vignette and halftone print dots.
- **Title styles** — gradient fill, solid fill, or outline-only, in five colours, top or bottom.
- **Stickers** — sun, palm, star, flame and badge marks you can drop on the cover.
- **Undo / redo** — full history (Ctrl/Cmd+Z, Ctrl/Cmd+Y), 60 steps deep.
- **Full-resolution export** — 1080×1080, 1080×1350, 1920×1080 PNG, one click. The live preview and the export share one draw routine, so what you see is what the PNG holds. Drawing happens at native resolution, never upscaled, with high-quality smoothing and fonts loaded before the first paint.

## The look

A magazine cover, not a single-photo filter: the hero photo stays bright on top (no dark overlay), the gradient headline spans the lower hero, and the collage panels, badges, seals and billing strip make it read as a newsstand cover. The default cover is the Magazine layout in Golden Hour: the sunny palm-boulevard chase hero (orange supercar + sport bike side by side, a police interceptor and a second bike chasing behind) fills the big panel, with the neon night woman, the rainy downtown and the misty fishing pier stacked on the right.

## How to use

1. Open `app/index.html` in a browser (or serve the folder: `node serve.ts`, then http://localhost:8080). No install, no network, no account.
2. **Add a photo** — pick files, drop them on the preview, or press "Try a sample" / tap a thumbnail.
3. **Pick a layout + caption** — switch layouts, type the caption, choose a colour, a title style and a grade; tune the sliders; toggle the magazine furniture.
4. **Export PNG** — choose a size and press Export PNG. The file downloads at full resolution.

## Screenshots

- `1-cover.jpg` — best exported cover (landscape 1920×1080, Magazine, Golden Hour) — the sunny chase hero front and centre, "VICE PURSUIT" / "Coastline Nights", wanted stars, HEAT badge, HOT seal, quote and billing strip
- `2-editor.jpg` — the editor with the neon night scene loaded (Magazine, Golden Hour) — a different lead scene from the cover, so the editor shot never repeats the cover photo
- `3-cover-portrait.jpg` — portrait cover (1080×1350, Hero + strip, Neon) — the neon night street as the hero panel, "NEON PURSUIT" / "City After Dark"
- `4-cover-square.jpg` — square cover (1080×1080, Five panel, Vice Night) — the rainy downtown as the hero panel with the five-star wanted HUD, "VICE LIGHTS" / "One Last Job"

The covers are the PNGs the app itself wrote, scaled to JPEG for size. `shots.json` lists the deterministic `?shot=` URLs that produce them; `tools/shot.mjs` takes them with headless Chrome.

## Files

- `app/index.html`, `app/style.css` — page and dark editor UI
- `app/src/cover.js` — the cover engine: layouts, grades, headline, magazine furniture (role tags, location labels, HEAT badge, HOT seal, EST. 2026 seal, quote, billing strip, barcode), wanted-stars HUD, stickers, halftone, grain, vignette
- `app/src/main.js` — editor state, controls, drag-drop, per-panel zoom/pan, smart crops, undo/redo, export
- `app/src/shots.js` — deterministic `?shot=cover` / `?shot=editor` states
- `app/fonts/` — Bebas Neue, Anton, Archivo Black (SIL Open Font License, OFL.txt beside each)
- `app/samples/` — eight canvas paintings drawn in this session with headless Chrome (`tools/samples.html` + `tools/render-samples.mjs`), one distinct hero and one distinct atmosphere/weather each: the sunny palm-boulevard chase (orange supercar + sport bike, police interceptor and a second bike chasing behind), a rainy neon night with a woman in sunglasses and a red sports car, a golden-hour beach with a convertible and a surfer, a rainy downtown with a muscle car and a detective, a desert noon with an off-road truck and a biker in the dust, a harbor dusk with a speedboat and a yacht, a rooftop night with a helicopter and a skyline, and a misty dawn fishing pier with a boat and a fisherman
- `main.ts` — hands app/ + screenshots/ to /output with dossier.json (Node 22 stdlib only)
- `serve.ts` — tiny static server for local tries
- `tools/shot.mjs` — deterministic screenshot runner (headless Chrome over CDP)
- `tools/render-samples.mjs` + `tools/samples.html` — the in-session sample renderer

## Notes

- Everything runs offline: fonts and samples are local files, and the app makes no network requests.
- No Rockstar logo, artwork or font anywhere; the name "VICE PURSUIT STUDIO" is our own, and "VICE PURSUIT" is our own headline.
- The sample photos are canvas art drawn in this session, not Rockstar artwork and not photos of real people.
- No wallet, password or seed prompts, no cookies, no service worker, no `eval`.
