# A broken version store must say so

When IndexedDB cannot be written, every version save must fail visibly instead of silently. A silent failure once let History report no versions saved, right before a Reset the app had promised was recoverable. The version list state now carries a distinct broken flag. A failed write also resets its own throttling window, instead of swallowing the next attempt too.

## See also

- `a-recovery-control-is-not-gated-on-its-own-state` — the linked rule about staying reachable on failure.
- `milestones-are-taken-before-the-risk` — the milestone this failure could silently lose.
- `listphotos-is-three-valued` — the same three-valued shape applied elsewhere.
