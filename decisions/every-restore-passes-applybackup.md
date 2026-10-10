# Every restore passes through applyBackup

The file restore and the GitHub pull both pass through one function, `applyBackup()`. A saved version restores through it too.

**Holds while:** `applyBackup` in `src/app.jsx` rejects a payload that lacks `mailday` or an `items` array.

The check `!data.mailday || !Array.isArray(data.items)` is the only thing between a corrupt payload and a wiped ledger. So the check exists once, in that function.

The replaced-envelopes warning also covers the pull. A pull is one tap, not a deliberate file drop. So the warning matters more there.

## See also

- `a-restore-is-not-local` — what a restore does beyond this device.
- `backup-files-restore-two-ways` — the backup files that reach this function.
- `pull-fetches-photos-before-apply` — the order a pull runs in before it applies.
- `sha-accepted-only-after-apply` — the sha a pull stores only after it applies.
