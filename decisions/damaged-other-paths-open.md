# A damaged list on Re-import or sync reply

**Status:** closed 2026-10-12. Owner ruling "Keep a copy, then go on" covers every path.

Re-import, a sync reply and a pull go through the same chokepoint as the load: copy to History, mend, one line. The rule is in `saved-state-shape`.

**Holds while:** `readLedger` in `src/app.jsx` is the only reader of incoming ledger text, and `salvageLedger` is its only mender.

## See also

- `saved-state-shape` — the rule
- `native-ledger-is-raw-json` — the ruling
- `every-restore-passes-applybackup` — the chokepoint
