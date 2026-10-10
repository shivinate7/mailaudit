# The sync line is also the panel's way out

The sync line renders when sync is broken or the panel is open. It is also the control that closes the panel.

**Holds while:** `src/app.jsx` renders the sync line when `syncBroken || syncOpen` is true.

A disclosure must give its own way back out. The panel used to open on tap, and nothing closed it. The bug was reported from the phone within the hour.

Removing the Sync cell had removed the only control that could close it. Worse, once the problem was fixed, `syncBroken` went null. The line disappeared, and the panel stayed open with no control at all.

While the panel is open, the line is the panel's header. When sync is healthy, the line goes quiet. It reads `Backed up 09-06 — tap to close` in transparent text, not manila. It does not vanish.

A header that said "not backed up" over a ledger that just pushed would be a lie. Tests 28.8–28.12 pin both halves.

## See also

- `ruled-head-one-advisory-entrance` — the line this record makes a toggle.
- `history-sync-close-each-other` — the panels that close each other.
- `sync-panel-is-two-column-grid` — what the open panel contains.
- `null-remote-info-is-not-no-key` — why the line waits for the status to load.
