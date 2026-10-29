# Card in Hand reads the stamped filter's rows

**What.** `native/Manifest/HandScreen.swift` reads `packages.rows` for its count line and its envelope matches. With step 6's stamped filter on, `rows` holds only stamped packages. So on the open Duo, Card in Hand can show a wrong count and "No open envelope holds" for an unstamped match. One fix is to turn the filter off before Card in Hand opens. The gap closes when Card in Hand reads every live package whatever the filter, and a test pins it.

**Status:** open, 2026-10-29. Found by the step 6 merge review (code read, not run). It shows only with the stamped filter on and Card in Hand open.

**Decision:** `stamped-filter-on-the-pipeline`.
