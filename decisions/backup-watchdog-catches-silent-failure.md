# A scheduled watchdog checks the backup, not the phone

A daily scheduled workflow reads the data branch's own history and opens an issue if nothing has landed in four days. This alarm has fired for real once, on a deliberate test dispatch, and the resulting issue was verified and closed. A green run only proves the watchdog stayed quiet, so the fired test proves the other half too. The phone's own status line is only as honest as the phone. A device with an expired token, unreadable storage, or one that never opens, cannot report its own failure. The watchdog cannot be fooled by anything happening on a device.

## See also

- `data-branch-setup` — the branch the watchdog reads
- `one-repo-for-both-halves` — why the watchdog lives in the private repository
- `sync-runs-itself` — the automatic push the watchdog is checking on
