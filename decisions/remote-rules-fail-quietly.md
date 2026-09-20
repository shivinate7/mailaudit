# Remote status mapping is pure and tested

Two adapter decisions get their own pure functions. One maps GitHub's status codes to an error code the UI can phrase. The other chooses when a push body omits the sha. Both fail quietly when wrong, the same reasoning that governs the base64 module, so both stay pure and directly tested.

## The argument, as recorded

```
- `src/remote-rules.mjs` — the two adapter decisions worth asserting on:
  `classifyStatus` (GitHub's overloaded status codes → an error code the UI can
  phrase) and `pushBody` (which omits the sha only on a create). Same reasoning
  as `b64.mjs`: both fail quietly, so both are pure and directly tested.
```
