# The photoGet list-first fallback has no test

**What.** No test runs the `photoGet` list-first fallback. The test harness does not bundle `src/entry.jsx`, and it mocks `photoList` and `photoGet` itself. When an id is not on the last list, `photoGet` in `src/entry.jsx` lists the Worker's photo names. Then it reads the name it finds.

**Status:** open. Named limit from the sync switch, round 3. The harness cannot reach `entry.jsx`.

**Decision:** `remote-is-transport-not-storage`.
