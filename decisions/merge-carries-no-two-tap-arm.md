# Merge never needs a two-tap arm

Merge and push pulls, unions, applies, and pushes in one step. It destroys nothing from either device. Pull and Push anyway are the two halves of the same mistake. Each keeps one device's work by discarding the other's. `Merge & push` keeps both.

**Holds while:** `doMerge` in `src/app.jsx` runs on one tap, with no confirm state of its own.

It carries no two-tap arm, on purpose. Invariant 6's pattern is for destructive actions only. Arming a control that destroys nothing would say the opposite of what it does. The merge skips the confirm pattern for that reason.

There are two entrances to one function, `doMerge`:

- The conflict. Here it also completes the rejected push.
- The ahead-notice. Here it does not complete a push. There may be nothing local to send, and an empty commit is noise.

## See also

- `a-stale-push-conflicts-pull-gets-two-tap` — the confirm pattern this control skips.
- `sha-accepted-only-after-apply` — the rule merge still depends on.
