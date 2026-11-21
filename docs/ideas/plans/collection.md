# After "Received": four directions for the collection the checklist builds

Lens: what happens after the card arrives. Premises, unchecked because the planner worked blind:
- Assumed: order rows give item name, seller, price paid, order date and quantity. The received tick adds a date.
- Assumed: order rows carry no set number, condition or printing. This matters to paid-vs-worth-now and set-within-reach.
- Assumed: the web app and the phone app share one store, so a new field reaches both.

All card and set names are invented.

## shelf-at-check-in
- **Idea:** when a card is ticked received, it also gets a home, such as "Binder B", "Deck: Tidewall" or "Trade box". The checklist becomes a map of where every card sits.
- **Who and why now:** the owner, at the moment they hold the card. That is the only cheap time to record where it goes. Months later, "where is my Ember Drake?" means searching through binders.
- **What they see and do:** the tick offers a location chip that defaults to the last one used. One tap keeps it, two taps change it. A search shows "Ember Drake ×3: Binder B (2), Trade box (1)". Moving a card is one edit.
- **Risks:**
  - Slows the core tick. It must stay optional and skippable, and never block "received".
  - Locations drift from reality, because nobody logs every shuffle.
- **Owner decisions:**
  - A free-text location or a fixed list.
  - Is a deck a location, or a tag on top of one?
  - Should old received cards get a bulk "unsorted" home?

## paid-vs-worth-now
- **Idea:** set the cost basis the app already holds against a current value. That shows which cards gained, which lost, and what the collection is worth.
- **Who and why now:** after months of $0.25 cards, the owner cannot say whether $400 spent bought $250 or $900 of cards. Price drift is invisible without this.
- **What they see and do:** each product name shows paid, now, and the change. A short list tops it: "Up most: Glass Owl, paid $0.40, now $3.10." Values refresh on demand, never on a timer.
- **Risks:**
  - Needs an outside price source. That brings its cost, terms, staleness and accuracy problems.
  - Name matching fails across printings and conditions the orders may not record.
  - A wrong value looks like fact.
- **Owner decisions:**
  - Which price source, if any, and at what cost.
  - Is a value typed in by hand acceptable as a first step?
  - Show the date each value was read beside it.

## surplus-out
- **Idea:** count copies held per product name against a "keep" number. The extras form a sell-or-trade list. When one leaves, record what came back, so the cost basis closes the loop.
- **Who and why now:** buying in bulk from many sellers makes duplicates by accident. They pile up unseen, and money paid for them sits idle.
- **What they see and do:** "Spare: 14 cards, $6.80 paid." Each spare row has the actions sold, traded or gave away. A sale records the amount. A trade records what came in, which enters as a new item with no seller and a cost carried over. A running "realized" figure sits beside "spent".
- **Risks:**
  - The count is wrong if cards arrive from outside orders (gifts, packs).
  - The scope grows toward a full marketplace tool.
  - A traded-in card has no order behind it, which strains the order-first model.
- **Owner decisions:**
  - A default keep number (1? 4?) and whether to set it per card.
  - Does a card that left drop from the totals or stay as history?
  - Is "came in by trade" a new source of items?

## set-within-reach
- **Idea:** the owner names a goal ("all 40 of the Tidecaller set"). The app shows what is held, what is in the mail, and what is missing. It also warns before a purchase that would make a duplicate.
- **Who and why now:** completion is why many small orders exist. Today the owner tracks it in their head, and the gap list feeds the next round of buying.
- **What they see and do:** a goal card: "Tidecaller 31/40, 4 in the mail, 5 missing, about $3 paid per card so far". The missing list copies out as a shopping list. A pasted wishlist flags "already own 2" before checkout.
- **Risks:**
  - Set lists are not in the orders. They come from the owner's typing or an outside source.
  - Name collisions across sets cause false "owned" marks.
  - In-transit counts lean on the lost-mail warnings being right.
- **Owner decisions:**
  - Set lists typed by hand, pasted, or fetched.
  - Does in transit count toward a goal?
  - One goal at a time or many.

Top pick: shelf-at-check-in — it needs no outside data and attaches to a tick the owner already makes. surplus-out and set-within-reach need its record of where cards are to pull a spare or check a gap, so it is the base the other three build on.

---

# Phase 2: shelf-at-check-in, fleshed out

**How it fits what exists.** A shelf adds a second fact to the received tick and changes nothing about how the tick works.
- Package stamps mark a package's status; a shelf marks where a card is now.
- The recent-checks log gets "→ Binder B" on the entry it already makes. Undo reverses the tick and the shelf together.
- The per-product cost total gains a breakdown by shelf.
- Orphaned cards can take a shelf. It says where the card sits, nothing about who sent it.
- Lost cards and photos are untouched. A card that never arrived has no shelf.
- Imports never carry a shelf, and a re-import must keep shelves already set.
- No layout shift under the pointer: the shelf control sits in a fixed tray whose space is held from the start.

**Flow**
1. Open mail and tick "Ember Drake ×2" received, as today.
2. The bottom tray, always present, reads "Shelf: Binder B" — the last shelf used.
3. Do nothing and the line goes to Binder B. Tap the tray and a sheet opens over the tray with recent shelves and "+ New".
4. The recent-checks log shows "Ember Drake ×2 → Binder B". Undo reverses both.
5. Later, a search for "Ember Drake" shows the count on each shelf. Moving a line is one logged edit.

**Screen states for the mockup**
1. Check-in: package list with "Ember Drake ×2 · $0.50" ticked; tray reads "Shelf: Binder B · change".
2. Picker open: sheet over the tray only, chips "Binder B", "Deck: Tidewall", "Trade box", "+ New". The list stays put.
3. Lookup: "Ember Drake ×3: Binder B 2, Trade box 1 · paid $0.75".
4. Folding phone: check-in list on the left; right screen "Binder B: 112 cards, $31.40 paid", newest card on top.

**Data**
- On each received line: a shelf name and the time it was set.
- The shelf list comes from names already used. No separate store.
- Only the person's taps write a shelf.
- Where it is saved: unknown. It needs a field beside the check-in record; the saved-state shape is fixed, so the owner must rule first.

**Smallest first slice.** One shelf per order line, set from the tray at tick time, defaulting to the last shelf used; the log line and undo; a text lookup with counts per shelf; web and iPhone. Not yet: splitting a line across shelves, move history, backfilling old cards, the fold's second screen.

**Owner decisions**
- Free-text shelves or a fixed list? Recommend: free text, with recent shelves as chips.
- Can one ×3 line go to two shelves? Recommend: not in slice 1.
- Cards received before this feature? Recommend: "Unsorted", no bulk prompt.
- Does undoing a tick also undo its shelf? Recommend: yes, one log entry.
- Should the tray show before any tick? Recommend: always, so the layout stays still.
- Can orphaned cards take a shelf? Recommend: yes.
