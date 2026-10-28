# CSV import stays on the web app

**Status:** ruled. The owner accepted this on 2026-10-11 with "all seem fine". The native client has no CSV import and no upload zone.

Orders enter the ledger through the web app's CSV import. The Worker syncs them to the native client. Once the nightly orders job exists, a cron on the Worker adds orders too (owner ruling 2026-10-27 20:19 CDT, `sync-revamp-cloudflare`). The planned cron reuses `parseItems`, so `parser-filters` keeps one home. A Swift port of the importer would give it a second home.

**Holds while:** `parseItems` is the only code that applies `parser-filters` (the web import calls it, and the planned cron will too), and the native client has no CSV import.

## Why

- `parser-filters` keeps only TCG purchases. One parser enforces it. A Swift parser would need its own tests for the same rule.
- `imports-merge-never-replace` holds for the one importer. A second importer would need the same proof.
- The nightly orders job will replace the OrderWand export, see `sync-revamp-cloudflare`. It is planned as a cron on the Worker that reads TCGplayer's order-history page. Part of its route is measured, and the job is unbuilt, debt `orders-job-unbuilt`. The page has no Type or Vendor column. The job's rows pass through the same `parseItems`, which keeps a blank Type and a blank Vendor, so `parser-filters` holds. To emit Type purchase and Vendor TCG is a design choice, not a requirement (design, unbuilt). It adds orders in the Worker, so both clients get them through the sync. So a native import would serve only the gap before the job exists.

## Rejected

A Worker route `POST /import` that runs the parser for both clients. The design is that the Worker's own cron fetches the orders and runs the same `parseItems` and merge there, so no client needs an import route. This is unbuilt.

## See also

- `orderwand-csv` — the CSV schema and its quirks.
- `native-parity-table` — the row for CSV import.
- `sync-revamp-cloudflare` — the nightly orders job.
