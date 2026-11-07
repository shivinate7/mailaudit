# No test pins the scroll to the page top when Post shows

**What.** On Card in Hand on the open Duo, when the Post offer shows, the answer page scrolls to its top (`HandScreen.swift`, the `onChange` on the offer). No test scrolls the answer page down before the offer shows, so deleting that scroll leaves every Duo test green. If the scroll stops working, a page already scrolled down keeps Post off the page. A test that scrolls the answer page down, names the next card, and finds the sender and Post on the page closes the gap.

**Status:** open.

**Decision:** `duo-card-in-hand`.
