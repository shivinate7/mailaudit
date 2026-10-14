# Ledger, seed, and version sizes

This record holds the ledger blob size, the push bundle size, the gzip ratios, and the seed size. Re-measure against a real ledger and a real deployed build after a change to the seed, the version store, or the push payload.

## How to re-measure

Decode the seed baked into a built `index.html` and check its byte size. Clear storage on the live site and load it to see the empty state. Read `git log origin/data` for the ledger blob size and the push count. Diff two blobs to get the bundled delta size. Take a snapshot through the version store and compare its size before and after gzip. The prose gives no single script for all four. Some figures need `npm run check:seed`. The rest need a real browser and a real GitHub history.

## Reader

`npm run check:seed` reads the seed's key set, not its byte size. No reader holds the byte figures below.

## Figures

The site is public, and the ledger repo is not. Those are different artifacts. Pages serves the `main` root and has never served the `data` branch. Without a seed, a visitor gets the app with nothing in it. Their browser's localStorage is their own and empty, and the fetch for the ledger 404s. Measured on the live site with storage cleared, the whole page was the masthead and the upload prompt "Drop your OrderWand CSV here".

The seed is a snapshot, not a feed. It refreshes when you deploy. It is gzip and base64 encoded, because the real ledger is ~250KB and deflates to 49KB inlined. `entry.jsx` inflates it with `DecompressionStream`, the same primitive the version store uses. So `app.jsx` never learns how the seed was packed. The seed guards are in group 38d, and all three are mutation-confirmed.

Snapshots are gzipped with `CompressionStream`. That is built into Safari, so it needs no dependency. ~235KB of ledger JSON becomes ~25KB. The measured figure is 65,756 → 5,680 bytes, a ratio of 11.6×. The `gz` flag rides in the metadata, so the app never assumes compression happened.

The real ledger blob is 235KB. All 19 pushes of it bundle to 39KB. Git deltas near-identical JSON to roughly 2KB a version. At tens of pushes a mail day, that is single-digit MB a year.

`receivedAt` is never pruned. Its size is debt `received-at-size-unmeasured`.
