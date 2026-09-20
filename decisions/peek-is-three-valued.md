# peek is three-valued, not a guess

The peek check reads only the remote's blob sha, a few hundred bytes, instead of the full ledger. It answers with one of three states, because could not look must never read as all clear. Reading an unknown state as clear is exactly the state where a push would overwrite the other device. Auto-push checks peek before every write and declines on an ahead or unknown result.

## The argument, as recorded

```
- **`peek()`, and auto-push.** `GET /git/trees/{branch}` returns the **blob**
  sha for `ledger.json` — the exact value `push` stores and `rec().sha` is
  compared against — for a few hundred bytes on the *read* budget rather than
  the ~470KB a Contents GET would spend to answer the same question. It runs on
  foreground, never on a timer, and it is **three-valued** for the same reason
  `listPhotos` is: "I could not look" must never render as "all clear", because
  that is the state in which pushing overwrites the other device. Auto-push
  (unconditional now — there is no toggle) looks before every write and declines
  on `ahead` or on unknown; a conflict opening between the look and the write
  resolves by merging rather than leaving `Push anyway` armed on a screen nobody
  is watching.
```
