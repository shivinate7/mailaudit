# Milestones save before the risky step

The version store keeps four tiers. The important part is when each tier is taken.

**Holds while:** `src/app.jsx` takes milestones before import, sync, restore and reset, and `shouldSnapshot` gates only recent versions to 30 seconds apart.

A milestone version saves right before any operation that can lose data in bulk. Those operations are import, sync, restore, and reset. Milestones are taken BEFORE each of those operations. So each milestone holds the ledger as it stood in front of the thing that might have ruined it.

A recent version saves AFTER an ordinary change. So it holds where you got to. `resetAll` deliberately does not clear versions. That is what makes an accidental Reset recoverable rather than final. A 30s gate applies to recent versions. The gate keeps a mail day's hundreds of taps from spending the ring on one package.

The day anchor is derived, not stored. See `version-rules.mjs`. Each listed version has a two-tap `Restore this version` control.

**Pinned by:** group 39. It asserts on what a milestone holds. That is the ledger as it was before the operation, envelopes included. Mutants confirmed red: milestones never surviving, and Reset taking no milestone or tidying the versions away. Three group 39 mutants died by `JSON.parse(null)`. That is a worse kill. See `testing-throwing-assert-bad-kill`.

**Ruling, 2026-10-12:** merge stays blocked while Reset is armed (`armed-reset-takes-the-row`). Tests 34.9 and 34.10 pin it. The gate is unchanged.

## See also

- `unwritable-store-says-so` — the failure that could silently skip a milestone.
- `a-restore-is-not-local` — an operation a milestone guards.
- `older-versions-come-off-branch` — the other half of the version history.
