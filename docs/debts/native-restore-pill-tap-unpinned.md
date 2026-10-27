# No test taps the leading part of the native Restore pill

**What.** `VersionsUITests` checks the armed Restore by tapping the version row's middle twice. The row middle sits right of the drawn pill, so a layout with Cancel before a row-wide Restore still passes. The red run of 2026-10-27 used a natural-width Restore. No test taps the pill's leading part after arming. The gap closes when a UI test taps there and fails on a layout that puts Cancel before Restore.

**Status:** open. No lane yet.

**Decision:** `armed-reset-takes-the-row`.
