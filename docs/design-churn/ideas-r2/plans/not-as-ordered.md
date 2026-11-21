# Not quite what was ordered

Premises (blind brief: the brief forbids reading code or records, so I could not check any of them):
- A card has one bit, received or not (inferred from the brief: "checks off each card"). Unknown.
- The CSV gives a product name and a price per line. It may also give set, number, language, condition and finish (inferred from the brief: "exports order history"). Unknown. Directions 2 and 3 depend on it.
- The tool pools one product name across sellers (not in the brief; the repo's CLAUDE.md, which was in my context, describes the Tally view). Unknown.
- Every new field needs a change to the saved-state shape, which is frozen (repo CLAUDE.md lists `saved-state-shape` as an invariant). Holds as a constraint. Each direction below names its field.
- Departs from: a one-bit check-in, wherever a direction adds a state. Not blocking.

## Received, but wrong
- Idea: add a third verdict at check-in, "arrived wrong", beside received and outstanding. It takes one reason: wrong printing, wrong language, worse condition, damaged, suspect fake, different card, or short count.
- Who and why now: the collector. Today a wrong card is either ticked, which hides the loss, or left open, which later raises a false lost-mail flag. Both cost money once the marketplace's claim window closes.
- Shape: long-press a row and pick the reason chip. An optional photo and note go with it. The row then shows a quiet "wrong" mark and a counter of days left to claim. A "To dispute" list totals the money at stake, for example 7 cards and $23.40. Each item closes as kept, refunded, replaced or written off.
- Data: reason, optional photo, note, outcome, the date it was opened, and the date of the claim deadline the owner sets.
- Risks: a saved-state shape change, which needs a migration. Photos last forever once synced. A chip shown on press must not shift the row under the pointer.
- Owner decides: does "arrived wrong" stop the lost-mail flag? Does a card kept at a worse condition count as received at a lower cost?

## Printings in the pooled count
- Idea: the pooled count by product name, Tally in the repo's own word, hides substitutions. "4 of 4 Ember Wyrm arrived" can be true when two of them are a cheap reprint. Split the pooled count by printing, and mark a check-in that fills one printing's slot with another.
- Who: the collector who buys a specific printing for its value. The cost basis also goes wrong, because a $0.30 reprint is booked at the $4.80 original's price.
- Shape: at check-in, if the order has more than one printing of the name, ask "Which one is this?" and show set code, number and finish side by side. The pooled row reads "4 arrived: 2 as ordered, 2 other printing".
- Data: printing fields from the CSV, which may not be there. Without them, this becomes a free-text "printing seen" note.
- Risks: one extra tap on hundreds of cheap cards. So ask only when the order is ambiguous, or when the price is above a threshold.
- Owner decides: the price threshold, and whether a wrong printing counts toward "all arrived".

## Expected-card card
- Idea: when an envelope opens, show what should be inside it: name, set symbol, collector number, language, foil or not, listed condition and price. The collector then compares the card with the sheet, not with memory.
- Who: the collector at the mailbox with ten envelopes. Near-identical cards are easy to confuse: same art, a different set, or a non-English copy.
- Shape: tap the order and get a large-type sheet, one block per card, with "matches" and "doesn't" buttons. "Doesn't" opens the reason picker from the first direction.
- Data: CSV fields only. Card images would need an outside catalog, which means network use and image licensing.
- Risks: the CSV may lack the fields. An outside image source makes the tool depend on a third party.
- Owner decides: CSV fields only, or fetch images.

## Seller reliability ledger
- Idea: count "arrived wrong" verdicts per seller over time, by reason. A seller who often ships reprints or overstated condition is marked "inspect closely".
- Who: the collector choosing whom to buy from again, and how carefully to open their mail. For example, "Tidepool Cards: 3 of 41 cards wrong, all condition".
- Shape: a small line on the seller's package header. Envelopes from a marked seller open the expected-card sheet by default.
- Data: derived from the first direction. It adds no new field beyond a per-seller rule the owner can override.
- Risks: small numbers turn one bad envelope into a stigma. The rule needs a minimum count, for example 3 wrong across 2 orders. It must stay private and never leave the device as a review.
- Owner decides: the threshold, and whether the marker shows at all.

## Spot-check for cards worth faking
- Idea: above a price the owner sets, check-in asks for a short authenticity routine before it counts the card as received. The owner writes the routine, for example loupe on print pattern, light test, compare with a known copy. The tool records that the routine was done, not that the card is genuine.
- Who: the collector, for the few cards where a fake costs real money. It also builds a dated record if a dispute follows.
- Shape: the check-in of an expensive card shows 3 ticks from the owner's list. "Skip" is allowed, and the card is marked unchecked.
- Data: the owner's routine text, a threshold, and per-card ticks with a date.
- Risks: false confidence, since the tool cannot detect a fake. An extra step on the cards that matter most.
- Owner decides: the threshold, the routine, and whether skipping is allowed.

Strongest: Received, but wrong. It is the one state the others build on, and it stops a wrong card from passing silently as received until the claim window closes.
