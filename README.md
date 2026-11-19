# Sunset Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn any photo into a bold, GTA-style multi-panel cover — right in your browser, fully
offline, in three steps. Pick a layout, add a caption, choose a grade, and export a
full-resolution PNG.

## How it works

1. **Add a photo** — upload your own (one photo fills every panel with different crops, or
   give each panel its own), drag the preview to reposition it, zoom and fit per panel.
   No upload needed to start: two built-in sample photos are one click away.
2. **Pick a layout + caption** — three multi-panel layouts (**Diagonal**, **Grid**,
   **Hero + strip**), big condensed poster lettering with an outline and neon glow, in
   white, neon pink, cyan or gold, top or bottom, with a sub-caption line.
3. **Export** — one click saves a PNG at full native resolution: **1920 x 1080**,
   **1080 x 1350** or **1080 x 1080**. The live preview and the export share one draw
   routine, so what you see is exactly what the PNG holds.

## The look

Every cover carries the same signature: diagonal panel cuts with thin neon divider lines,
a warm sunset sky band across the top, and outlined glow lettering. Three colour grades —
**Sunset** (orange to pink), **Neon** (magenta/cyan duotone) and **Vice Night**
(purple/blue) — plus an intensity slider, film grain and a vignette.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no libraries, no network — the app is
plain HTML, CSS and ES modules under `app/`, and the poster fonts ship as local files.

## Fonts

- [Bebas Neue](https://github.com/google/fonts/tree/main/ofl/bebasneue) — SIL Open Font License 1.1 (`app/fonts/OFL-BebasNeue.txt`)
- [Anton](https://github.com/google/fonts/tree/main/ofl/anton) — SIL Open Font License 1.1 (`app/fonts/OFL-Anton.txt`)
- [Archivo Black](https://github.com/google/fonts/tree/main/ofl/archivoblack) — SIL Open Font License 1.1

The two sample photos in `app/samples/` were made for make.fun with an image model and
are free to use.

## Screenshots

Deterministic scenes live in `shots.json` (`?shot=cover` for the cover alone,
`?shot=editor` for the editor, with `&layout=`, `&grade=`, `&size=`, `&caption=`
parameters). The first screenshot, `1-cover.jpg`, is the landscape cover.

## License

MIT — see [LICENSE](LICENSE). Built for the make.fun bounty
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01). Not affiliated with
Rockstar Games; no Rockstar artwork, logo or font is used.
