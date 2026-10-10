# Milestones save before the risky step

A milestone version saves right before any operation that can lose data in bulk, such as import, sync, restore, or reset. Each milestone holds the ledger exactly as it stood before the risk. A separate recent tier saves after an ordinary change instead, gated to thirty seconds. That gate stops many quick taps from filling the ring with one package's history.

## See also

- `a-store-that-cannot-write-says-so` — the failure that could silently skip a milestone.
- `a-restore-is-not-local` — an operation a milestone guards.
- `older-versions-come-off-the-branch` — the other half of the version history.
