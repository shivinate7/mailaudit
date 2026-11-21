# Rhythm of the hobby

Premises. I worked blind, as the brief asks, so I checked none of these against the repo.
- The CSV gives an order date, a seller and a product name for each card. Source: brief. Status: unknown.
- A product name usually carries its set name. Source: my assumption. Status: unknown.
- Today the app holds no set-release calendar and no holiday calendar. Source: my assumption. Status: unknown.
- The "may be lost" flag uses one fixed patience window. Source: my assumption. Status: unknown. If it already adapts, Direction 1 shrinks to per-seller lag.
- GLOSSARY.md has no clash with the new names below.

## Seasonal patience
- **Idea:** The lost-mail flag waits longer when the calendar says mail is slow. It learns each seller's usual lag and stretches it in release weeks and postal peaks. Examples: mid-November to early January, and the week after a big set launch, when small sellers sit on a backlog.
- **Who and why now:** The collector, this month. December is when a fixed window flags 30 envelopes that are only slow. Once the flag cries wolf, he stops trusting it, and a real loss slips past.
- **Shape:** Each flagged order shows "late for this season" or "late even for this season". A small calendar strip marks peak windows: some built in, and a few launch dates the owner types in. The data is order dates, check-in dates and a list of peak windows.
- **Risks:** Little history in the first year, so per-seller lag is noisy. The fallback is a store-wide figure. Stretched patience can push a real claim past the marketplace deadline (see Direction 4).
- **Owner decides:** Whether the launch-date list is typed in by hand or bundled and fetched. How far a peak may stretch patience: a fixed number of days, or a multiple of normal lag.

## Preorder parking
- **Idea:** A preorder ships on street date, not order date. Park it in a "not due yet" lane until street date plus normal transit. It should never count as outstanding-and-late before then.
- **Who and why now:** Preorder sprees bunch up two to six weeks before each release. Each one sits in the outstanding list looking overdue for weeks, which buries the real late mail.
- **Shape:** At import, a card whose set is not out yet is offered for parking with one tap, e.g. "Order SK-4471, 12 cards from Set 'Emberfall', parks until Mar 6". The parked lane lists each set's street date and its card count. On street date the cards move into Packages by themselves.
- **Risks:** The CSV may not mark preorders. Detection would rest on set name plus a release date, which can fail. A wrong park hides a loss, so a parked order must still flag if street date plus patience passes.
- **Owner decides:** Auto-park or offer one tap. Where release dates come from (shared with Direction 1).

## Release-week premium mirror
- **Idea:** Show what the collector paid for the same card at different distances from its set's launch, using only his own orders. Example: "4 copies of Ashen Wyrm: $2.10 in release week, $0.55 seven weeks later."
- **Who and why now:** He buys hundreds of cheap cards. A small markup paid in release week, repeated across every set, adds up to real money. Tally already pools a product name across all sellers, so the comparison has a home.
- **Shape:** In Tally, add "paid by week since launch" for a product with two or more buys. Add a per-set recap: "Emberfall: $84 spent in launch week, the same cards averaged 41% less later." Data: unit price, order date and set launch date.
- **Risks:** One collector's buys are a thin sample, and condition or printing differences skew the price. It must read as a mirror, never as price advice. This needs no market price feed. Adding one would be a new external dependency.
- **Owner decides:** Whether cost views should judge his buying at all. Whether different printings of one card pool or split.

## Claim-deadline countdown
- **Idea:** The marketplace gives a fixed window to report missing mail. Count down to it for each outstanding order, and sort late mail by days left to claim, not by days late.
- **Who and why now:** After a holiday spree, many orders reach their claim deadline in the same week of January. That week is when stretched patience (Direction 1) and a lost refund collide.
- **Shape:** A "claim by" date on each late package. A short list: "3 orders close in 5 days, $11.40 at stake". Tapping one marks it claimed, with a note. Data: the window length (an owner setting), order dates and claim status.
- **Risks:** I do not know the marketplace's real window rules, so the owner must enter them. Orphaned mail may later match a claimed order, so claim status must never be decided from orphaned mail.
- **Owner decides:** The window length, and whether it varies by order value. Whether "claimed" is a new state in saved data. That needs a ruling, because the saved-data shape may be fixed.

## Slow-month close-out
- **Idea:** Between sets, when little mail comes, offer a one-screen close-out of the last season. It shows what never came, what was claimed, what Orphaned still holds, and which sellers were slowest. Then he archives the season as settled.
- **Who and why now:** Release spikes leave a long tail of half-resolved orders. Quiet weeks are the only time he will clear that tail, and a clean slate makes the next spree's checklist readable.
- **Shape:** It appears when arrivals drop below a threshold for two weeks, or on demand. It is a checklist, with a season summary of spend, cards, loss rate and median lag. Settled orders fold away and are not deleted.
- **Risks:** An archive that hides data could read as a delete, which would break the expectation that imports and data are never lost. Folding must be view-only and must undo.
- **Owner decides:** Whether a season is a set cycle or a calendar quarter. Whether "settled" is a stored state or only a filter.

Strongest: Seasonal patience — it protects trust in the app's core lost-mail flag exactly when the calendar puts the most strain on it, and the December rush is already under way.
