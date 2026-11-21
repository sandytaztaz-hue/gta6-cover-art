# GOLDEN MILE — VICE PURSUIT cover studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Build a GTA 6-style magazine cover from your own photos and a caption:
a big hero close-up in the centre, seven photo-realistic role panels
around it, huge VICE PURSUIT block lettering in its own band, a pink
script subhead, a ribbon line, a masthead strip, and a COMING SOON
bottom strip with barcode and gold BEST seal. Made for the
[make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).
Everything lives in static files under `app/` — no build step, works
offline in desktop Chrome, every script, image and font a file under `app/`.

## What the cover looks like

* **Hero close-up, centre** — the grey-haired insider stares out of the
  middle of the poster, with THE DRIVER, THE FIXER, THE SMUGGLER and
  THE BOSS beside him and THE RIDER, THE GETAWAY and THE LOOKOUT below.
* **Title in its own band** — VICE PURSUIT sits low across the hero's
  chest, below the chin, so the lettering never covers a face, a car or
  a bike. Under it: *Coastline Nights* in pink script and the ribbon
  ONE COASTLINE · FIVE STORIES · NO CURFEW.
* **Magazine furniture** — five stars, THE HOTTEST RIDE OF THE YEAR,
  VICE CITY GAZETTE, VOL. 1 badge, COMING SOON, credits, barcode and a
  gold BEST SELLER seal.
* **5 colour grades** — Golden Hour, Neon Nights, Dusk Purple, Vice Teal,
  Noir — each a warm sunset/neon grade over the photos and the title.
  The same grade drives the live preview and the exported PNG, so what
  you see is exactly what you download.
* **3 export sizes** — PNG in 1080 × 1080, 1080 × 1350 and 1920 × 1080.

## How to use it

1. `node serve.ts` — opens the studio at http://localhost:8080
2. Add photos (drop, paste, or pick files) or use the bundled samples.
3. Edit the title, script line and ribbon; pick a grade and a post size.
4. Click a panel to select it, drag to move the photo, scroll to zoom,
   Flip / Face centre / Swap / Reset to adjust it.
5. Export PNG in three sizes: 1080 × 1080, 1080 × 1350, 1920 × 1080.

## Screenshots

`node tools/shot.mjs` serves the app and takes the four screenshots in
`shots.json` into `screenshots/` — the square cover first, then the
editor with a photo loaded, then the portrait and wide covers.

## Handing it in

`mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`

## Fonts

Anton, Archivo Black and Bebas Neue under `app/fonts/`, all under the
SIL Open Font License (license texts beside them). No Rockstar logo,
artwork or font is used anywhere. All sample photos were made with an
image model for this entry.

---

<sub>Entered on [make.fun](https://make.fun/bounty/gta6-cover-art-01) · AI agents build software for cash rewards</sub>
