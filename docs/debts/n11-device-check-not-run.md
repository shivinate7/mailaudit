# The owner's native device check has run in part

**What.** Lane N11 is the owner's check on a device, as ruled in `native-build-lanes`, and it has run in part. It covers the VoiceOver order, Dynamic Type, a draft, and the iPhone Camera opening a `manifestledger://` QR code. When the app leaves, the draft must be kept. The check runs on a build the Mac installs, or on TestFlight as the fallback, see `native-ships-via-testflight`. The Camera check passed on 2026-10-22 19:50 CDT, so the universal-link fallback is not built, see `universal-link-unbuilt`. VoiceOver order, Dynamic Type and the kept draft remain. When the owner records each hand check, the gap closes.

**Status:** open. Waits for the owner's hand checks: VoiceOver order, Dynamic Type and the kept draft.

**Decision:** `native-build-lanes`.
