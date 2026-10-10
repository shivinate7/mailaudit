# A host migration resets phone storage

**Status:** open.

A move to Netlify or Cloudflare is on the table for faster deploys. Any new origin wipes both localStorage and IndexedDB on the phone. So each device needs a Backup + photos, then a restore, to keep its data through the move. The user knows this and is relaxed about it. If the move happens, the user accepts the cost.

## See also

- `every-origin-has-own-storage` — why a new host gives a new, empty ledger
- `storage-split-three-adapters` — what a Backup + photos restore has to carry across
