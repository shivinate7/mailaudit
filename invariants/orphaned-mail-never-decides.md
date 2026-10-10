# Orphaned mail never decides anything

The user buys the same cheap cards from many sellers. Near-duplicate packages are normal, because two outstanding orders can have identical contents. This is the rule `orphaned-mail-never-decides`.

The app may rank the packages an envelope could have come from. It must never auto-assign a match. It must never treat a perfect fingerprint match as an action. It must never check off a card the user did not record. That includes "mark the rest of the package too".

Equally good candidates are reported as a tie. They render without emphasis.

This constraint came directly from the user. Do not simplify it away as friction.

**Pinned by:** 1.1–1.6 (controls that do not apply stay hidden, and those that do stay shown), 2.3 and 2.6 (recording checks nothing in), 3.1–3.6 (candidates are offered and ranked), 4.1–4.3 (assigning checks in only the recorded cards), 6.2–6.3 (a tie is surfaced), 7.1–7.2 (an unmatched card is never checked off).
