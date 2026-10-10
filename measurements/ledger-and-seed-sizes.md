# Ledger, seed, and version sizes

This record holds the ledger blob size, the push bundle size, the gzip ratios, and the seed size. Re-measure against a real ledger and a real deployed build after a change to the seed, the version store, or the push payload.

## How to re-measure

Decode the seed baked into a built `index.html` and check its byte size. Clear storage on the live site and load it to see the empty state. Read `git log origin/data` for the ledger blob size and the push count. Diff two blobs to get the bundled delta size. Take a snapshot through the version store and compare its size before and after gzip. The prose gives no single script for all four. Some figures need `npm run check:seed`. The rest need a real browser and a real GitHub history.

## Reader

`npm run check:seed` reads the seed's key set, not its byte size. No reader holds the byte figures below.
