# The native client takes its key through a custom URL scheme

**Status:** ruled. The owner accepted this on 2026-10-11 with "all seem fine". N2 landed in PR #81. The universal-link fallback is ruled and not built. One fact is unmeasured: whether the iPhone Camera opens a custom scheme from a QR code.

The key reaches the native app by URL, with no typing. The app stores the key in its own Keychain and drops the URL.

**Holds while:** no device has scanned a custom-scheme QR. The device check is lane N11 in `native-build-lanes`.

## The flow

- `scripts/send-key.mjs` gains the flag `--native`. It builds manifestledger://sync#k=<key> in place of the Pages URL. The flag follows the device: `scripts/send-key.mjs <device> --native`.
- Mac: the script uses `open` to send the URL to the app.
- iPhone: the QR holds the same URL. The Camera opens the app.
- Lane N5 registers the scheme and calls `KeyIntake.accept`. Accept asks `keyFromHash` in the rules bundle to check the key with `KEY_RE`. It stores the key and drops the URL.
- The key never prints, as in the web flow.

## The universal-link fallback

A universal link takes over if the Camera does not open the custom scheme. The owner ruled this on 2026-10-11. It is not built. It is built only if the N11 Camera check shows that the scheme fails. The universal link is https with `#k=`, so it carries the key. A Worker route serves the apple-app-site-association file for it. That route is not built. The paid signing team allows Associated Domains, see `native-swift-rebuild`. The Camera check on a device is lane N11's hand check, see `native-build-lanes`.

## The Keychain

- The key lives in the app's own Keychain. The accessibility class is AfterFirstUnlockThisDeviceOnly.
- `hasKey()` returns only a Bool. The sync client reads the key at request time.
- The key never enters view state, the ledger or a backup, see `the-token-is-a-credential`.
- The runner keychain may be locked in CI. The N2 tests use a fake Keychain under their own service name, so none reaches the runner keychain. No Swift test runs the real Keychain.

## Rejected

Reading the existing `mailaudit-sync` item from the login Keychain. The access prompt asks for the login password, and that is typing.

## Orchestrator defaults of 2026-10-12, not owner rulings

- `send-key` takes `<device> --native`, the device first. The usage check refuses `--native <device>`. The reversed-order case in `npm run test:send-key` pins that refusal.
- Today `KeyIntake.accept` returns ignored for any link that is not `manifestledger://sync`. So an https link is ignored by that guard while the fallback is not built. The ignore test names only `otherapp://` and `manifestledger://other`.
- Lane N5 registers the scheme and calls `KeyIntake.accept`, see `native-build-lanes`.
- The Mirror scan of ledger, backup and view state moved to N3, N5 and N8, see `native-build-lanes`.

## See also

- `sync-revamp-cloudflare` — the web key delivery that this replaces for native.
- `native-parity-table` — the key paste field stays web-only.
- `nothing-recovers-without-the-key` — why the Keychain key matters.
