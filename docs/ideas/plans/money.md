# Money: five directions for the mail checklist

Lens: where the buyer's money goes, and how to know it for sure. All figures and names are invented.

## landed-cost
**Idea.** Show each card's real cost: the card price plus its share of the order's shipping, tax and fees. A $0.25 card from a one-card order may really cost $1.40.
**Who and why now.** The buyer. Card prices hide what they actually pay, and with hundreds of tiny orders the hidden part piles up. The other directions below build on this number.
**Shape.**
- Each card row shows two figures: "sticker $0.25 / landed $0.61".
- Tapping a card shows the split: card, shipping share, tax share, fees share.
- Totals in the per-product view switch to landed cost, so "all four copies" shows what the four really cost.
**Risks.** The exports may not split tax or fees per line, only per order. Rounded shares must add back to the order total to the cent, or the tool stops being trusted.
**Owner decides.** How to split shipping and fees: by price share, equally per card, or by card count. Also whether landed cost replaces the sticker price as the default figure.

## shipping-drag
**Idea.** Find the orders where postage cost more than the cards in them, and show the pattern by seller and by month.
**Who and why now.** The buyer, at the moment they plan the next buying round. Habits like "one cheap card from a new seller" are invisible until someone counts them.
**Shape.**
- A list of orders ranked by postage ratio: "Order G: $0.30 of cards, $1.27 shipping, 423%".
- One summary line: "41 orders this year paid more to ship than to buy, $38.10 in postage".
- An optional hint drawn from the buyer's own history, never from seller rules: "Seller K charged $0 shipping on your orders over $5".
**Risks.** The tool does not know any seller's real free-shipping threshold, so the hint is only a guess from past orders. It could nudge the buyer to spend more just to save postage.
**Owner decides.** Whether to show hints at all, or only the facts. Also whether the postage ratio uses sticker price or landed cost.

## refund-chase
**Idea.** Turn every lost-mail warning or wrong or damaged card into a money-owed item, tracked until it is refunded or written off.
**Who and why now.** The buyer. The tool already warns about mail that may be lost, but a warning does not get money back. Small claims under $2 are the ones people never chase.
**Shape.**
- Each problem card carries a status: owed, then claimed, then refunded or written off.
- A running total: "You are owed $14.20 across 6 items. 2 claim windows close in 5 days."
- When a later export shows a refund, the tool offers to match it to an open item. The buyer confirms the match. It never closes an item by itself.
**Risks.** Marketplace claim windows can change, so a hard-coded deadline would mislead. A wrong refund match could hide money still owed.
**Owner decides.** Who sets the claim window: the owner, as a setting, or nobody (no deadlines shown). Also whether a write-off counts in spend totals.

## spend-drift
**Idea.** A month-by-month view of spending, split into cards, shipping, tax and fees, with drift called out in plain words.
**Who and why now.** The buyer reviewing a month. Hobby spending creeps up quietly, and the cause is often postage, not card prices.
**Shape.**
- One bar per month, split into the four parts.
- A sentence under the chart: "November is 38% above your 6-month median. Most of the rise is shipping on 22 one-card orders."
- An optional monthly budget line, if the buyer wants one.
**Risks.** Sorting by order date and sorting by arrival date tell different stories. A budget can feel like nagging in a tool the buyer opens for fun.
**Owner decides.** Which date counts. Also whether there is a budget at all, and whether going over it ever shows a warning.

## spend-statement
**Idea.** A yearly or any-range statement of what was ordered, what arrived, what was refunded and what was lost, with landed cost per card.
**Who and why now.** A collector who insures the collection, resells cards, or just wants one firm number for the year. It answers "what did I really spend?" with proof.
**Shape.**
- Pick a date range and get one page: gross spent, refunds back, lost and written off, net, and the cost of what was received.
- It exports as a file to keep or print.
- Every figure links back to the orders behind it.
**Risks.** It can look like tax advice. It should state facts only, with no tax labels. It is only as complete as the exports imported so far, so gaps in the import history must show.
**Owner decides.** Whether lost cards count in the cost of what was received. Also the export format, and whether to show which months have no import.

Top pick: refund-chase — it builds on the lost-mail warning the tool already gives, and it is the only direction that brings money back rather than only measuring it.
