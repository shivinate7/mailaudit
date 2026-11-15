# The envelope composer's fields are two lines

Owner ruling 2026-11-08 15:23 CST, waiting-page item 57 a: on the phone, the envelope composer's two-line card name and note fields are right.

**Holds while:** the card name and note fields in `native/Manifest/OrphanedView.swift` keep `lineLimit(2...3)`.

A one-line field fails the hit-region audit, because its region is the text line height. Cochin 16 is under 20pt (measured 2026-10-27 in a scratch matrix).

Departs from: the web's single-line inputs. The phone keeps two lines for the tap-size check.

The Tally search field in `native/Manifest/TallyView.swift` also keeps `lineLimit(2...3)`. This ruling does not cover it.

Kind: process

Home: docs/decisions/typography-cochin-and-mono.md
