# Milestones save before the risky step

The version store keeps four tiers. The important part is when each tier is taken.

A milestone version saves right before any operation that can lose data in bulk. Those operations are import, sync, restore, and reset. Milestones are taken BEFORE each of those operations. So each milestone holds the ledger as it stood in front of the thing that might have ruined it.

A recent version saves AFTER an ordinary change. So it holds where you got to. A 30s gate applies to recent versions. The gate keeps a mail day's hundreds of taps from spending the ring on one package.

The day anchor is derived, not stored. See `version-rules.mjs`. Each listed version has a two-tap `Restore this version` control.

## See also

- `a-store-that-cannot-write-says-so` — the failure that could silently skip a milestone.
- `a-restore-is-not-local` — an operation a milestone guards.
- `older-versions-come-off-the-branch` — the other half of the version history.
