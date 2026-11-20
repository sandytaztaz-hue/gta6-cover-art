# SUNREEL — GTA-style cover poster studio

A web app that turns your own photos and a caption into a GTA 6-style
multi-panel poster cover, exported as a PNG to share. Static files under
`app/`, no build step, works offline in desktop Chrome — every script,
image and font is a file under `app/`.

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
