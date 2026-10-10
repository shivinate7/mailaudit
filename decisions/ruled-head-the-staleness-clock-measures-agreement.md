# The staleness clock measures agreement, not writes

The staleness clock is the last time this device agreed with the backup, in either direction. It is not the last time the device wrote. `syncedAt` is `max(pushedAt, pulledAt)`. That value is defined once. The decision and the line's own copy both read it. So the two cannot drift apart.

**Holds while:** `syncedAt` in `src/app.jsx` is `max(pushedAt, pulledAt)`, and `acceptPull` in `src/entry.jsx` records `pulledAt`.

Measuring `pushedAt` alone is wrong. The line answers "are my bytes on GitHub?" The field `pushedAt` answers "did I write recently?" Those differ when two devices have different jobs. The laptop is where editing happens. It pushes, and it never goes stale. The phone mostly merges. `acceptPull` records `pulledAt`, not `pushedAt`. So a phone in step with the remote can report itself as stale. One phone reported "Not backed up since 09-16" while it held the laptop's newest lines. Both facts were true at once. That showed the error.

Taking the later of the two cannot hide a real problem. The reason is structural, not luck. Every branch above this one outranks it. Unpushed local work against a moved remote is `behind`. A push that failed is `error`. Once those are clear, what is left is a device that holds the remote's bytes. That is what "backed up" means. Group 45 covers this. Test 45.3 pins the ordering: a fresh `pulledAt` must never mask being behind.

## See also

- `ruled-head-one-advisory-line-is-the-only-entrance` — the line this clock feeds.
- `sha-accepted-only-after-apply` — the sha rule that keeps a pull honest about agreement.
- `pull-needs-a-key-too` — a case this clock must treat as broken sync.
