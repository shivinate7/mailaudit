# The native stamp note field is 36.7pt tall, under 44pt

**What.** In the stamp editor, the note field's own frame is 36.7pt high (two lines), so `PackageStampUITests.testEveryStampControlHasA44ptHitRegion` fails. `native/Manifest/StampViews.swift` puts `.frame(minHeight: 44)` after the padding, so it sizes the box, not the field. The Tally search field it copies has the same gap (`MastheadBackupUITests` says so). The audit no longer flags the hit area. The gap closes when the field's own frame is 44pt or more with every trait and its scalable font kept, and the test passes.

**Status:** open, 2026-10-29. Measured on step 6's last round, 1 of 1 runs. A lane at round 1 owns the fix.

**Decision:** `stamp-band-opens-the-editor`.
