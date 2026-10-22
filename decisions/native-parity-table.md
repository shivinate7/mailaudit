# Each feature has one scope in the native rebuild

Kind: build

Plan: decisions/native-parity-table.md#rows-with-one-scope (web)

Plan: decisions/native-parity-table.md#both-clients (native)

**Status:** ruled. The owner ruled on 2026-10-11 to follow Degen's D32 rule, and accepted the defaults below with "all seem fine". The native client is under way, and `native-build-lanes` names the lanes that have landed.

Every feature has one scope: both clients, web-only or native-only. A feature that both clients need has one home for its logic, and each client draws its own screen. The lanes in `native-build-lanes` name the native test for each feature.

**Holds while:** the CLAUDE.md index lists no view or control that this table does not cover.

## Both clients

Each client draws its own screen. The logic has one home, see `rules-run-in-javascriptcore`.

- Packages, Tally and Orphaned, and the bottom bar that switches between them (`phone-nav-is-bottom-bar`).
- Search, hide-received, the date filter, the six Tally sort keys and the package sort. Native Tally has search, hide-received and the six sort keys, tested in `TallyModelTests` and `TallyUITests`. Debt: `native-filters-tally-only`.
- Lost-mail flags, outstanding value per level, and canceled orders.
- The Packages card header: the order id is a link to the TCGplayer order search, and the header text selects. The owner ruled on 2026-10-21 that native gets it, see `order-id-button-stops-propagate`. The web app has it. Native does not yet. Debt: `native-order-id-link-unbuilt`.
- Check-in and un-check, the steppers and the bulk row.
- Envelopes: record, edit, discard (a tombstone), assign, undo, and candidates with ties, with refunded packages out of every candidate. `OrphanedModel` (lane N7) builds all of these, except the photos. Debt: `native-envelope-has-no-photos`.
- Stamps: the tombstone, a refund that leaves every count, and the stamped filter.
- Worker sync: POST, GET, the WebSocket, the press gate, resume, and the 401 and 413 advisory lines. `SyncClient` (lane N4a) covers POST and GET. Lane N4b built the WebSocket, the press gate and resume, wired the client into the app, and drew the 401 and 413 lines (orchestrator assignment 2026-10-21, process-only). Debts: `native-sync-live-unrun` and `native-sync-glue-unpinned`.
- Backup export, the masthead and ruled head, the palette, Cochin and monospace type, and motion with reduced motion. Lane N8 built the Backup export, and the masthead with its tallies, save slot and reduced motion. It built nothing else in this line. The native masthead is on Packages only, and the Backup file holds no photos. Debts: `native-masthead-packages-only`, `native-masthead-system-style`, `native-compose-is-one-fade` and `native-backup-has-no-photos`.
- Envelope photo capture, the 2000px downscale at JPEG 0.8, the 56pt tiles and the modal viewer. Photo sync for both clients runs through the Worker photo route, see `sync-revamp-cloudflare`. Native has the photo kit and its views (lane N10), and the HTTP photo transport (lane N4b). Nothing calls them yet, see `native-photo-screens-unwired`.
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
| scenePhase resume and the camera usage string | native-only | They are platform plumbing. The usage string is not in Info.plist yet, see `native-photo-screens-unwired`. |
| Photo blobs as files in the `photos` folder | native-only | The web app keeps them in IndexedDB. Native keeps one file per blob beside the ledger, see `native-files-are-frozen`. |

## See also

- `native-swift-rebuild` — the ruling that makes this table necessary.
- `native-build-lanes` — the lanes and the tests for each row.
- `storage-keys-are-frozen` — the web rule that native-only file names mirror.
