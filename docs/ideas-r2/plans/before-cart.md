# Before the cart

Premises (blind brief, so none checked against code or records):
- Check-in records carry a date per card, so "days to arrive" can be computed. Source: brief (inferred). Status: unknown.
- The CSV export names the seller and the shipping fee for each order. Source: brief (inferred). Status: unknown. If it has no shipping fee, the Landed-cost splitter can only use fees the user types in.
- The tool cannot see the live marketplace cart. Source: brief. Status: holds as far as the brief says. Each idea below needs a way to get the cart in: pasted cart text, the phone share sheet, or typing in a seller or card name. The owner picks one way for all five ideas.

## Seller report card
- **Idea:** Before checking out, look up a seller and see how their past envelopes did at this mailbox: median days to arrive, the slowest arrival, lost or flagged, and wrong or damaged cards.
- **Who and why now:** The collector buys from dozens of small sellers. Marketplace ratings count every buyer, but this tool holds this one address's postal record. Months of check-ins are already there and used for nothing.
- **Shape:** A search field takes a seller name, or pasted cart text gives several at once. Each seller gets a one-line card, such as "Pinewood Cardhaus: 14 orders, median 5 days, 1 lost ($2.10)". A new seller reads "no history" and is not marked as a risk.
- **Data:** Order date, seller, check-in date, and lost or orphan flags per order.
- **Risks:** Small samples overstate one bad envelope, so show n and hide the verdict below about 3 orders. Sellers rename their stores. A late envelope later matched from Orphaned can change a seller's record.
- **Owner decides:** The sample floor. Whether a mark like "avoid" is ever shown, or only the numbers. How to match a renamed seller.

## Already coming
- **Idea:** Paste a wishlist or cart and see which cards are already in the mail or arrived lately, such as "Ashen Wyrm: 3 in transit (2 sellers), 1 received Nov 12".
- **Who and why now:** With hundreds of cards in flight, a fourth copy of a playset is easy to buy by mistake. Tally already pools one name across sellers, so this reuses its count before the money is spent.
- **Shape:** Paste text. Each line comes back marked in transit, received, or new, with a link to its Tally row. Nothing is saved.
- **Data:** Product names and their state from the check-in data.
- **Risks:** Names in a pasted cart may not match the CSV's names (set, printing, condition, foil). A false "already have" costs a card the collector wanted.
- **Owner decides:** What counts as the same card. How far back "received" looks.

## Landed-cost splitter
- **Idea:** For a cart split across sellers, show the real cost per card once shipping is added. Then show the cost again with each seller's own loss rate counted in.
- **Who and why now:** On cheap cards, shipping is often most of the price. For example, the cart line for seller TwoMoonsTCG might read "1 card, $0.25 plus $1.27 shipping = $1.52 landed; 3 other sellers in this cart have it".
- **Shape:** A pasted cart gives a table of sellers by cards, with the landed cost per card. It flags single-card envelopes and the sellers that cost the most. It only suggests. It never changes the cart.
- **Data:** Shipping per order from the CSV if it is there, and the loss rate per seller from the Seller report card.
- **Risks:** Marketplace shipping rules (free-shipping floors, bundled shipping) change, and the tool cannot see them. A guessed fee looks precise when it is not.
- **Owner decides:** Whether fees the user types in are allowed. Whether a "loss-adjusted" cost is shown at all, since a small sample could make it look certain when it is not.

## Money in the mail
- **Idea:** Before buying more, show what is already at risk: the dollars and envelopes in transit, and how many are past their seller's usual window.
- **Who and why now:** The collector decides whether to buy at all before travel, before a holiday rush, or when several envelopes are already late. An example reading: "$64.30 across 31 envelopes; 6 overdue; the oldest is ORD-7731-QX, 19 days".
- **Shape:** A banner at the top of the cart check, plus an optional ceiling the user sets, such as "pause above $80". With a hold-mail date range entered, it also warns when a seller's usual arrival time would land a new order inside it.
- **Data:** Outstanding orders, their cost, and arrival windows per seller.
- **Risks:** It could read as a nag. A ceiling is the collector's own choice, and the tool must not imply the marketplace set it.
- **Owner decides:** Whether a ceiling exists. Whether hold-mail dates are stored, since they are new personal data that would sync to the server.

## Price memory
- **Idea:** At cart time, show what the collector last paid for the same card and their lowest price ever, from Tally's cost basis.
- **Who and why now:** Buying the same cards again and again gives the collector a personal price history, and that history goes unused today. An example reading: "Gilded Pact NM: paid $0.18, $0.22, $0.40; this cart $0.55".
- **Shape:** It shows as an extra column in the Already coming result. It does not need its own screen.
- **Data:** Unit price per product from past orders.
- **Risks:** Old prices drift, and condition or printing differences can make a comparison misleading. The tool knows only prices this collector paid, never the live market.
- **Owner decides:** Whether to fold this into Already coming or keep it apart. How old a price can be and still be shown.

Strongest: Seller report card — it is the one piece of cart-time advice nobody else can give, a seller's record at this one mailbox, built from check-in data the tool already holds.
