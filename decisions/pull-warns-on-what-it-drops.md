# A pull warns about the photos it would drop

Before a pull replaces the ledger, the app warns about photos that the replace would strip. The warning counts photos that the current ledger references, that the incoming ledger does not, and that the remote does not hold. A photo that was never pushed would have no other copy.

**Holds while:** the pull path in `src/app.jsx` counts `stranded` as referenced ids absent from both `incomingSet` and `remoteSet`, and tests 30.18 to 30.20 exist.

The first version measured the warning against `plan.toPush`. That set is keyed on the incoming ledger's ids. It is the set that survives a pull untouched. So the warning fired when photos were safe. It stayed silent when they were really destroyed. Tests 30.18 to 30.20 pin both directions. Test 30.18 reports a photo the incoming ledger does not know. Test 30.19 keeps a photo that both ledgers reference. Test 30.20 does not report that photo as gone.

## See also

- `photo-ids-restore-keep-if-known`, the restore rule this warning guards.
- `photo-sync-cannot-conflict`, why a photo id is never a shared write.
- `two-device-merge-proven-first`, the two-device check. A pull replaces the ledger. The merge unions line items and never drops one.
