# The test for a removing reply is Swift code

**What.** `LedgerStore.removes` in `native/ManifestKit/Sources/ManifestKit/Versions.swift` decides whether an incoming ledger removes something, and so whether `adopt` saves `before sync`. The web decides from the merge stats (`checkInsRemoved`, `envelopesRemoved` and `stampsRemoved`) in `src/app.jsx`, and native never loads `src/merge-rules.mjs`. So two homes hold the rule, against `rules-run-in-javascriptcore`. The lane N9 test-author asked for one pure rule in `src/version-rules.mjs`. The gap closes when the rule lives in the rules bundle, or the Worker's `stats` carry it, and Swift calls that one home and `removes` goes.

**Status:** open.

**Decision:** `rules-run-in-javascriptcore`.
