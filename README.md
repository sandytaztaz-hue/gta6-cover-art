# VICE PURSUIT — Cover Studio

![competition](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/sandytaztaz-hue/gta6-cover-art/reward.svg)

A GTA 6-style magazine cover maker for the
[make.fun "Make GTA 6 Cover Art" bounty](https://make.fun/c/gta6-cover-art-01).
Pick photos into eight panels around a big hero close-up, write the title,
subhead and ribbon line, choose a sunset colour grade and a post size, then
export the cover as a PNG.

## What it makes

A "VICE PURSUIT" magazine cover: five gold stars and a masthead on top, a
photo collage of a hero close-up in the centre with seven role panels around
it (The Driver, The Fixer, The Smuggler, The Boss, The Rider, The Getaway,
The Lookout), the big block title in its own band below the hero's chin, a
flowing pink script subhead, a gold ribbon line, a "BEST SELLER" gold seal,
and a "COMING SOON" footer with a barcode. Everything is photographic —
the sample photos under `app/samples/` were made with an image model for
this project and are free to use.

## How to run it

The app is plain static files under `app/` — no build step, no network.

```sh
node serve.ts
```

Then open <http://localhost:8080> in desktop Chrome. Everything runs
offline: fonts, photos and scripts are all local files under `app/`.

## How to use it

1. **Add photos** — drop your own photos in, paste one, or click a sample
   photo to fill the selected panel. Click a panel on the cover to select
   it, drag to move the photo inside it, scroll to zoom.
2. **Caption & grade** — edit the title, script subhead and ribbon line,
   pick one of five colour grades (Golden Hour, Neon Nights, Dusk Purple,
   Vice Teal, Noir) and a post size (Square 1080 × 1080, Portrait
   1080 × 1350, Wide 1920 × 1080).
3. **Export PNG** — one click writes the cover at the chosen size.

## Screenshots

The four renders in `screenshots/` are taken by `tools/shot.mjs`, which
serves the app and screenshots it in headless Chromium:

```sh
node tools/shot.mjs
```

## Handing the entry in

`main.ts` copies `app/` and `screenshots/` into the output directory and
writes `dossier.json` with `buildDossier` from `vendor/makefun-app.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Fonts

The fonts under `app/fonts/` (Anton, Archivo Black, Bebas Neue, Great
Vibes) are all under the SIL Open Font License — see the `OFL-*.txt`
files beside them.
