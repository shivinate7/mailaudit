# The parchment ledger's look and feel

This file holds the design-language prose the palette and motion records
left behind. It covers file notes, typography, color semantics, and two
section headings whose content moved elsewhere. Read it for what a control
looks like, alongside the palette and motion records it cites.

## Files, briefly

```
- `build.mjs` — bundles entry via esbuild and inlines the JS into a
  self-contained `index.html` with iOS home-screen-app meta tags. It also bakes
  in **the public seed** (see below): `git show ledger/data:ledger.json`,
  reduced to `SEED_KEEP`, gzipped and base64'd into a `<script id="seed">`.
- `index.html` — the build output, committed to the repo. GitHub Pages serves it
  at https://shivinate7.github.io/mailaudit/ . The user runs it as an iOS
  home-screen web app.
- `test/harness.mjs` + `test/app.test.mjs` — the behaviour suite (`npm test`).
- `dev-server.mjs` — optional local static server (`npm run serve`).

### The public seed

```

## Design language

```

## Design language

```

## Typography

```

Cochin (the `cochin` constant) for everything that isn't a number, monospace for
numbers/ids/labels. There is no sans in the app any more — the old `sans`
constant is gone and the root sets `serif`, which everything inherits.

```

## Color semantics

```

Semantics, which survived the repaint unchanged: green means received, red means
missing money or destructive, manila/gold means advisory, amber means the 14-day
lost-mail warning, and accent violet means "active control". The progress bar is
accent while in progress and green at 100% — it used to be `ink`, which worked
only because the old ink was a near-black *green*; the new ink is a near-black
violet and read as flat black on parchment. The two card bars carry the same
colours but no radius of their own: they lie on their card's top edge, where
the card's 10px corner already rounds them, and a pill there would read as a
second smaller shape floating inside the first. The masthead's keeps its pill.

Orphaned follows the same language: manila for anything advisory (the
ambiguity warning, the "as typed" row, the "no outstanding copy" tag), green
only on an exact match and the armed check-in confirm, red only on Discard.
Photo thumbnails are 56px squares; the viewer is a full-screen ink scrim, tap
anywhere to dismiss.

### Motion

```

## The card's reserved geometry

```

### The card's reserved geometry

```

## The palette

```

### The palette, and why each value is what it is

```

## See also

- `design-parchment-ledger` — the palette's name and inspiration.
- `design-form-controls-do-not-inherit-the-family` — why buttons need an explicit font rule.
- `design-the-view-switch-is-equal-thirds` — the view switch's own sizing rule.
- `palette-token-table-and-contrast-floor` — the full token table and its contrast floor.
- `palette-gold-is-ornament-only` — why gold never carries text.
- `card-reserved-geometry` — the measured numbers behind the card's fixed height.
