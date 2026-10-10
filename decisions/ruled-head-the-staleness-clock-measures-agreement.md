# The staleness clock measures agreement, not writes

The staleness clock reads the last time this device agreed with the backup in either direction, never the last time it wrote. Measuring only pushes made a phone that mostly merges falsely accuse itself of being unbacked-up. Taking the later of push and pull time is safe, because every stronger failure case is checked first.

## See also

- `ruled-head-one-advisory-line-is-the-only-entrance` — the line this clock feeds.
- `sha-accepted-only-after-apply` — the sha rule that keeps a pull honest about agreement.
- `pull-needs-a-key-too` — a case this clock must treat as broken sync.
