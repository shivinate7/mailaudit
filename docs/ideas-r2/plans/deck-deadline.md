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
