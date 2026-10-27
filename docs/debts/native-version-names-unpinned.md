# No test pins the version file names

**What.** A version is <id>.bin and <id>.json. The id is the letter v, whole milliseconds, a dash and 8 hex digits. These names freeze with the versions folder (`native-files-are-frozen`). The `VersionStore` tests go through `put`, `list` and `data`, so none reads the folder. A rename would pass them and hide the versions a device holds. The gap closes when a test reads the folder and pins the two extensions and the id shape.

**Status:** open.

**Decision:** `native-files-are-frozen`.
