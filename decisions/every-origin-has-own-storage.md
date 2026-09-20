# Every origin holds a separate ledger

The file protocol, the local server, and the live Pages site are three separate origins, and each holds its own storage. Data that seems to vanish when switching between them is expected, not a bug. Moving a ledger between origins means a backup and a restore, and photos need the backup that includes them.

## The argument, as recorded

```
**Every origin has its own storage.** `file://`, `http://localhost:4173` and
`https://shivinate7.github.io` are three separate ledgers that cannot see each
other, so data "vanishing" when you switch is expected, not a bug. Moving
between them means Backup → restore, and photos need *Backup + photos*.
```

## See also

- `shared-origin-needs-namespace` — the namespace rule inside one of those origins
- `file-protocol-works-locally` — why the file origin needs no server
- `storage-split-three-adapters` — the adapters that hold each origin's data
