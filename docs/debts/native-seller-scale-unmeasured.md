# The native seller shrinks to half size, and the cause is unmeasured

**What.** The native card seller (`PackagesView.swift`, `PackageRow.header`) carries `.minimumScaleFactor(0.5)` on 15pt Cochin. With no scale, the accessibility audit called a short seller "Text clipped". At 0.9 it still called "Alpha Cards" clipped, though that name draws 82pt wide in a 238pt column. So width is not the cause, and the scale hides an audit quirk that nobody measured. A seller of about 37 to 50 characters now draws as small as 7.5pt. That is under the 10px floor in `typography-cochin-and-mono`, and it departs from the 2026-10-21 ruling that the seller truncates. No test pins the seller's size. The gap closes when a run measures the audit with `.textSelection` on and off and at each text size, and the owner rules on the floor.

**Status:** open. The owner ruled on 2026-10-27 02:49 CDT to keep the 0.5 floor and file this debt. No lane yet.

**Decision:** `order-id-button-stops-propagate`.
