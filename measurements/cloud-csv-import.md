# One CSV import from a cloud session

**Status:** measured once, 2026-11-15 13:24 CST, by the coordinator. This lane re-read the ledger afterwards (GET only): rev 14, 1260 items.

This record holds the figures of the one CSV import made from a cloud session. The steps are in `cloud-session-reach`. Re-measure by taking the ledger copy before the POST and comparing it with the ledger read after.

## Figures

- The OrderWand CSV of 2026-11-15 went through `parseItems` (`src/view-rules.mjs`), then `mergeItems` (`src/merge-rules.mjs`), then `POST /ledger`.
- The live ledger went from rev 13 to rev 14, and from 1201 items to 1260 (59 added).
- No stored line changed, and the `received` marks were byte-equal.
- That run updated no stored line, because `mergeItems` kept the base by default. 514 stored lines differed from that CSV in `tracking`. The owner ruled that a re-import refreshes `tracking` (`imports-merge-never-replace`). The web import now does. This run is not repeated.
