# The TestFlight app record does not exist

**What.** App Store Connect has no app record for bundle id `dev.shivinate.manifest`. The first `make testflight` upload ran once on 2026-10-21 and failed with: App record with bundle identifier "dev.shivinate.manifest" not found on App Store Connect. The owner creates the record: in App Store Connect choose Apps, then +, then New App, with bundle id `dev.shivinate.manifest`. Until then no build reaches TestFlight, so the owner's device check (`n11-device-check-not-run`) cannot start. When the record exists and one upload passes, the gap closes. Never retry the upload in a loop.

**Status:** open. Waits for the owner.

**Decision:** `native-ships-via-testflight`.
