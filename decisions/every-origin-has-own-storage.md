# Every origin holds a separate ledger

The file protocol, the local server, and the live Pages site are three separate origins: `file://`, `http://localhost:4173` and `https://shivinate7.github.io`. Each holds its own storage. The three ledgers cannot see each other. So data that seems to vanish when you switch is expected, not a bug. Moving between origins means Backup → restore. Photos need *Backup + photos*.

## See also

- `shared-origin-needs-namespace` — the namespace rule inside one of those origins
- `file-protocol-works-locally` — why the file origin needs no server
- `storage-split-three-adapters` — the adapters that hold each origin's data
