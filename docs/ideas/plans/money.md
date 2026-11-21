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

---

# Phase 2: picked directions, fleshed out

## landed-cost (phase 2)

**How it relates to what exists.** It changes the existing per-product cost total, which today sums sticker prices, to sum landed cost. The sticker total stays one tap away. Cards in the orphaned pile get no landed cost and never move a total, because their sender is unknown. A package stamped "refunded" takes its cards out of spend, and "claim filed" only marks them. The browser extension being built could later supply per-line tax and fees where the CSV gives only order totals.

**Flow**
1. The person imports a CSV as today. Nothing new to do.
2. The tool splits each order's shipping, tax and fees across its cards using the chosen rule.
3. In Packages, each card row shows "sticker / landed". The order header shows the full split.
4. In Tally, the product total reads landed by default, with "sticker $1.00" in small type under it.
5. Tapping a total opens a breakdown sheet listing each copy, its seller and its share of each part.
6. If a refund stamp is set, the breakdown shows that copy at $0 net and keeps the original figures visible.
7. Done: the person reads one number per product and trusts it, because the parts add up to the order totals to the cent.

**Screen states for a mockup**
- Packages, one order: "Order C · 3 cards · $0.75 cards + $1.27 ship + $0.12 tax = $2.14". Each row reads "$0.25 / $0.71".
- Tally, one product: "Ember Wyrm ×4 · landed $3.96 (sticker $1.00)". Three copies received, one outstanding.
- Breakdown sheet: four rows, one per seller (Seller A, B, D, F), each with card, ship, tax and fee shares. The footer says the rows add up to the order totals.
- Two-screen fold: the Tally list on the left and the open breakdown on the right, so no sheet covers the list.

**Data needed**
- Per-line card price and quantity: from the CSV.
- Per-order shipping, tax and fees: from the CSV, if it carries them. Unknown whether the export splits fees from tax; confirm against the CSV reference record before design.
- Refund state: from the existing package stamps.
- The split rule: a single owner setting.

**Smallest first slice.** Spread shipping only, by price share. Show "sticker / landed" in the Tally product total and the breakdown sheet. Leave tax and fees in the order total, unsplit, until the CSV question is answered.

**Owner decisions**
- How do shipping and fees split across cards? Recommend: by price share. Equal split is the other option.
- Where do leftover cents go? Recommend: to the most expensive line, always, so totals match to the cent.
- Is the default figure landed or sticker? Recommend: landed in Tally, sticker in Packages, where the card's own price is easier to match against the envelope.
- Does a "refunded" stamp zero the card's cost or remove the card? Recommend: show $0 net and keep the original figures in the breakdown.
- Does "claim filed" change any figure? Recommend: no, until the refund arrives.

## shipping-drag (phase 2)

**How it relates to what exists.** New: nothing today ranks orders by cost. It is a cost view, not an arrival view. It reads the same order data as Packages and changes no check-in state. Orphaned mail is excluded. It uses landed cost if that ships first, and sticker price otherwise.

**Flow**
1. The person opens a Spending entry from the menu. It is a new screen, not a fourth view mixed into the checklist.
2. One summary line at the top: "This year 41 orders paid more to ship than to buy: $38.10 in postage."
3. Below it, orders ranked by postage ratio, each with seller, date, cards, shipping and ratio.
4. A switch regroups the list by seller: "Seller K: 9 orders, avg ratio 310%".
5. With hints on, a seller row can show a fact drawn from history: "Your 3 orders over $5 from Seller K shipped free."
6. Tapping an order opens it in Packages. Back returns to the same scroll spot.
7. Done: the person knows which buying habit costs them postage, and nothing in their data has changed.

**Screen states for a mockup**
- Summary and ranked list: "Order G · Seller H · $0.30 cards · $1.27 ship · 423%" at the top, then more rows.
- Grouped by seller: "Seller K · 9 orders · $2.10 cards · $8.73 ship · avg 416%", with the hint line under it.
- Empty state: "Import an order history to see where postage goes."
- Two-screen fold: the seller list on the left and that seller's orders on the right.

**Data needed**
- Per-order card subtotal, shipping, seller and date: from the CSV, as already imported.
- Free-shipping hints: worked out from the buyer's own past orders only. Nothing is fetched from sellers.
- A date range: a picker with "this year" as the default.

**Smallest first slice.** The summary line and the ranked order list only, on sticker price. No grouping by seller and no hints.

**Owner decisions**
- Does the ratio use sticker or landed cost? Recommend: card subtotal against shipping, both straight from the order.
- At what ratio does an order count as "drag"? Recommend: shipping above the card subtotal (100%), fixed.
- Show free-shipping hints at all? Recommend: off by default; they are guesses and can nudge spending.
- A screen or a fourth view beside Packages, Tally and Orphaned? Recommend: a separate screen.
- Does it count orders not yet arrived? Recommend: yes. The postage is spent at checkout.
