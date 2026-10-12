# The native client takes its key through a custom URL scheme

**Status:** ruled. The owner accepted this on 2026-10-11 with "all seem fine". N2 landed in PR #81. One fact is unmeasured: whether the iPhone Camera opens a custom scheme from a QR code.

The key reaches the native app by URL, with no typing. The app stores the key in its own Keychain and drops the URL.

**Holds while:** no device has scanned a custom-scheme QR. The device check is lane N11 in `native-build-lanes`.

## The flow

- `scripts/send-key.mjs` gains the flag `--native`. It builds manifestledger://sync#k=<key> in place of the Pages URL.
- Mac: the script uses `open` to send the URL to the app.
- iPhone: the QR holds the same URL. The Camera opens the app.
- The app asks `keyFromHash` in the rules bundle to check the key with `KEY_RE`. It stores the key and drops the URL.
- The key never prints, as in the web flow.

## The fallback

A universal link takes over if the Camera does not open the custom scheme. A Worker route serves the apple-app-site-association file. The paid signing team allows Associated Domains, see `native-swift-rebuild`. The Camera check on a device is lane N11's hand check, see `native-build-lanes`.

## The Keychain

- The key lives in the app's own Keychain. The accessibility class is AfterFirstUnlockThisDeviceOnly.
- `hasKey()` returns only a Bool. The sync client reads the key at request time.
- The key never enters view state, the ledger or a backup, see `the-token-is-a-credential`.
- The runner keychain may be locked in CI. The N2 tests use a fake Keychain under their own service name, so none reaches the runner keychain. No Swift test runs the real Keychain.

## Rejected

Reading the existing `mailaudit-sync` item from the login Keychain. The access prompt asks for the login password, and that is typing.

## See also

- `sync-revamp-cloudflare` — the web key delivery that this replaces for native.
- `native-parity-table` — the key paste field stays web-only.
- `nothing-recovers-without-the-key` — why the Keychain key matters.
