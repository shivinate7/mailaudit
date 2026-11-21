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

## Phase 2: Already coming (fleshed out)

**The point.** Before checking out, the collector pastes the cart and sees, line by line, what is already in the mail, what arrived, and what they paid before. It is a read-only lookup against Tally. It saves nothing, so slice 1 needs no new saved field.

### Flow
1. On the marketplace, the collector selects the cart text and copies it.
2. In MANIFEST, they open **Already coming**, a drawer from the masthead. It is a lookup, not a fourth view, because it reads Tally and writes nothing.
3. They paste into a plain textarea. A paste event fills it, so no clipboard-permission prompt appears and no native dialog opens.
4. They press **Check**. Each pasted line becomes a name, a quantity and, if present, a price.
5. Each line is matched against Tally rows through the same name normalizer Tally uses. It is one function with one home, not a copy.
6. The results list shows one row per cart line, with a verdict chip and the price-memory columns.
7. The collector tweaks the cart on the marketplace, pastes again, and presses Check again. The previous result is replaced in place.
8. Closing the drawer discards the paste and the result.

### Row verdicts
- **New:** no Tally row matches.
- **Coming:** an example reads "3 in transit · 2 sellers · oldest 9 days". It names its sellers, such as "Pinewood Cardhaus ×2, Lantern Row ×1".
- **Have:** an example reads "4 received · last Nov 12".
- **Short:** shown when the cart quantity plus the in-transit and received counts is still under a target. This is shown only after targets exist (see decision 5).
- **In doubt:** a matching order carries a lost-mail warning or a "claim filed" stamp. It shows apart from Coming and is never counted as on its way.
- **Refunded:** a lost card stamped "refunded" counts as not coming, so buying it again reads as normal.
- **Orphaned:** if any Orphaned package is open, a footer line reads "2 orphaned envelopes unmatched; they may hold cards on this list". It never changes a row's verdict.

### Price memory columns (card price only; landed cost stays with round 1's landed-cost work)
| Column | Example |
|---|---|
| Last paid | $0.22 (Oct 30, TwoMoonsTCG) |
| Lowest | $0.18 |
| Buys | 3 |
| vs cart | +$0.33, shown only when the pasted line carries a price |

### Screen states
- **Empty, no orders imported:** "Import an order history first; there is nothing to compare yet." The import button sits in the drawer.
- **Empty, nothing pasted:** the textarea shows a placeholder with a 2-line invented example. The Check button is disabled, but it holds its place.
- **Normal:** a header line reads "12 lines · 4 coming · 2 have · 6 new", followed by the rows. Rows sort in cart order so the collector can scan alongside the marketplace tab.
- **Edge, ambiguous name:** for example "Ashen Wyrm" matches two printings. The row shows **2 possible** and expands to list both with their counts. It never picks one silently.
- **Edge, non-card line** (sealed product, sleeves, a shipping line): the row shows "skipped: not a card line" in a muted style. It is listed, never dropped silently.
- **Edge, unparseable line:** the raw text shows with "could not read". The other lines still check.
- **Edge, data may be behind:** "As of last sync 3 h ago on this device". This covers a check-in done on the phone that has not synced yet.
- **Error, paste too large** (say over 500 lines): an inline message reads "Paste up to 500 lines; this has 812". Nothing is truncated quietly.
- **Error, zero lines read:** "No card lines found. Paste the cart's item list, not the page header." It shows with one invented sample.

### Layout (no layout shift under the pointer)
- The textarea and the Check button keep fixed positions. Results render below them in a region whose space is held while checking.
- An expanding "2 possible" row grows downward only, beneath the pointer, never above it.
- The summary line keeps a fixed width for its counts, so a changing number does not push the chips.

### Data
- **Slice 1 adds no field.** It reads product names, order states, stamps and unit prices that Tally already holds.
  - Rules touched: none written. `saved-state-shape` (the fixed saved-state shape) and `storage-keys-are-frozen` (frozen storage keys) are untouched.
- **The paste is kept only in memory.** It is never stored, never synced and never logged. It is personal cart data that the collector did not import.
- **The CSV parser is untouched.** `parser-filters` (the parser keeps only card purchases) governs the import. The paste reader is its own small reader and reuses only the name normalizer.
- **Later, playset targets:** one optional number per Tally product, such as "want 4". This is a new saved field, so it needs an owner ruling under `saved-state-shape`. It lives inside the existing state object, never under a new storage key. It merges by product key, last change wins, which keeps `imports-merge-never-replace` (imports merge, never replace).
- **Later, phone share sheet:** the native app takes shared text from the marketplace app into the same drawer. It adds no data.

### Smallest first slice (ships alone)
- What ships: the web drawer, the paste reader, the normalized-name match, and the New, Coming, Have, In doubt and Refunded chips. It adds the Last paid and Lowest columns and the orphaned footer.
- What is left out: targets, the share sheet, the vs-cart price, and ambiguous-row expansion. In slice 1 an ambiguous match shows "2 possible" with both counts inline.
- Proof:
  - Fixture tests feed 3 invented cart pastes against an invented Tally. One cart has a refunded card, one has a claim-filed card, and one has an orphan open.
  - The tests assert each verdict.
  - One test asserts the saved state is byte-identical before and after a check.

### Risks
- **Cart text format is unknown and may change.** Mitigation: the reader is forgiving and shows each raw line it could not read. Fixtures come from real copied carts with names swapped for invented ones.
- **A false "Have" costs a wanted card more than a false "New" does.** Mitigation: a weak match reads "possible", never "Have".
- **Name drift between the cart and the CSV** (set codes, "(Foil)", condition suffixes). Mitigation: fix it in the shared normalizer, so Tally improves too.
- **Sync lag misleads across devices.** Mitigation: the "as of" line.
- **Scope creep toward landed cost or seller records.** Mitigation: link to round 1's work and do not rebuild it here.

### Owner decisions (each with a recommended answer)
1. **What counts as the same card?** Recommend name plus set. Show condition and foil as a sub-note, not a separate match.
2. **How far back does "Have" look?** Recommend all time, showing the count and the last date.
3. **Does "claim filed" count as coming?** Recommend no. Show it as In doubt until it is refunded or checked in.
4. **Is it a drawer or a fourth view?** Recommend a drawer. It writes nothing, and the three views stay the working surfaces.
5. **Store playset targets?** Recommend not in slice 1. Rule on it after a month of use shows whether "Short" is wanted.
6. **Keep the last paste between visits?** Recommend no. It would need a new storage key (frozen) and would keep cart data that the collector never chose to save.
7. **Who supplies cart samples?** Recommend the owner copies 3 real carts once. A builder swaps every name and price for invented ones before they become fixtures.
