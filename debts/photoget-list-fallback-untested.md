# The photoGet list-first fallback has no test

When an id is not on the last list, `photoGet` in `src/entry.jsx` lists the Worker's photo names. Then it reads the name it finds. The test harness does not bundle `src/entry.jsx`. It mocks `photoList` and `photoGet` itself, so no test runs this fallback.

**Status:** open. Named limit from the sync switch, round 3. The harness cannot reach `entry.jsx`.

**Decision:** `remote-is-transport-not-storage`.
