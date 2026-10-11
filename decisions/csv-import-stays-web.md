# CSV import stays on the web app

**Status:** ruled. The owner accepted this on 2026-10-11 with "all seem fine". The native client has no CSV import and no upload zone.

Orders enter the ledger through the web app only. The Worker syncs them to the native client. A port of the importer would give `parser-filters` a second home.

**Holds while:** no nightly job posts orders to the Worker, and the web app is the only place that parses a CSV.

## Why

- `parser-filters` keeps only TCG purchases. One parser enforces it. A Swift parser would need its own tests for the same rule.
- `imports-merge-never-replace` holds for the one importer. A second importer would need the same proof.
- The nightly orders job replaces the OrderWand export, see `sync-revamp-cloudflare`. That job reaches the native client through the Worker. So a native import would serve only the gap before the job exists.

## Rejected

A Worker route `POST /import` that runs the parser for both clients. The nightly job already plans to post orders to the Worker, and the Worker runs the same parser filters and merge there.

## See also

- `orderwand-csv` — the CSV schema and its quirks.
- `native-parity-table` — the row for CSV import.
- `sync-revamp-cloudflare` — the nightly orders job.
