# Milestones save before the risky step

A milestone version saves right before any operation that can lose data in bulk, such as import, sync, restore, or reset. Each milestone holds the ledger exactly as it stood before the risk. A separate recent tier saves after an ordinary change instead, gated to thirty seconds. That gate stops many quick taps from filling the ring with one package's history.

## The argument, as recorded

```
  two-tap `Restore this version`. Four tiers, and the important half is *when*
  each is taken. **Milestones** go in immediately BEFORE each of the operations
  that can lose data in bulk — import, sync, restore, reset — so each holds the
  world as it stood in front of the thing that might have ruined it. **Recent**
  ones are taken AFTER an ordinary change, so they hold where you got to; a 30s
  gate keeps a mail day's hundreds of taps from spending the ring on one
  package. The **day anchor** is derived, not stored (see `version-rules.mjs`).
```
