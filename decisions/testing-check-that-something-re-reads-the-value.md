# Check that something re-reads the value

Changing a value an adapter owns does not test anything unless a component actually reads it again. The first draft aged a timestamp and called a refresh, but the refresh only re-checked another status and never re-read the timestamp field. The mutant survived every assertion until the test forced the real read path.

## See also

- `testing-when-a-mock-field-stops-being-decorative` — a mock-side version of the same unread-value trap
- `sync-runs-itself` — the automatic status this re-read check was written for
