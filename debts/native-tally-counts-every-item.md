# The native Tally counts every ledger item

**What.** `TallyModel` pools every item from `LedgerStore.items()` through `tallyGroups`. It calls neither `dropCanceled` nor `dropGks`. So a canceled order and a refunded package still count as ordered and outstanding in the native Tally, and the owner sees money that came back as still outstanding. The web Tally drops both. The native Packages view reads every item the same way. The gap closes when native Tally and Packages take the live items the web takes, and a test pins each exclusion.

**Status:** open. No lane is briefed.

**Decision:** `native-parity-table`.

**Decision:** `a-refund-leaves-every-count`.
