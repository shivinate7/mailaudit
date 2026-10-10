# pushForce records the sha after the write

A forced push stores its looked-up sha only after the bytes actually reach GitHub, not before the write. Storing the sha first once let a failed forced write leave a current sha over stale data. The next automatic push then carried no conflict and overwrote the other device silently. Push now takes an optional sha override for exactly this case.

## See also

- `sha-accepted-only-after-apply` — the same rule reached through the pull door instead of the force door.
- `a-stale-push-conflicts-pull-gets-two-tap` — the conflict this rule keeps honest.
