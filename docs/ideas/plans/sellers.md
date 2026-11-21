# Sellers: five directions for the tick-list

Lens: each seller as a relationship with a track record. Written blind; these premises are unchecked, and each decides whether a direction can be built:
- The exported CSV names the seller on each order. Source: brief. Unknown.
- Each tick (each card marked received) stores the date it was made. Source: inferred. Unknown.
- The export carries the seller's region, shop size, ship date or shipping fee. Source: inferred. Unknown. Directions 3 and 5 need it.

All shop names are invented.

## seller-record-card
**Idea:** Give each seller one card, built only from the buyer's own history. It shows orders placed, cards owed against cards arrived, median days from order to tick, lost parcels, and problems found. When a card is ticked, one optional tap can add a problem tag: wrong printing, wrong condition, poor packing, short count.
**Who benefits, why now:** The buyer. Marketplace stars average strangers' experiences and miss what this buyer cares about, such as printing accuracy. Every tick already holds the timing data, and it goes unused.
**Shape:** Tap a seller name anywhere and a card opens, for example "Gravel Pit Games: 4 orders, 31 cards, all arrived, median 6 days, 1 wrong printing". A sortable list ranks sellers by lateness or by problems.
**Risks:** Most sellers will have one or two orders, so a score would mislead. Show raw counts and say "1 order" plainly. Tags added at mail time must stay optional, or ticking gets slower.
**Owner decides:** Which problem tags to offer. Whether the card shows a verdict word ("reliable") or only counts.

## buy-again-check
**Idea:** Before checkout, the buyer types a seller name and sees their past record with that seller. Two private lists sit on top of it: favourites and avoid.
**Who benefits, why now:** The buyer at the moment of choosing between two sellers offering the same card at a similar price. Today the history only speaks after the money is spent.
**Shape:** A search box opens the seller's card, or says "never bought from". An avoid-list seller is marked in red, with the reason the buyer wrote.
**Risks:** Sellers rename their shops, so a match on name may split one seller's history in two. A private avoid list must never leave the device unless the buyer shares it.
**Owner decides:** Whether to add sellers to the lists by hand only, or also suggest them (for example "2 lost of 3, avoid?").

## seller-aware-lost-alarm
**Idea:** Set "this looks lost" from each seller's own past speed, not from one fixed wait. Then look across all sellers for patterns: region, weekday ordered, shop size.
**Who benefits, why now:** The buyer, who gets fewer false alarms on slow but honest shops and an earlier alarm on a fast shop that has gone quiet. The patterns answer questions like "do weekend orders sit until Tuesday?"
**Shape:** An order shows "late for this seller (usually 5 days, now 11)". A patterns panel shows sentences like "orders placed Friday arrive 2 days later on median", each with its sample size.
**Risks:** Thin samples. Region and shop size may not be in the export. Too many patterns read as noise.
**Owner decides:** The minimum number of orders before a seller gets their own alarm threshold. Whether the patterns panel is worth having if region is missing.

## trouble-handling-record
**Idea:** When a parcel is late or wrong, record what happened next: the buyer contacted the seller, the seller replied, refunded, reshipped, or went silent. That record becomes part of the seller's card.
**Who benefits, why now:** The buyer, when opening a marketplace claim. They get a ready summary of the order date, the cards owed, the cost and the days waited. Over time it shows which sellers make problems right, which no star rating captures.
**Shape:** A lost or flagged order offers "start a dispute record": a short timeline with outcome buttons. The seller card adds a line like "trouble 2 times, made right 2 times".
**Risks:** Extra typing on a rare event, so the buyer may never fill it in. Refunds may later show up in the export and double-count.
**Owner decides:** Whether to show dispute outcomes in the cost total (refunded money taken off). How long an open dispute stays visible.

## shipping-and-loyalty
**Idea:** Show the true cost per card for each seller, shipping included. Point out where many one-card orders paid shipping again and again, and name the reliable sellers who stocked several of those cards.
**Who benefits, why now:** The buyer's budget. In a long tail of cheap cards, shipping can cost more than the cards. Buying more from proven sellers also rewards them.
**Shape:** A summary such as "38 one-card orders, shipping 2.1x the card cost". A list of "proven sellers you could have grouped with" (for example "Lantern Row Cards: 5 of these items").
**Risks:** The export may not split out shipping. Guessing what a seller stocked from past orders is weak.
**Owner decides:** Whether this stays a view of the past or later becomes a suggestion at buying time.

Top pick: seller-record-card. It needs only the seller name and the tick date, which the tool likely holds already. The other four directions all read its data.
