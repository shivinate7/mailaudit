# No test pins StampPaint's token choices

**What.** `StampPaint` in `native/ManifestKit/Sources/ManifestKit/StampPaint.swift` names the token behind each colour of the Packages stamp band, editor, armed ask and stamped cell, as `PackageCardTokensTests` does for the card. A builder may not write tests, so no ManifestKit test maps each part to its token or checks its contrast on the surface it sits on. The gap closes when a test-author adds that table test.

**Status:** open. Found in step 6, the order stamps on the Packages card.

**Decision:** `native-parity-table`.
