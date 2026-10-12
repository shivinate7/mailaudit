# Every restore passes through applyBackup

The file restore and the GitHub pull both pass through one function, `applyBackup()`. A saved version restores through it too.

**Holds while:** `parseLedger` in `src/app.jsx` rejects a payload that lacks `mailday` or an `items` array, and `applyBackup` calls `parseLedger` before its first write.

The check `!data.mailday || !Array.isArray(data.items)` is the only thing between a corrupt payload and a wiped ledger. So the check exists once, in `parseLedger`, which `applyBackup` calls.

A restore that would replace pending envelopes shows a replaced-envelopes warning. The warning also covered the pull. A pull was a two-tap control, not a deliberate file drop. So the warning mattered more there. The Pull control left the UI on 2026-10-12. Envelopes are hand-typed. Losing them silently is the worst kind of quiet.

**Pinned by:**

- 26.20 (a non-ledger JSON is refused on the restore path) and 26.21 (and nothing local moved). They replace the retired 26.8 and 26.9.
- 13.6: the replaced-envelopes warning on a restore.
- 37.53: a History restore brings the version's stamps and notes back, as a full replace.

**Retired:** tests 26.8, 26.9 and 26.10, with the Pull control on 2026-10-12. 26.8 refused a non-ledger payload, 26.9 checked that nothing local moved, and 26.10 pinned the replaced-envelopes warning on a pull. 13.6 now pins that warning on a restore. The refusal itself still runs in `parseLedger`.

## See also

- `a-restore-is-not-local` — what a restore does beyond this device.
- `backup-files-restore-two-ways` — the backup files that reach this function.
- `pull-fetches-photos-before-apply` — the order a pull runs in before it applies.
- `sha-accepted-only-after-apply` — the sha a pull stores only after it applies.
