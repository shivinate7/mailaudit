# Offline is decided by a failed fetch

The app decides offline only from an actual failed network request, never from the browser's own online flag. That flag can get stuck reporting false after a sleep, a wake, or a network change. It once hid a real five-day sync outage behind a wrong offline message. A device that is genuinely offline still fails in the same request, one round trip later.

## The argument, as recorded

```
  **`offline` is decided by a failed `fetch` and by nothing else.** There was a
  `navigator.onLine === false` pre-flight in `api()` and `apiRaw()`; it is gone.
  The flag is not authoritative — Chrome on macOS leaves it stuck false after a
  sleep/wake or a VPN interface change, and a laptop was measured sitting at
  `onLine: false` while that same fetch reached GitHub and answered 404. Sync
  had been dead five days and the only symptom was a banner saying the
  connection was gone: the app was declining requests that worked, and the
  advisory line phrased its own refusal as a fact about the network. It is the
  three-valued rule `peek`, `listPhotos` and `classifyLedger` all follow, read
  in the other direction — *"I could not look"* is not a fact, and neither is
  *"the browser says there is no network"*. The guard only ever saved a doomed
  request; a device that really is offline rejects in the `catch` and gets the
  identical error one round trip later. Don't reintroduce it as an
  optimisation.
```

## See also

- `peek-is-three-valued` — the same three-valued rule applied to the sha read.
- `listphotos-is-three-valued` — the same rule applied to the photo list.
