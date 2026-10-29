# A stamp from Card in Hand leaves Tally stale

**What.** On the open Duo, the past-transit page of Card in Hand writes stamps (`native/Manifest/HandScreen.swift`, `afterWrite`). A Refunded or Partial refund stamp takes the package out of every count (`a-refund-leaves-every-count`), but `afterWrite` does not run the Packages `onChange` that reloads Tally and Orphaned. So Tally keeps counting the refunded package until it loads again. Main had no reload on any stamp path before step 6, so the gap predates the merge. The gap closes when a Hand stamp write runs the same reload, a failed reload marks the write failed, and a test pins it.

**Status:** open, 2026-10-29. Found by the step 6 merge review (code read, not run).

**Decision:** `a-refund-leaves-every-count`.
