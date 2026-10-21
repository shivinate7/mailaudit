# The native letterhead composes in one fade

**What.** `MastheadView` animates the seal, the rules, the title and the tallies together, in one ease-out of 1.06 seconds. `motion-letterhead-composes-once` orders the beats: wax, rules, name, house, then the tallies last. A seeded UI run draws the final frame, so no UI test sees the compose. `LetterheadMotion` has unit tests for the first and last frame only, and nothing proves the view calls them in order. The gap closes when the view orders the beats, and a measurement or a test pins the order.

**Status:** open.

**Decision:** `motion-letterhead-composes-once`.
