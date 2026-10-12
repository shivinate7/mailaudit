# A pull needs the same key

Push needs a fine-grained personal access token. It needs `Contents: read & write`, scoped to that repo only. The key used to be pasted once per device. Since the ledger repo went private, pull needs that key too.

**Status:** the GitHub key has no field on screen. Test 65.1 forbids the text "Add a GitHub key", and no render shows one. The rule still holds for the mirror's pull and push, which run on their own.

**Retired:** tests 26.1 to 26.7, with the Pull control on 2026-10-12. 26.7 checked that the old Pull needed no key.

**Holds while:** `remote.pull` in `src/entry.jsx` sends the GitHub token, and `doMerge` in `src/app.jsx` calls it. The `no-access` code stops the mirror. It shows no line (default 5).

**Guard:** `guardWords66` (group 66) reaches the no-key case at 66.5 and the photos with no access case at 66.9. See `ruled-head-one-advisory-entrance` for the states it misses.

Closing the ledger repo cost one property, knowingly. A fresh device can no longer recover before it is configured with a key. A device with no key can do nothing remote at all. A `no-access` answer used to raise its own advisory line. Orchestrator default, 2026-10-12: GitHub states show nothing to the user, so it raises none now. A missing GitHub token only stops the mirror.

## See also

- `recovery-control-not-state-gated` — the rule that keeps the Sync row reachable on an empty ledger.
- `ruled-head-one-advisory-entrance` — the advisory line, which no longer names a GitHub key.
- `offline-is-decided-by-fetch` — the read a keyless pull still depends on.
