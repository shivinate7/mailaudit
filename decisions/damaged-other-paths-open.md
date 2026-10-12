# A damaged list on Re-import or sync reply is not ruled

**Status:** open. The owner has ruled only the web load path.

Owner ruling 2026-10-12 ("Web refuses too") covers the web load path. The web load refuses a damaged `received`, `receivedAt`, `stamps` or `envelopes`, see `saved-state-shape`. The Re-import path and the sync-reply path do not refuse. The findings below are read from the code. None of them was run.

## Findings

Re-import of a backup file. The file goes through `applyBackup`. That calls `parseLedger`, which checks only `mailday` and `items`. So a damaged field passes unchecked:

- `stamps` that is not an object becomes `{}`, through `sanitizeStamps`. The stamps are emptied with no notice.
- `received` or `receivedAt` that is JSON `null` becomes `{}`. A string or a list is set into state as it is.
- `envelopes` that is not a list makes `.map` throw. The items, `received` and `receivedAt` setters run before the throw, so the restore stops half applied.

Sync reply. The reply goes through `parseLedger`, then `mergeLedger`, then `applyBackup`. No damaged field is refused:

- `mergeStamps` skips each incoming value that is not an object. A list in that field is read by index, so a list can add junk keys.
- `mergeEnvelopes` throws on an incoming `envelopes` that is an object, because it iterates the value.
- `mergeReceived` reads the incoming value by its keys. A string or a list adds zero counts or junk keys.

Load path, outside the ruling. A saved top level that is not an object loads with no notice. JSON `null` loads nothing. A list or a number loads with the defaults. The native client throws on the same top level. Whether the next save overwrites the saved text was not traced.

**Holds while:** the ruling names only the load path and only the four fields. A later owner ruling on the Re-import path, the sync-reply path and the top level closes this record.

The likely fix is one check in `parseLedger`. Restore and merge both pass through it, so one refusal would cover both paths. That changes sync and restore behaviour, so the owner decides. The fix itself is a code change for a builder.

## See also

- `saved-state-shape` — the web load refusal this record extends
- `native-ledger-is-raw-json` — the ruling this record waits on
- `every-restore-passes-applybackup` — why `parseLedger` is one chokepoint
