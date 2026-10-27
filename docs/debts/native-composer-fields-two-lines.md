# The native composer fields draw two lines tall

**What.** The card name and note fields in the native envelope composer (`OrphanedView.swift`) are vertical-axis fields with `lineLimit(2...3)`. An empty or one-line field draws about 48pt tall, with the placeholder at the top. The web fields are single-line inputs. A one-line field fails the audit's hit-region check, because its region is the text line height (Cochin 16 is under 20pt), measured 2026-10-27 in a scratch matrix. The Tally search field has the same shape. The gap closes when a one-line field passes the hit-region audit, or the owner rules that two lines are right on the phone.

**Status:** open.

**Decision:** `typography-cochin-and-mono`.
