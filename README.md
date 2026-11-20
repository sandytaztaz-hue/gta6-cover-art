# VICE PURSUIT STUDIO

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Turn your photos and a caption into a GTA-style multi-panel magazine cover — in the browser, offline, in three steps. Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/c/gta6-cover-art-01).

## What it does

- **4 cover variants, one switcher** — Sunset Chase, Neon Nights, Golden Coast and Full Throttle, each five distinct photographs in the SUNSET SYNDICATE collage grid (two rows, giant VICE PURSUIT headline in a band across the middle, yellow label pill on every panel, gold CERTIFIED NO.1 seal, COMING SOON badge, cream bottom strip with a small-star quote and barcode). Switching a variant swaps its five photos, its grade and its strip line in one click; the title stays VICE PURSUIT / Coastline Nights on every variant, the HEAT pill reads ★★★★☆ and the big wanted-stars pill stays off. Legacy Five panel and Hero + strip layouts remain.
- **Any photo, any panel** — add photos from your device, drag-drop onto a panel, or load the built-in samples. One photo can fill all panels with different smart crops; each panel gets its own drag-to-position, zoom slider, and fit/cover switch, plus per-panel replace and clear.
- **Magazine furniture** — a giant gradient headline (orange → pink → purple, like a magazine masthead) with a pink script sub-caption, role tags (THE CLOSER, THE DRIVER, THE FIXER…), location + time labels (CORAL CAUSEWAY · 7:15 PM), a HEAT ★★★★☆ badge (four filled stars, one empty — exactly like HEATWAVE), a HOT starburst seal, an EST. 2026 seal, a newspaper quote ("HOTTER THAN THE ASPHALT" — THE PALM GAZETTE, all five small stars kept), and a bottom billing strip with VOL. 06 and a barcode. Every piece toggles on and off. The big five-star wanted pill at the top is OFF by default — it does not exist in HEATWAVE; only the portrait/square variants keep theirs.
- **3 canvas grades** — Golden Hour, Neon, Vice Night, each with strength, contrast and saturation sliders, plus film grain (seeded, so exports are deterministic), vignette and halftone print dots.
- **Title styles** — gradient fill, solid fill, or outline-only, in five colours, top or bottom.
- **Stickers** — sun, palm, star, flame and badge marks you can drop on the cover.
- **Undo / redo** — full history (Ctrl/Cmd+Z, Ctrl/Cmd+Y), 60 steps deep.
- **Full-resolution export** — 1080×1080, 1080×1350, 1920×1080 PNG, one click. The live preview and the export share one draw routine, so what you see is what the PNG holds. Drawing happens at native resolution, never upscaled, with high-quality smoothing and fonts loaded before the first paint.

## The look

A magazine cover, not a single-photo filter: the hero photo stays bright on top (no dark overlay), the gradient headline spans the lower hero, and the collage panels, badges, seals and billing strip make it read as a newsstand cover. The default cover is the Magazine layout in Golden Hour: the sunny palm-boulevard chase hero (orange supercar + sport bike side by side, a police interceptor and a second bike chasing behind) fills the big panel, with the neon night woman, the rainy downtown, the misty fishing pier, the desert canyon sunset getaway and the Everglades dusk smuggler stacked on the right — six photographs, six stories, no big star pill at the top, and the HEAT badge reading ★★★★☆ at the top-right corner, like HEATWAVE.

## How to use

1. Open `app/index.html` in a browser (or serve the folder: `node serve.ts`, then http://localhost:8080). No install, no network, no account.
2. **Add a photo** — pick files, drop them on the preview, or press "Try a sample" / tap a thumbnail.
3. **Pick a layout + caption** — switch layouts, type the caption, choose a colour, a title style and a grade; tune the sliders; toggle the magazine furniture.
4. **Export PNG** — choose a size and press Export PNG. The file downloads at full resolution.

## Screenshots

- `1-cover.jpg` — best exported cover (landscape 1920×1080, Sunset Chase, Golden Hour) — the sunny chase hero front and centre, five photo panels, "VICE PURSUIT" / "Coastline Nights" in the middle band, yellow pills, CERTIFIED NO.1 seal, quote and billing strip, no big wanted-stars pill
- `2-editor.jpg` — the editor with the Neon Nights variant loaded and the variant switcher visible — a different variant from the cover, so the editor shot never repeats the cover
- `3-cover-portrait.jpg` — portrait cover (1080×1350, Golden Coast, Golden Hour) — the sunny coast as the lead panel, "VICE PURSUIT" / "Coastline Nights"
- `4-cover-square.jpg` — square cover (1080×1080, Full Throttle, Vice Night) — the modern + classic sunset duo as the lead panel, "VICE PURSUIT" / "Coastline Nights"
- `5-variant-2.jpg` — Neon Nights cover (landscape) — neon strip, dusk charmer, rooftop, palm boulevard, classic muscle car
- `6-variant-3.jpg` — Golden Coast cover (landscape) — sunny coast, beach, misty pier, vintage Cadillac, modern sunset racer
- `7-variant-4.jpg` — Full Throttle cover (landscape) — sunset duo, rider, garage mechanic, harbour, desert

The covers are the PNGs the app itself wrote, scaled to JPEG for size. `shots.json` lists the deterministic `?shot=` URLs that produce them; `tools/shot.mjs` takes them with headless Chrome.

## Files

- `app/index.html`, `app/style.css` — page and dark editor UI
- `app/src/cover.js` — the cover engine: layouts, grades, headline, magazine furniture (role tags, location labels, HEAT ★★★★☆ badge, HOT seal, EST. 2026 seal, quote, billing strip, barcode), wanted-stars HUD (off by default; only the portrait/square variants use it), stickers, halftone, grain, vignette
- `app/src/main.js` — editor state, controls, drag-drop, per-panel zoom/pan, smart crops, undo/redo, export
- `app/src/shots.js` — deterministic `?shot=cover` / `?shot=editor` states
- `app/fonts/` — Bebas Neue, Anton, Archivo Black (SIL Open Font License, OFL.txt beside each)
- `app/samples/` — ten photographs made in this session, one distinct hero and one distinct atmosphere/weather each: the sunny palm-boulevard chase (orange supercar + sport bike, police interceptor and a second bike chasing behind), a rainy neon night with a woman in sunglasses and a red sports car, a golden-hour beach with a convertible and a surfer, a rainy downtown with a muscle car and a detective, a desert noon with a muscle car and a biker in the dust, a harbor dusk with a speedboat and a yacht, a rooftop night with a helicopter and a skyline, a misty dawn fishing pier with a boat and a fisherman, a desert canyon sunset with an orange muscle car on a winding red-rock road, and an Everglades dusk with an airboat and a heron on a sawgrass marsh
- `main.ts` — hands app/ + screenshots/ to /output with dossier.json (Node 22 stdlib only)
- `serve.ts` — tiny static server for local tries
- `tools/shot.mjs` — deterministic screenshot runner (headless Chrome over CDP)

## Notes

- Everything runs offline: fonts and samples are local files, and the app makes no network requests.
- No Rockstar logo, artwork or font anywhere; the name "VICE PURSUIT STUDIO" is our own, and "VICE PURSUIT" is our own headline.
- The sample photos are photographs made in this session, not Rockstar artwork and not photos of real people.
- No wallet, password or seed prompts, no cookies, no service worker, no `eval`.
