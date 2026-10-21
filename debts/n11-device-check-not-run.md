# The owner's native device check has not run

**What.** Lane N11 is the owner's check on a device, as ruled in `native-build-lanes`, and it has not run. It covers the VoiceOver order, Dynamic Type, a draft, and the iPhone Camera opening a `manifestledger://` QR code. When the app leaves, the draft must be kept. The check runs on a TestFlight build, see `native-ships-via-testflight`, so it waits for `testflight-app-record-missing`. If the Camera fails the scheme, the universal-link fallback is built, see `universal-link-unbuilt`. When the owner records each hand check, the gap closes.

**Status:** open. Waits for the owner, and for the TestFlight app record.

**Decision:** `native-build-lanes`.
