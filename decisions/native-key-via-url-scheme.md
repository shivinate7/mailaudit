# The native client takes its key through a custom URL scheme

**Status:** ruled. The owner accepted this on 2026-10-11 with "all seem fine". The orchestrator defaults of 2026-10-12 below replace its universal-link fallback, and the owner has not seen them. N2 landed in PR #81. One fact is unmeasured: whether the iPhone Camera opens a custom scheme from a QR code.

The key reaches the native app by URL, with no typing. The app stores the key in its own Keychain and drops the URL.

**Holds while:** no device has scanned a custom-scheme QR. The device check is lane N11 in `native-build-lanes`.

## The flow

- `scripts/send-key.mjs` gains the flag `--native`. It builds manifestledger://sync#k=<key> in place of the Pages URL. The flag follows the device: `scripts/send-key.mjs <device> --native`.
- Mac: the script uses `open` to send the URL to the app.
- iPhone: the QR holds the same URL. The Camera opens the app.
- Lane N5 registers the scheme and calls `KeyIntake.accept`. Accept asks `keyFromHash` in the rules bundle to check the key with `KEY_RE`. It stores the key and drops the URL.
- The key never prints, as in the web flow.

## No universal-link fallback

The 2026-10-11 fallback is withdrawn. A universal link carries no key, see the defaults below. A Worker route serves the apple-app-site-association file. Under those defaults it is not a key path. Whether it stays is not ruled. The paid signing team allows Associated Domains, see `native-swift-rebuild`. The Camera check on a device is lane N11's hand check, see `native-build-lanes`.

## The Keychain

- The key lives in the app's own Keychain. The accessibility class is AfterFirstUnlockThisDeviceOnly.
- `hasKey()` returns only a Bool. The sync client reads the key at request time.
- The key never enters view state, the ledger or a backup, see `the-token-is-a-credential`.
- The runner keychain may be locked in CI. The N2 tests use a fake Keychain under their own service name, so none reaches the runner keychain. No Swift test runs the real Keychain.

## Rejected

Reading the existing `mailaudit-sync` item from the login Keychain. The access prompt asks for the login password, and that is typing.

## Orchestrator defaults of 2026-10-12, not owner rulings

- Only the custom scheme link carries a key. A universal link (https with `#k=`) is ignored, so the key never passes the web. `KeyIntake.accept` returns ignored unless the scheme is `manifestledger` and the host is `sync`. Nothing yet pins that an https link is ignored. The KeyIntake ignore test names only `otherapp://` and `manifestledger://other`.
- `send-key` takes `<device> --native`, the device first. The usage check refuses `--native <device>`. No test pins that refusal.
- Lane N5 registers the scheme and calls `KeyIntake.accept`, see `native-build-lanes`.
- The Mirror scan of ledger, backup and view state moved to N3, N5 and N8, see `native-build-lanes`.

## See also

- `sync-revamp-cloudflare` — the web key delivery that this replaces for native.
- `native-parity-table` — the key paste field stays web-only.
- `nothing-recovers-without-the-key` — why the Keychain key matters.
