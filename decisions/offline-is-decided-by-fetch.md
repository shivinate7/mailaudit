# Offline is decided by a failed fetch

The app decides `offline` only by a failed `fetch`, and by nothing else. It never uses the browser's own online flag. That flag can get stuck at false after a sleep, a wake, or a network change. It once hid a five-day sync outage behind a wrong offline message. A device that is really offline still fails in the same request, one round trip later.

**Holds while:** `src/` makes no live `navigator.onLine` check. The only mentions of that flag are comments.

The `navigator.onLine === false` pre-flight check is gone from `api()` and `apiRaw()`. Do not add it back. The flag is not reliable. Chrome on macOS can leave it stuck at false after a sleep, a wake, or a VPN interface change. One laptop was measured at `onLine: false`, while the same fetch reached GitHub and answered 404. During that outage, the only symptom was a banner that said the connection was gone. The app declined requests that worked. The advisory line stated its own refusal as a fact about the network.

The rule here is the three-valued rule that `peek`, `listPhotos`, and `classifyLedger` follow, read in the other direction. "I could not look" is not a fact. Neither is "the browser says there is no network."

The guard only saved a request that would fail anyway. A device that is really offline rejects in the `catch` block. It gets the same error one round trip later. Do not add the guard back as an optimisation.

## See also

- `peek-is-three-valued` — the same three-valued rule applied to the sha read.
- `listphotos-is-three-valued` — the same rule applied to the photo list.
