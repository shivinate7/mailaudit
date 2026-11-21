# Second life

Premises (brief only; the brief ordered a blind read, so none was checked against records or code):
- One collector, hundreds of cheap cards a month, many sellers. Source: brief. Status: unknown.
- Some cards later leave by sale, trade, gift or consignment. Source: lens. Status: unknown. If the owner never resells, Directions 1, 3 and 5 lose most of their value.
- Web plus phone app, with sync through a private server. Source: brief. Status: unknown.

## Arrival-day condition note
- **Idea:** The check-off tap can also take one optional condition mark: fine, dinged, wrong printing, or not as listed. When the card is resold months later, the condition you can claim depends on what came out of the envelope. Today that fact is lost by evening.
- **Who / why now:** The collector at resale or trade. The arrival tap is the only moment the evidence exists. The marketplace dispute window is short, so a flag on day 1 can still get a refund.
- **Shape:** After "received", a small row of chips appears inline. It must not move anything under the finger. A "Disputes open" filter lists flagged cards with seller, order (e.g. ORD-4471-K) and days left in the window. Data: one enum and a date per card.
- **Risks:** Adds friction to the fastest flow, so the mark must stay optional and one tap. A photo is tempting, but if photos are kept permanently, that cost needs a decision.
- **Owner decides:** Which condition words to use (marketplace grades or plain words). Whether a photo is allowed. The dispute window length (a fixed number of days, or a value per order).

## Exit ledger, with cost carried out
- **Idea:** A card can be marked as gone: sold, traded, gifted, or consigned. The record keeps its cost and whatever came back. Tally gains an "own now" count next to "bought".
- **Who / why now:** The collector, before buying again: "did I trade my copy of Ember Wyrm away?" It answers that and stops a repeat purchase. Gain or loss per card is a by-product.
- **Shape:** On a received card, "Left the collection" asks for way, date, a counterparty nickname, and value back ($0 for a gift). Search by card name shows "gave to Sam, 3 Oct". Data: one exit event per card copy.
- **Risks:** It can grow into bookkeeping or tax software, so it must stay a lookup. A card traded in has no order row. Does it join the ledger? Does it get an inherited cost?
- **Owner decides:** Whether traded-in cards enter the tool without a CSV row. Whether to show gain or loss at all.

## Promised before it lands
- **Idea:** Link an outbound promise ("sold to buyer, ship by Tue" or "saved for Jo") to a card still in the mail. A lost envelope then reaches the person who was promised the card.
- **Who / why now:** A collector who flips cards fast. The lost-mail flag exists today, but it does not yet say who downstream gets hurt.
- **Shape:** On an outstanding card, "Promised" stores who and a due date. A banner reads "2 promised cards still in transit, 1 due in 3 days". The lost-mail flag ranks promised cards first. Data: promise (who, due) per card.
- **Risks:** A niche habit. It nags when promises are vague.
- **Owner decides:** Whether the owner sells before arrival at all. If not, drop this direction.

## Game-night pull list
- **Idea:** Before a store trade night, pick received cards marked "tradeable" into a list for the phone. Each card shows what it cost, so it never trades below cost by accident.
- **Who / why now:** The collector at a crowded table, phone in hand. The phone app already exists.
- **Shape:** A "tradeable" toggle on received cards. A compact list with name, cost and a floor price. Tapping a card marks it traded; it feeds the exit ledger when that ships. It must work offline at the store and sync later.
- **Risks:** Offline edits on two devices can conflict. The cost shown on screen is visible to the trade partner.
- **Owner decides:** Whether to hide cost behind a tap. Whether the floor is cost or cost plus a margin.

## Bulk lot builder
- **Idea:** Group many cheap cards into one lot for consignment or a buylist. Compare the lot's total cost with the offer, and record one exit event for the whole lot.
- **Who / why now:** The collector clearing hundreds of low-value cards, where single listings do not pay.
- **Shape:** Multi-select received cards, then "New lot" (e.g. LOT-0912). It shows count, total cost and the offer. Export a plain CSV of name, set and quantity. Mark the lot as handed over.
- **Risks:** Each shop wants a different format, so keep a generic CSV only. Selecting hundreds of cards at once must stay fast on the phone.
- **Owner decides:** Whether lots exist in the tool or the CSV export alone is enough.

Strongest: Arrival-day condition note: it adds one optional tap to a moment the app already owns, and it saves the one resale fact that cannot be recovered later.
