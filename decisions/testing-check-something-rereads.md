# Check that something re-reads the value

Changing a value an adapter owns tests nothing unless a component reads it again. Check that anything actually re-reads it.

**Holds while:** `remoteInfo` is set by an effect keyed on `[loaded, syncOpen]` in `src/app.jsx`.

The first draft could not fail. It aged `remote.pushedAt`, called `foreground()`, and asserted. But `foreground()` re-peeks and never re-reads `status()`. So the component kept the timestamp from the push above, and the mutant survived all of it.

`remoteInfo` is refreshed by an effect keyed on `[loaded, syncOpen]`. So the test has to toggle the panel to make the device record land.

Watch for this shape generally. After changing a value the adapter owns, check that something actually re-reads it.

## See also

- `testing-mock-field-stops-decor` — a mock-side version of the same unread-value trap
- `sync-runs-itself` — the automatic status this re-read check was written for
