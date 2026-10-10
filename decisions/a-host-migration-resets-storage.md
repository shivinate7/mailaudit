# A host migration resets phone storage

**Status:** open.

A move to Netlify or Cloudflare is on the table for faster deploys. Any new origin wipes both localStorage and IndexedDB on the phone. That means every device needs a Backup plus photos, then a restore, to survive the move. The user knows this and accepts the cost if the move happens.

## See also

- `every-origin-has-own-storage` — why a new host means a new, empty ledger
- `storage-split-three-adapters` — what a Backup + photos restore has to carry across
