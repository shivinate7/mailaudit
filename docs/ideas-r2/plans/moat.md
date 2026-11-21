# What a competitor would never copy

Premises (from the brief; the brief kept me out of the repo, so I could not check them against the code or records):
- P1 (brief) The CSV gives order id, seller, item, price and order date per card. Status: unknown.
- P2 (brief) The CSV gives shipping cost per order. Status: unknown. Envelope Tax depends on it.
- P3 (brief) The tool stores the date each card is checked in. Status: unknown. Postal Clock and Claim Clock depend on it.
- P4 (inferred) The tool knows no seller's location and no marketplace claim terms. Status: unknown.

## Claim Clock
- Idea: every outstanding envelope shows how long is left to file a "not received" claim. When the window is nearly closed, it builds a claim pack: order id (e.g. 4417-B2), seller, items, amount, days waited, and one plain paragraph ready to paste into the claim form.
- Who and why: the collector loses money in silence on $0.40 cards because no single envelope seems worth a claim. A marketplace gains when a claim window passes unused. Taking the buyer's side is the point.
- Shape: on Packages, a small days-left badge on each late order. A "Claims due" list sorted by deadline. A "Filed" toggle, then the outcome (refunded / denied / arrived after all). Data: order date, check-in state, a window length that the owner enters.
- Risks: the real claim terms are unknown and may change, so the owner sets the window and the tool never quotes a policy. Claims on envelopes that then arrive are a nuisance, so the tool waits until the collector's own late threshold (see Postal Clock) has passed.
- Owner decides: the window length, whether to batch small claims per seller, and whether the outcome feeds Seller Memory.

## Your Own Postal Clock
- Idea: the tool flags lost mail by the collector's own history, not by the marketplace's delivery promise. "Usual: 6–11 days. This one: day 19, past 95% of your envelopes."
- Who and why: a marketplace's estimate is set to sell. The collector's own check-in dates are the truth for their own mailbox, and only a private tool holds them.
- Shape: the late flag uses the median and 95th-percentile days to arrive from past check-ins, optionally per seller. It skips days with no mail delivery that the owner lists (Sundays, holidays). On a quiet panel: "Mail is running slow this month (+3 days)."
- Risks: little history at first, so it falls back to a fixed number of days until about 50 envelopes have arrived. A check-in made a few days late skews the figures, so it may need an "arrived earlier" edit.
- Owner decides: the threshold percentile, and whether a holiday-season slowdown resets the baseline.

## Envelope Tax
- Idea: show what each envelope really cost per card, and in hindsight what fewer envelopes would have saved. "You paid $1.27 to ship one $0.15 card from Lantern Hollow Cards. Last month 9 one-card envelopes cost $8.40 in shipping."
- Who and why: a marketplace wants more sellers and more carts. This tool argues for buying less often and in bigger lots from the same seller.
- Shape: on Tally, each card's cost basis includes its share of the shipping. A monthly "envelope tax" figure. A list of sellers who shipped you one card more than once. Data: shipping per order (P2) and items per order.
- Risks: if the CSV has no shipping column, the feature needs the owner to type it in, or it dies. Splitting shipping across the cards in an order is a choice the owner must rule on.
- Owner decides: how to split shipping (evenly or by price), and whether this cost basis replaces the current one or sits beside it.

## Already Coming
- Idea: a check to run before buying. Paste or type a wish list, and the tool marks each card as already arrived, still in the mail (with seller and day), or new. An optional brake: "142 cards still in the mail; the last time it was this high, 6 went missing."
- Who and why: with hundreds of small orders in transit, buying the same card twice is easy. Every seller-side app profits from that mistake.
- Shape: a plain text box. Matching by product name uses the same pooling as Tally. Results in three groups. No notifications, no nagging. The brake is one line, and only when the in-mail count passes a number the owner sets.
- Risks: name matching (printings, foils, languages) gives false "already owned" marks. Show the matched line and let the collector overrule it.
- Owner decides: whether the brake exists at all, and how strictly names match.

## Seller Memory
- Idea: a private notebook per seller that no seller can see or answer back to. It holds arrival record, lost count, claim outcomes, condition notes, and an envelope fingerprint (postmark city, handwriting, sleeve style). The fingerprint narrows down who sent orphaned mail.
- Who and why: a marketplace's public ratings are inflated and soften the bad ones. The collector's own "never again" list is honest because nobody else reads it. The postmark helps match mail that arrives with no return address.
- Shape: open a seller's name to see the card: "11 envelopes, 1 lost, 1 late claim refunded. Postmark: Dayton. Note: no toploader." A quiet "avoid" mark that the Already Coming results show. When the collector enters an orphan's postmark city, the matching outstanding sellers rise to the top.
- Risks: notes about sellers are personal data about third parties. Keep them on the device and in the private sync only, and never export them in shareable form. The postmark city must be entered by hand.
- Owner decides: whether seller notes sync or stay on one device, and whether an avoid mark changes any view or only labels it.

Strongest: Claim Clock — it turns lost $0.40 envelopes into recovered money, using data the tool already holds, and no marketplace will ever build it.
