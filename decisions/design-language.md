# The parchment ledger's look and feel

This record covers the file notes, typography, and colour semantics of the app. The palette, motion, and card geometry rules have their own records, listed under See also. Read this record for what a control looks like.

## Files

- `build.mjs` bundles the entry file with esbuild. It inlines the JavaScript into a self-contained `index.html` with iOS home-screen-app meta tags. It also bakes in **the public seed**. The seed comes from `git show ledger/data:ledger.json`, reduced to `SEED_KEEP`. The build gzips it, base64 encodes it, and writes it into a `<script id="seed">`.
- `index.html` is the build output, committed to the repo. GitHub Pages serves it at https://shivinate7.github.io/mailaudit/ . The user runs it as an iOS home-screen web app.
- `test/harness.mjs` and `test/app.test.mjs` form the behaviour suite, run with `npm test`.
- `dev-server.mjs` is an optional local static server, run with `npm run serve`.

## Typography

Cochin, set by the `cochin` constant, is used for everything that is not a number. Monospace is used for numbers, ids, and labels. The app has no sans-serif font now. The `sans` constant is gone. The root sets `serif`, which every element inherits.

## Color semantics

Green is for received items. Red is for missing money or destructive actions. Manila and gold are for advisory items. Amber is for the 14-day lost-mail warning. Accent violet is for active controls.

The progress bar is accent while it is in progress. It is green at 100%. It is not `ink`. The ink is a near-black violet, so an `ink` bar would read as flat black on parchment. The two card bars use the same colours, with no radius of their own. They sit on the card's top edge, where the card's 10px corner already rounds them. A pill there would read as a second, smaller shape inside the first. The masthead bar keeps its pill.

Orphaned follows the same colour language. Manila marks anything advisory: the ambiguity warning, the "as typed" row, and the "no outstanding copy" tag. Green appears only on an exact match and on the armed check-in confirm. Red appears only on Discard. Photo thumbnails are 56px squares. The viewer is a full-screen ink scrim. Tap anywhere to dismiss it.

## Motion, card geometry, and palette

The motion rules are in the motion records. The card's fixed height is in `card-reserved-geometry`. The palette values are in `palette-token-table-and-contrast-floor`.

## See also

- `design-parchment-ledger` — the palette's name and inspiration.
- `design-form-controls-do-not-inherit-the-family` — why buttons need an explicit font rule.
- `design-the-view-switch-is-equal-thirds` — the view switch's own sizing rule.
- `palette-token-table-and-contrast-floor` — the full token table and its contrast floor.
- `palette-gold-is-ornament-only` — why gold never carries text.
- `card-reserved-geometry` — the measured numbers behind the card's fixed height.
