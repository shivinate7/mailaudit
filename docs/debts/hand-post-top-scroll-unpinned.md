# No test pins the scroll to the page top when Post shows

**What.** On Card in Hand on the open Duo, the answer page scrolls to its top when the Post offer shows (`HandScreen.swift`, the `onChange` on the offer). No test scrolls the answer page down before the offer shows, so deleting that scroll leaves every Duo test green. If the scroll stops working, a page already scrolled down keeps Post off the page. The gap closes when a test scrolls the answer page down, names the next card, and finds the sender and Post on the page.

**Status:** open.

**Decision:** `duo-card-in-hand`.
