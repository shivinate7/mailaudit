# Each feature has one scope in the native rebuild

Kind: build

Plan: decisions/native-parity-table.md#rows-with-one-scope (web)

Plan: decisions/native-parity-table.md#both-clients (native)

**Status:** ruled. The owner ruled on 2026-10-11 to follow Degen's D32 rule, and accepted the defaults below with "all seem fine". No native code exists yet.

Every feature has one scope: both clients, web-only or native-only. A feature that both clients need has one home for its logic, and each client draws its own screen. The lanes in `native-build-lanes` name the native test for each feature.

**Holds while:** the CLAUDE.md index lists no view or control that this table does not cover, and the repo has no native folder.

## Both clients

Each client draws its own screen. The logic has one home, see `rules-run-in-javascriptcore`.

- Packages, Tally and Orphaned, and the bottom bar that switches between them (`phone-nav-is-bottom-bar`).
- Search, hide-received, the date filter, the six Tally sort keys and the package sort. Native Tally has search, hide-received and the six sort keys, tested in `TallyModelTests` and `TallyUITests`. Debt: `native-filters-tally-only`.
- Lost-mail flags, outstanding value per level, and canceled orders.
- Check-in and un-check, the steppers and the bulk row.
- Envelopes: record, edit, discard (a tombstone), assign, undo, and candidates with ties.
- Stamps: the tombstone, a refund that leaves every count, and the stamped filter.
- Worker sync: POST, GET, the WebSocket, the idle gate, resume, and the 401 and 413 advisory lines.
- Backup export, the masthead and ruled head, the palette, Cochin and monospace type, and motion with reduced motion.
- Envelope photo capture. Photo sync for both clients runs through the Worker photo route, see `sync-revamp-cloudflare`.
- Milestones of local versions. Native saves them, prunes them by the same rule as the web app, lists them, and restores one. The owner ruled on 2026-10-11: "yeah list and restore".

## Rows with one scope

| Feature | Scope | Reason |
|---|---|---|
| Public seed (`window.seed`) | web-only | It served site visitors, and visitors do not use native. It is gone: the owner ruled it out on 2026-10-11, and `82e45d4` removed it, see `worker-keeps-snapshots`. |
| GitHub mirror to the data branch, and History from the branch | web-only, until lane W3 ships | They need a GitHub token. Native never holds one. Worker snapshots replace both for both clients. |
| GitHub sync path: pull, push, sha, peek | web-only | Cloudflare retires it. The two-tap confirms left the UI on 2026-10-12. Native never had it. |
| Photo sync through the GitHub Contents API | web-only | The Worker photo route replaces it for both clients. |
| CSV import and the upload zone | web-only | A port gives `parser-filters` a second home, see `csv-import-stays-web`. |
| Restore from a backup file | web-only | The web path stays the one recovery tool. |
| Key paste field, the `#k=` link, the 16px key field | web-only | Native takes the key by URL into the Keychain, see `native-key-via-url-scheme`. |
| The `mailday:` namespace and the frozen storage keys | web-only | They are web storage. Native has its own frozen file names, see `native-files-are-frozen`. |
| check:build, check:seed, the favicon and theme-color | web-only | They are Pages artifacts. |
| Keychain key, class AfterFirstUnlockThisDeviceOnly | native-only | The rebuild ruling asks for it. |
| URL-scheme key intake | native-only | It delivers the key with no typing. |
| Ledger file in Application Support | native-only | The WebKit storage eviction rule does not apply to it. |
| scenePhase resume and the camera usage string | native-only | They are platform plumbing. |

## See also

- `native-swift-rebuild` — the ruling that makes this table necessary.
- `native-build-lanes` — the lanes and the tests for each row.
- `storage-keys-are-frozen` — the web rule that native-only file names mirror.
