# The native Tally copy has no lost-mail flag and no order id tap

**What.** A native Tally copy is drawn by the item line Packages draws, so a copy of two or more has the got/qty stepper. It shows its seller, date, set, finish, condition and order id. It has no lost-mail flag, and the order id is plain text: the web opens the whole order in Packages from it, and native has no such route. The Tally row also lacks the web's "Mark all received" and "Clear check-ins" row. The gap closes when a lane builds them and a test pins each one.

**Status:** open. No lane is briefed. Mark all received and Clear check-ins ride with their own lane.

**Decision:** `tally-row-lists-its-copies`.
