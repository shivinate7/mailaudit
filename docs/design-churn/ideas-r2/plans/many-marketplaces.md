# Beyond one marketplace

Premises (all unknown, blind by brief): (brief) the collector buys through channels other than the marketplace; (brief) today only marketplace CSV exports come in; (brief) copies sync through a small private server.
Reading: I take "local store's buy-list" to mean that the shop pays store credit for cards the collector sells, and that credit then pays for purchases.

## Share-to-ledger capture
- **Idea:** Any trace becomes a draft order. On the phone, share the auction site's "you won" email, a direct-seller's confirmation, or a photo of a till receipt into the app. It pulls out the seller, the cards, the prices and any tracking number into a draft. Nothing enters the ledger until the collector confirms it.
- **Who / why now:** Purchases off the marketplace are invisible today, so the outstanding list and cost totals undercount. Every source after this one needs an entry door, so this comes first.
- **Shape:** The share sheet or a paste box opens a review card with each field flagged guessed or certain. One tap confirms. Data needed: the raw text or image kept as evidence, the extracted fields, and one small template per sender layout. Email stays out of the private server: the share goes from phone to app, so no address receives mail.
- **Risks:** Templates rot when a site changes its email. Receipt OCR misreads card names. A stored image may carry an address or a payment-card tail.
- **Owner decides:** Whether to keep the raw evidence or only the fields. Which two sources get templates first.

## Lots with unsplit cost
- **Idea:** A buy can be a lot: "$40 for a stack from table 12 at Thundermoot Con '26", or "$15 for a page of Pat R.'s binder". The cost is known now and the cards are named later, or never.
- **Who / why now:** At a convention or binder buy there is no order and no time to type 30 names. The money still belongs in the cost basis.
- **Shape:** "New lot": the price, where, an optional photo of the stack, and a card count if known. It arrives as received, because it is in hand. Later, "split" assigns cards, and the cost spreads evenly, by a reference price, or by hand. An unsplit lot shows as one line, "$40 · 0 of ~30 named". Data needed: a lot record, member cards, and the split method.
- **Risks:** A lot never split hides per-card cost forever. A split by reference price needs a price source, which is a new dependency.
- **Owner decides:** The default split method. Whether an unsplit lot counts toward a card's owned total.

## Tender, not just price
- **Idea:** Record what was paid with as well as how much: cash, store credit from The Dented Sleeve's buy-list, cards traded away, or a gift. Add the true landed cost: the auction buyer's premium, the shipping on a multi-card win, the currency.
- **Who / why now:** Once sources mix, "cost" stops being one number. A $6 card bought with credit earned by selling a $9 card differs from $6 cash. A traded card's cost is the card given up.
- **Shape:** A tender picker on any manual or captured line, defaulting to cash. Cost totals split into cash out, credit spent and trade value, and a store-credit balance per shop rises and falls. Data needed: tender type, amount, a link to the line that earned the credit, and premium, shipping and currency fields.
- **Risks:** Trade value is subjective. A credit balance that drifts from the shop's own record misleads.
- **Owner decides:** Whether credit and trades count toward "what it cost" or show beside it. Whether to track sales to buy-lists at all, since that is a step toward a full inventory.

## Hand-carried promises
- **Idea:** Some cards are owed by a person or a place, not by the mail. Examples: "Pat R. brings 3 cards Friday", "Gullwing Auctions holds lot GW-40921 for pickup", "The Dented Sleeve orders it in". These get due-by dates and a nudge, never a lost-mail flag.
- **Who / why now:** A lost-mail warning on a friend's trade is false, and the collector learns to ignore the flag. Splitting the outstanding list by kind of promise keeps the flag true as sources grow.
- **Shape:** The outstanding view splits into "in the mail" and "owed in person". In-person items show who owes them and since when, plus a "remind me before Friday's game night" option. Data needed: the counterparty, the promise date and how the card is handed over. The lost-mail rule reads the promise kind.
- **Risks:** Notes about friends are personal data synced to the server. Nudges become nagging.
- **Owner decides:** Whether this rule (lost-mail flags only on mailed promises) applies to old lines or only new ones. Whether person names sync or stay on the device.

## One ledger catches the double buy
- **Idea:** With every source in one ledger, the app can see what no single site can: the same card bought on the marketplace Tuesday and won at auction Thursday, or a fourth copy when the collector wanted three. Each line also shows how it came in (export, shared email, receipt photo, typed from memory), so a total can say "exact" or "partly estimated".
- **Who / why now:** Hundreds of cheap buys across five channels make accidental doubles likely. Each one is wasted money that only a merged view reveals. This is the payoff of the other four directions.
- **Shape:** When a line arrives, a quiet banner says: "Also bought 11/14 via Gullwing, still in the mail." There is an optional target count per card ("want 4"), and a "how it came in" tag on each line with a filter. Data needed: a normalised card identity across channels (name, set, printing) and the provenance tag.
- **Risks:** Matching card identity across channels is the hard part. Sites spell set names differently, so false matches nag and missed matches mislead.
- **Owner decides:** Whether to warn on any repeat or only above a target count. How strict a card-identity match must be.

Strongest: One ledger catches the double buy — the collector cannot get this from any single site, and it turns the other sources into money saved rather than more typing.
