# Every origin holds a separate ledger

The file protocol, the local server, and the live Pages site are three separate origins, and each holds its own storage. Data that seems to vanish when switching between them is expected, not a bug. Moving a ledger between origins means a backup and a restore, and photos need the backup that includes them.

## The argument, as recorded

```
**Every origin has its own storage.** `file://`, `http://localhost:4173` and
`https://shivinate7.github.io` are three separate ledgers that cannot see each
other, so data "vanishing" when you switch is expected, not a bug. Moving
between them means Backup → restore, and photos need *Backup + photos*.
```
