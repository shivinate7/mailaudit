# Ledger, seed, and version sizes

This record holds the ledger blob size, the push bundle size, the gzip ratios, and the seed size. Re-measure against a real ledger and a real deployed build after a change to the seed, the version store, or the push payload.

## How to re-measure

Decode the seed baked into a built `index.html` and check its byte size. Clear storage on the live site and load it to see the empty state. Read `git log origin/data` for the ledger blob size and the push count. Diff two blobs to get the bundled delta size. Take a snapshot through the version store and compare its size before and after gzip. The prose gives no single script for all four. Some figures need `npm run check:seed`. The rest need a real browser and a real GitHub history.

## Reader

`npm run check:seed` reads the seed's key set, not its byte size. No reader holds the byte figures below.

## The figures, as recorded

```
The site is public and the ledger repo is not, and **those are different
artifacts** — Pages serves `main` root and has never served the `data` branch.
So sharing the URL used to hand someone the app with nothing in it: their
browser's localStorage is their own and empty, and the fetch for the ledger
404s. Measured, on the live site with storage cleared: the whole page was the
masthead and "Drop your OrderWand CSV here".

It is a snapshot, not a feed: it refreshes when you deploy. Group 38d, all three
guards mutation-confirmed. Gzip+base64 because the real ledger is ~250KB and
deflates to 49KB inlined; `entry.jsx` inflates it with `DecompressionStream`,
the same primitive the version store uses, so `app.jsx` never learns how the
seed was packed.

Snapshots are
gzipped with `CompressionStream` (built into Safari, no dependency; ~235KB of
ledger JSON becomes ~25KB — measured 65,756 → 5,680 bytes, 11.6×), and the `gz`
flag rides in the metadata rather than being assumed.

The repo-growth worry that argued against it turned out to be small, and there
are numbers: the real ledger blob is **235KB**, and all **19 pushes** of it
bundle to **39KB** — git deltas near-identical JSON to roughly 2KB a version.
At tens of pushes a mail day that is single-digit MB a year.
```
