# Check that something re-reads the value

Changing a value an adapter owns does not test anything unless a component actually reads it again. The first draft aged a timestamp and called a refresh, but the refresh only re-checked another status and never re-read the timestamp field. The mutant survived every assertion until the test forced the real read path.

## The argument, as recorded

```
**The first draft
could not fail**: it aged `remote.pushedAt`, called `foreground()` and asserted
— but `foreground()` re-peeks and never re-reads `status()`, so the component
kept the timestamp from the push above and the mutant survived all of it.
`remoteInfo` is refreshed by an effect keyed on `[loaded, syncOpen]`, so the
test has to toggle the panel to make the device record land. Watch for this
shape generally: **after changing a value the adapter owns, check that anything
actually re-reads it.**
```

## See also

- `testing-when-a-mock-field-stops-being-decorative` — a mock-side version of the same unread-value trap
- `sync-runs-itself` — the automatic status this re-read check was written for
