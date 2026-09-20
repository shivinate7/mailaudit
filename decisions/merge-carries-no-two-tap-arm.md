# Merge never needs a two-tap arm

Merge and push pulls, unions, applies, and pushes in one step, and it destroys nothing from either device. Because of that, it skips the two-tap confirm pattern reserved for destructive actions. Arming a control that destroys nothing would say the opposite of what the action does.

## The argument, as recorded

```
- **Merge (the conflict's way out).** Pull and Push anyway are the two halves of
  the same mistake — each keeps one device's work by discarding the other's.
  `Merge & push` keeps both: pull, union, apply, push. It carries **no two-tap
  arm**, deliberately, because it destroys nothing and invariant 6's pattern is
  for destructive actions specifically; arming it would say the opposite of what
  it does. Two entrances, one function (`doMerge`): the conflict, where it also
  completes the rejected push, and the *ahead-notice*, where it does not (there
  may be nothing local to send, and an empty commit is noise).
```

## See also

- `a-stale-push-conflicts-pull-gets-two-tap` — the confirm pattern this control skips.
- `sha-accepted-only-after-apply` — the rule merge still depends on.
