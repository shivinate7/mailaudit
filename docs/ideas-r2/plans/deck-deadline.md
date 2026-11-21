# The deck due Friday

Blind pass: I read no repo code, screens or docs, as the brief asked. I checked the feature names against the global glossary. None of them clashes with a workflow term, and I avoided "plan" and "step" as product names. Names, dates and prices below are invented.

## Need-by dates: an event board
- **Idea:** The collector tags cards with an event, such as "Thursday league, Dec 3" or "Kai's Commander night, Dec 5". The tool shows one board for each event, counting down to its date.
- **Who and why now:** Right now the ledger answers "what is out?" It does not answer "what is out that I need by Thursday?" A missing card matters only against a date. The current checklist treats a 25¢ binder filler the same as the last copy a deck needs.
- **Shape:** Each event card shows three bars: in hand, in transit, at risk. Tap a bar to see its cards. Tag from Tally (all 4 copies of "Ember Warden" go to Thursday) or from a package. One card can serve two events.
- **Data:** Event name and date, plus tag links from a product name (or a single copy) to an event. They sync like check-ins.
- **Risks:** Tagging costs effort, and if it is slow nobody does it. Tags on product names break when two printings share a name.
- **Owner decides:** Tag by product name or by single copy. Should events disappear after their date, or stay as history?

## Learned seller transit: "who ships fast"
- **Idea:** The tool already holds every order date and every check-in date. From them it learns each seller's real transit time, and the collector's own postal transit, with no outside data.
- **Who and why now:** This helps at buying time. With three days to go, a 40¢ copy from a seller with an 11-day median is worse than a 90¢ copy from one with a 4-day median. Today that knowledge lives only in memory.
- **Shape:** A seller page shows the median days, the slowest arrival, "2 of 14 late", and a sample-size badge. You can paste a list of seller names from a cart and get them ranked by "arrives by Thursday?" odds.
- **Data:** Order date, check-in date, seller. Add a ship date if the CSV export carries one; that is unknown to me.
- **Risks:** Check-in day is not arrival day if mail sits on the counter for two days, which biases every figure. Many sellers have only one or two orders, so their numbers are noise.
- **Owner decides:** Add an optional "arrived on" date, separate from check-in? Below what sample size should the tool show no number at all?

## Last safe re-buy day
- **Idea:** Combine the event board with the transit figures. For each at-risk card, the tool names the last day a re-buy from a fast seller can still arrive before the event: "Re-buy by Mon Nov 30, or proxy."
- **Who and why now:** The usual failure is not lost mail. It is noticing too late to recover. A cutoff date turns a vague worry into one dated act.
- **Shape:** One line per at-risk card: the card, the original seller and the days the order has been out, the cutoff day, and the original cost next to a typical re-buy price that the user types in. Actions: "I re-bought it" (logs a second order and links it to the first), "Proxy it", "Wait".
- **Data:** Event date, transit figures, a link between the original and the re-buy.
- **Risks:** Double-buying costs money, and the late original then arrives. The link has to keep cost per card honest, not count both copies. This must stay advice: the tool flags the card, and it never files a marketplace claim or decides lost mail by itself.
- **Owner decides:** How many days of margin before the cutoff? Should a card linked to an event get the lost-mail flag sooner than an untagged one?

## Deck-list coverage check
- **Idea:** Paste a deck list as plain text ("4 Ember Warden / 2 Tidecaller's Lens ..."). The tool splits it into: arrived, ordered and in transit, and never ordered.
- **Who and why now:** "Never ordered" is the gap that no mail tracker catches: the card you meant to buy and forgot. It is the cheapest card to fix if you find it a week out.
- **Shape:** Three columns with counts. "Never ordered" exports as a buy list. Accepting the list creates the event from the first direction.
- **Data:** The pasted list, plus fuzzy matching against Tally product names.
- **Risks:** The tool only knows purchases, not cards owned before it existed, so many cards will look "never ordered" when they are not. Name matching across sets and alternate arts needs a way for the user to correct a match.
- **Owner decides:** Add a light "already own" mark, or keep the tool purchase-only? The first is a scope change toward a collection tracker.

## Mail-day routing and the proxy sheet
- **Idea:** When a check-in matches an event tag, the row says where the card goes: "→ Thursday deck box", not the binder. On event day, the tool prints a sheet of the cards still missing, ready to proxy.
- **Who and why now:** Sorting happens at the kitchen table with the envelope open. A deck card that goes into the binder is "lost" a second time.
- **Shape:** A quiet destination label on the checked row. It sits in space already reserved, so the row does not move under the thumb. Event day adds a "Proxy sheet" button: a card list with set codes, printable or shareable.
- **Data:** Event tags only. Nothing new to sync.
- **Risks:** Label clutter on mail day. The proxy sheet must be one the user exports on purpose, never an automatic popup.
- **Owner decides:** Show the destination always, or only within N days of the event? Is the proxy sheet in scope at all?

Strongest: Need-by dates (the event board). The other four directions depend on it: they need a date to count down to, and the board alone turns a passive mail checklist into a deadline tool.

## Phase 2: Need-by dates (fleshed out)

The collector gives a dated event the cards it needs. The tool then answers "will I have them by Thursday?" from the check-in data it already holds. Names, dates and counts below are invented.

### Flow
1. **Create an event.** In Tally, tap "Need by a date?". An inline sheet opens (no browser dialog) with a name ("Thursday league") and a local date ("2026-12-03"). Save.
2. **Tag needs.** On a Tally row ("Ember Warden, 4 ordered from 3 sellers"), tap "Need for…", pick the event and set the count. The count defaults to the quantity ordered and can go up or down ("need 4", "need 2").
3. **Read the strip.** A filter chip "Thursday league" sits at the top of Tally. Selecting it narrows Tally to the tagged rows and shows a one-line strip: "5 days · 22 of 26 in hand · 3 in transit · 1 at risk". Tap a count to narrow further.
4. **Mail day.** In Packages, a checked card that an event needs shows a small event chip ("Thu") in space reserved for it, so nothing moves under the thumb. Where the card goes is the job of **shelf at check-in**; this chip only names the event.
5. **Act on risk.** An at-risk row links to what already exists: the lost-mail warning, the **claim clock**, and the "claim filed" and "refunded" stamps. This slice adds no new action.
6. **The event passes.** The next day the event collapses into "Past events" with one line: "Covered 25 of 26 · 1 short". It stays as history until the user removes it, with undo through the recent-checks log pattern.

### Screen states
- **Empty:** no events. Tally shows one quiet link, "Need by a date?", and no strip and no chip. Packages is unchanged.
- **Normal:** one or more event chips. The strip shows days left, in hand, in transit and at risk. Rows carry a need count ("2 of 4 needed").
- **Edge, event today:** the strip reads "Today". At-risk rows say "proxy" instead of a count of days.
- **Edge, need above ordered:** "need 4, ordered 3" shows "1 not ordered" in a separate, neutral line. It never counts as at risk.
- **Edge, refunded order:** its copies count as not coming. A "claim filed" order counts as at risk.
- **Edge, Orphaned arrival:** if a card the event needs may be sitting in Orphaned, the row shows "maybe in Orphaned" as a hint only. It never changes any count (`orphaned-mail-never-decides`).
- **Edge, undo of a check-in:** counts move back at once. Undo goes through the same recent-checks log.
- **Edge, two events on one date need the same card:** warn on both strips ("shared with Kai's night, same day"). Events on different dates count independently, because a card plays in both.
- **Edge, re-import:** CSV import merges, so tags keyed to a product survive and counts update.
- **Error, past date at creation:** an inline message, "That date has passed". Save stays disabled.
- **Error, sync conflict:** two devices edit one event. It resolves by the same later-change-wins merge that check-ins use. The strip shows nothing extra. Delete uses a tombstone so the deleted event does not come back.
- **Error, tag points at a product Tally no longer shows:** the tag is kept, and a line reads "1 need has no matching card". Do not delete the tag silently.

### Data
- `events`: `[{id, name, date: "YYYY-MM-DD" local, updatedAt, deletedAt?}]`. A new field in saved state, so it touches `saved-state-shape` and needs an owner ruling. It is stored under the existing key, which keeps `storage-keys-are-frozen`. The date is a local calendar string, not a timestamp, so a UTC offset cannot move Thursday to Wednesday.
- `needs`: `[{eventId, productKey, count, updatedAt, deletedAt?}]`. `productKey` is the key Tally pools on, so it touches `saved-state-shape` too. It must survive the import merge (`imports-merge-never-replace`): import code must not rebuild or drop it.
- Everything else is derived on read: in hand, in transit and at risk come from check-ins, the lost-mail warning and stamps. No new stored status.
- Unchanged: the parser (`parser-filters`), storage keys, the device key and sync transport. Events and needs ride the existing sync to the Worker.

### Smallest first slice (ships alone)
Events, needs, the Tally filter chip and strip, and the empty, normal and past-event states. At risk means only "lost-mail warning showing, or claim filed, or refunded". Slice 1 makes no new timing guess. No Packages chip, no new view.

### Later slices
2. **Packages event chip** in reserved space, plus "maybe in Orphaned" hints.
3. **Last safe re-buy day.** For each at-risk card it gives a cutoff: event date minus a fast seller's median days, taken from the **seller record card** and **mail forecast**, minus a margin. Actions: "Re-bought", "Proxy", "Wait". The re-buy link is a new field and needs its own ruling. Cost must not count both copies: coordinate with **landed cost** and **recovery ledger**, and the link belongs to whichever of them owns refunds and replacements.
4. **Deck-list coverage.** Paste a deck list. The tool matches it against Tally keys and creates `needs` in one step, with a column for cards that were never ordered. It reuses **already coming**'s name matcher (one home per capability) rather than building a second.
5. **Proxy sheet** on event day: the missing cards with set codes, exported only when the user taps it.

### Risks
- Tagging takes effort. If tagging one deck takes more than a minute, nobody uses it. Slice 4 is the real fix, so slice 1 must make tagging fast: bulk-tag the current Tally filter.
- At-risk false alarms. If late orders show red too early, the strip trains the user to ignore it. Slice 1 uses only signals the app already trusts.
- Product-key drift. Two printings under one name, or a renamed product, give wrong counts. Show the unmatched-need line instead of guessing.
- Two new saved-state arrays. Old clients must ignore them, and sync must merge them field by field with tombstones.
- Scope creep toward a collection tracker. "Already own" stays out of this direction.

### Owner decisions
1. **Add `events` and `needs` to saved state?** Recommend yes: two optional arrays, where absent means no events, under the existing key.
2. **Tag by product name or by single copy?** Recommend product name plus a count, because Tally is already where "did all four arrive" lives.
3. **A new view or a Tally filter?** Recommend a filter chip and strip in Tally. Add no fourth view until use shows the need.
4. **What does at risk mean in slice 1?** Recommend the lost-mail warning, "claim filed" or "refunded" only. Timing-based risk waits for the seller record card.
5. **Two events need one card?** Recommend counting them independently, and warning only when they fall on the same date.
6. **Past events?** Recommend keeping them collapsed with a result line. Removal by the user, with undo.
7. **A card in Orphaned may be the missing one?** Recommend a hint only, never a count (`orphaned-mail-never-decides`).
