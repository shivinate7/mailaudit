# Waiting calmly

These ideas were written blind. I did not read the code, the records or the screens, so each premise below is unchecked.
- P1, from the brief: each order row gives a seller, an order date and a price. Status: unknown. Whether the file also has a ship date is unknown.
- P2, my inference: each check-in is saved with a timestamp. Status: unknown. Directions 1 to 3 need this.
- P3, my inference: the "may be lost" flag uses one fixed age threshold. Status: unknown. If it already learns from history, Direction 3 shrinks.

## Not yet due, so not shown
The idea: an envelope the collector has no reason to expect yet should not count as outstanding. Each package gets an expected window: its order date plus that seller's past delivery time, falling back to the collector's overall typical delivery time. Before that window opens, the package sits folded away under a line like "31 in the air, none expected yet." The list holds only packages that are due today or later. This is how the tool deliberately says less.
- Who and why now: a collector with 40 envelopes in flight. Today a list of 40 open items looks like 40 problems, which drives refreshing.
- Shape: the fold row is collapsed by default, and one tap opens it. Each package shows "expected Tue to Fri." Data needed: order dates, plus arrival dates per seller from past check-ins.
- Risks: a folded item is forgotten if its window is wrong. A new seller has no history. Opening the fold must not move content under the finger.
- Owner decides: whether the fold also hides the dollar total in the air, and how many past orders a seller needs before its own window replaces the overall default.

## Mailbox check-ins, empty days included
The idea: one tap records "checked the mail" at that moment, even when nothing came. Days with no mail become data. Sundays, holidays and a quiet carrier route stop counting against sellers, so lateness is measured in mail days rather than calendar days. Each check-in also ends with a close: "Done for today. 4 likely tomorrow."
- Who and why now: someone who checks the mailbox twice a day. The open loop ("did I miss something?") gets a recorded ending.
- Shape: a "Mail came / Nothing today" control, then the usual marking. Data needed: the check-in timestamps (a new small record) and a list of mail days learned from them.
- Risks: one more tap is friction, and a missed tap looks like an empty day. A check-in must never decide anything about orphaned mail.
- Owner decides: whether to log empty days at all, and whether a missed day counts as unknown or as no mail.

## Late is not lost: worry from the collector's own history
The idea: replace the yes/no "may be lost" flag with the collector's own record. For example: "Of 212 envelopes, 96% came by mail day 9 and 3% by day 20. Of the 11 you flagged, 9 still arrived, a median of 6 days late." A package past its window shows where it sits on that curve.
- Who and why now: the moment of "was I scammed?" Most late mail is only late, and the collector's own data can say so.
- Shape: one line per late package ("day 13, 1 in 30 of your envelopes took this long") and a small history row. Data needed: arrival delay per package, plus flags that later resolved.
- Risks: small samples mislead, and a low-cost card from a new seller has no history. Sharing seller-level numbers with anyone else would need care.
- Owner decides: whether a seller's own record overrides the overall one, and whether "still arrived after a flag" is kept as a permanent record.

## One deadline per worry
The idea: every overdue package gets one date and one action, such as "Report missing by Dec 3 (Pinecone Cards, order MW-48213, $4.70)." Before that date the tool says "nothing to do yet." After it, the package becomes a single task that can be checked off. Worry turns into an appointment.
- Who and why now: a collector who loses the chance to report a missing item by noticing too late, or who reports one too early.
- Shape: a "Needs you" list that is usually empty, one date per package, and a "reported" mark that keeps the package open until it arrives or the case closes. Data needed: the order date and a claim window the owner enters.
- Risks: the marketplace's claim rules are outside the tool and can change. A wrong date is worse than none.
- Owner decides: the window length (entered once by hand, never assumed), and whether a package that was reported and then arrives counts against the seller.

## One calm sentence first, numbers on request
The idea: the app opens to one sentence that reflects the data: "All on time. 38 in the air, $61.20. Nothing needs you." Detail sits one tap below. On the phone, a notification fires only when a deadline is near, never for "something arrived" and never as a daily count.
- Who and why now: on a normal day, opening the app should take two seconds and end the urge to check.
- Shape: the sentence is built from the other directions (due, late, needs you), and the money at risk is shown apart from the money merely in transit. Data needed: nothing new.
- Risks: the sentence can feel false if one late package is buried in "all on time." Its wording must be testable against fixed states.
- Owner decides: whether money appears in the sentence at all, and whether any notification is wanted.

Strongest: Mailbox check-ins, empty days included. It is the one idea that adds new data (mail days), it makes every other lateness clock honest, and it gives each trip to the mailbox a defined end.
