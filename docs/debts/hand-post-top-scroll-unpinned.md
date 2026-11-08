# No test pins the scroll to the page top when Post shows

**What.** On Card in Hand on the open Duo, when the Post offer shows, the answer page scrolls to its top (`HandScreen.swift`, the `onChange` on the offer). No test scrolls the answer page down before the offer shows, so deleting that scroll leaves every Duo test green. If the scroll stops working, a page already scrolled down keeps Post off the page. A test that scrolls the answer page down, names the next card, and finds the sender and Post on the page closes the gap. No seed envelope is tall enough to scroll the answer page. The tallest, C1, has 5 lines. Duo 1 runs on 2026-11-07 and 2026-11-08 found the page would not scroll at default text or at AccessibilityXXXL, and at AccessibilityL the query field went missing. So the test (archive/hand-post-top-t2, fbcc511) failed its setup on the fix and on the mutant alike. Closing the gap needs a UI-test seed with one envelope taller than the answer page. The seed loads in the app (`-ManifestUITestSeed`), so that is a product-side change.

**Status:** open. Waits for a taller UI-test seed (lane duo, 2026-11-08).

**Decision:** `duo-card-in-hand`.
