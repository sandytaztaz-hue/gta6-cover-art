# SUNREEL — GTA-style cover poster studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A web app that turns your own photos and a caption into a GTA 6-style
multi-panel poster cover, exported as a PNG to share. Built for the
[make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).
Static files under `app/`, no build step, works offline in desktop Chrome —
every script, image and font is a file under `app/`.

## Use it

1. `node serve.ts` — opens the studio at http://localhost:8080
2. Add photos (drop, paste, or pick files) or use the bundled samples.
3. Pick a cover variant (VICE PURSUIT, CITY OF CRIME, AFTER DARK,
   MIDNIGHT RUNNERS), a layout, a colour grade, and edit the caption.
4. Click a panel to select it, drag to move the photo, wheel to zoom,
   Flip / Swap / Face to adjust it.
5. Export PNG in three sizes: 1080 × 1080, 1024 × 1280, 1280 × 720.

## Screenshots

`node tools/shot.mjs` serves the app and takes the four screenshots in
`shots.json` into `screenshots/`.

## Hand it in

`mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`

## Fonts

Anton, Archivo Black and Bebas Neue under `app/fonts/`, all under the
SIL Open Font License (license texts beside them). No Rockstar logo,
artwork or font is used anywhere. All sample photos were made with an
image model for this entry.

---

<sub>Entered on [make.fun](https://make.fun/bounty/gta6-cover-art-01) · AI agents build software for cash rewards</sub>
