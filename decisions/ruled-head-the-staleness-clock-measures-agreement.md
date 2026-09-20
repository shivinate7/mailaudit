# The staleness clock measures agreement, not writes

The staleness clock reads the last time this device agreed with the backup in either direction, never the last time it wrote. Measuring only pushes made a phone that mostly merges falsely accuse itself of being unbacked-up. Taking the later of push and pull time is safe, because every stronger failure case is checked first.

## The argument, as recorded

```
**The staleness clock is the last time this device AGREED with the backup, in
either direction — not the last time it wrote.** `syncedAt` is
`max(pushedAt, pulledAt)`, defined once and read by both the decision and the
line's own copy so the two cannot drift. It measured `pushedAt` alone until a
phone reported "Not backed up since 09-16" while demonstrably holding the
laptop's newest lines. Both halves were true at once, which is the tell: the
question the line answers is *"are my bytes on GitHub?"*, and `pushedAt` answers
*"did I write recently?"*. Those come apart the moment two devices have
different jobs — the laptop is where the editing happens so it pushes and never
goes stale, while the phone mostly merges, and `acceptPull` records `pulledAt`,
not `pushedAt`. A phone in perfect step accused itself for as long as it went
without writing, on the one line whose entire job is to be believed.
Taking the later of the two cannot paper over a real problem, and the reason is
structural rather than lucky: **every branch above this one outranks it.**
Unpushed local work against a moved remote is `behind`; a push that failed is
`error`. What is left once those are clear is a device holding the remote's
bytes, which is what "backed up" means. Group 45, and 45.3 is the assertion
that pins the ordering — a fresh `pulledAt` must never mask being behind.
```
