# Each decision names what would date it

Every decision record carries one line that starts with "**Holds while:**". The line names the concrete fact the ruling depends on, such as a file, a constant, a setting, a figure or a repo's visibility. A person or a check compares that fact with the repo, and a changed fact is the signal to revisit the ruling. A reason with no named fact cannot be checked, so it goes stale without notice. The owner ruled this on 2026-10-10.

**Holds while:** decision records are the home of each ruling in this repo, and `check:records` reads them.

## See also

- `records-hold-current-text-only` — the other rule for what a record holds.
