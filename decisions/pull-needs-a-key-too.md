# A pull needs the same key

Push needs a fine-grained personal access token. It needs `Contents: read & write`, scoped to that repo only. The key used to be pasted once per device. Since the ledger repo went private, pull needs that key too.

**Status:** the GitHub key has no field on screen. Test 65.1 forbids the text "Add a GitHub key", and no render shows one. The rule still holds for the mirror's pull and push, which run on their own.

**Holds while:** `remote.pull` in `src/entry.jsx` sends the GitHub token, and `doMerge` in `src/app.jsx` calls it. The `no-access` code is in `GITHUB_QUIET`, so it stops the mirror and shows no line.

Closing the ledger repo cost one property, knowingly. A fresh device can no longer recover before it is configured with a key. A device with no key can do nothing remote at all. A `no-access` answer used to raise its own advisory line. Orchestrator default, 2026-10-12: GitHub states show nothing to the user, so it raises none now. A missing GitHub token only stops the mirror.

## See also

- `recovery-control-not-state-gated` — the rule that keeps the Sync row reachable on an empty ledger.
- `ruled-head-one-advisory-entrance` — the advisory line, which no longer names a GitHub key.
- `offline-is-decided-by-fetch` — the read a keyless pull still depends on.
