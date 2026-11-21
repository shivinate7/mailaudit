# Ten times the volume

Premises, from the brief. Their status is unknown because the brief forbids reading the code.
- Brief: today's volume is hundreds of cards a month and the lens multiplies it by ten. Unknown.
- Brief: a seller ships each order separately in a plain envelope. Unknown. A lot may arrive in a box or across several envelopes.
- Brief: check-in works card by card, and a mail flag marks a package that may be lost. Unknown. I did not see how a package gets flagged.
- Brief: a small private server syncs copies of the data. Unknown. I do not know its payload size or storage limits.

## Doorstep pass, then bench pass
Idea: split arrival into two steps. In the doorstep pass, one tap logs each envelope by seller. In the bench pass, the collector opens envelopes and checks the cards later, whenever there is time.
Who and why now: at forty envelopes a day, card-by-card check-in at the mailbox takes an hour. Only the envelope's arrival matters for lost mail, and that signal must not wait for a free evening.
Shape: the doorstep screen lists the sellers due, with large rows. Typing "crim" narrows the list to Crimson Binder Co., and one tap logs it as arrived. The bench screen holds every envelope that is logged but not opened, oldest first. Each opens to its card list. Data needed: one new arrival state and its date on each package, separate from the card states.
Risks: two states can drift. An envelope logged but never opened hides a short shipment for weeks. Three sellers can share one name.
Owner decides: should an unopened envelope count as received for cost and tally? After how many days should the bench nag?

## Seller rhythm
Idea: learn each repeat seller's real transit time. The ship-to-arrival median and spread come from past check-ins. That history drives a list of envelopes due today and a lost-mail flag sized to each seller.
Who and why now: with many repeat sellers, a fixed lost threshold gives dozens of false flags. A slow seller in another state trips it every week. The collector stops reading flags, and real losses slip past.
Shape: each package shows "usually 4–6 days; day 9". A flag fires only past that seller's spread. A seller with no history falls back to today's rule. The doorstep pass sorts its list by this forecast. Data needed: order date, arrival date and seller key, all already present.
Risks: a small sample per seller, holiday surges, and a seller who changes shipping method.
Owner decides: how many arrivals make a seller "known"? Should the flag be quieter for cheap orders?

## Count, then spot-check
Idea: check a bulk lot by count and value, not card by card. Only cards above a value line, say $2, get their own tick. The commons are confirmed with one count ("147 of 150").
Who and why now: a lot of 150 commons at $0.08 each takes 150 taps to check, for $12 of value. At ten times the volume, lots are the bulk of the cards but little of the money.
Shape: an order above N cards opens in lot mode. Cards above the line show as a short checklist, and one field takes the rest as a count. A short count asks which cards were missing, or records "3 commons short, $0.24".
Risks: the tally view loses per-card certainty for commons. A wrong count hides a missing playset card. The cost basis per card needs a rule for "short by count".
Owner decides: the value line, and whether a count-confirmed card counts as received for each card name in tally.

## Claim clock
Idea: turn lost mail into money recovered. Each flagged package starts a countdown to the marketplace's claim deadline. A weekly list shows what to file, with prepared text: order ORD-48213-K, seller, cards, total.
Who and why now: even 1% loss across forty envelopes a day is a dozen claims a month. Most of them are only worth a few dollars, so they get filed late or never.
Shape: a "To file" list sorted by deadline. A copy button copies the claim text. The collector marks each claim filed, refunded or arrived late. A running total shows the refunds won.
Risks: marketplace rules are not in the CSV, so the deadline is a setting the owner keeps current. A late arrival after a refund needs a clear state.
Owner decides: the deadline in days, whether a claim under $1 is worth listing, and whether refund amounts count against cost basis.

## Close the month
Idea: once a month, settle the orders that are fully received or refunded. Fold them into a compact archive. The working set then holds only open mail.
Who and why now: thousands of cards a month mean tens of thousands of rows within a year. The size of phone storage, the sync payload and render time grow with them. Phone storage quotas break first and silently.
Shape: a "Close October" button. First it shows a reconcile summary: received, short, lost, refunded and cost. Then it archives. Tally and search still read the archive. Check-in reads only the open set. Data needed: an archive store that merges, never replaces, and that is synced like the rest.
Risks: archiving must never drop a row. A late import that touches an archived order must reopen it. Two devices might close the same month at once.
Owner decides: can an archived row still be edited? Should closing be manual or automatic after N days?

Strongest: Doorstep pass, then bench pass — the forty-envelope moment is what breaks first. Splitting a two-second arrival log from slow card checking keeps the lost-mail signal current without costing the collector an hour a day.
