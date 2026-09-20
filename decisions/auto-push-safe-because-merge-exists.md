# Auto-push is safe only because merge exists

Automating the push without the merge rule would turn a conflict from something hit occasionally into the normal way two devices meet. Auto-push refuses to write when it cannot see the remote, because pushing on an unknown remote state is exactly how one device overwrites another.

## The argument, as recorded

```
**Auto-push is safe only because the merge exists.** Automating it without
`merge-rules.mjs` would turn the conflict trap from something hit occasionally
into the normal way two devices meet. It is also why auto-push refuses to write
when `peek()` cannot see the remote: pushing on an unknown remote state is
precisely how one device overwrites the other.
```
