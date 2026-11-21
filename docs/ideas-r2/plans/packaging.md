# What the envelopes leave behind

Premises. All come from the brief and all are unknown, because the brief bars reading the repo.
- Each seller ships separately, usually in a plain envelope (brief). Unknown.
- A check-in happens one card or one package at a time, during the mail-day pass (brief). Unknown.
- The CSV export carries a shipping cost per order (inferred, not stated). Unknown. Direction 3 depends on it.
- Orphaned mail must never decide anything (repo CLAUDE.md, injected into context; not read further). Holds as a constraint on direction 4.

## Packing Grade: one tap on how it arrived
- Idea: at check-in, add one optional tap row for the package: protection (none / sleeve / top-loader / team bag / bubble mailer) and arrival (fine / soft corner / bent). Pool these per seller into a packing record.
- Who and why now: the collector reorders from the same small sellers. A bent $0.40 card is a hidden cost the ledger never shows. The grade turns the mail pile into a reason to pick seller A over seller B next time.
- Shape: chips under the package row, prefilled from that seller's last answer so most packages need zero taps. The seller line shows "12 pkgs: 11 top-loaded, 1 bent". Data: two small enums per package, with a seller rollup.
- Risks: friction on a fast mail-day pass. The chips must reserve their space so nothing shifts under the thumb. Grades are subjective, and one bad week from a carrier is not the seller's fault.
- Owner decides: per package or per card. Whether "bent" opens a damage note with a claim deadline (the marketplace's return window, as a date on the row).

## Supply Bin: what the mail gives back
- Idea: every top-loader, team bag and penny sleeve that arrives is stock the collector would otherwise buy. Derive a running count from the Packing Grade taps, with no extra entry.
- Who and why now: anyone who sorts, stores or resells cards uses these supplies. "You have about 140 top-loaders from mail; skip the 100-pack" saves real money on a one-card-at-a-time habit.
- Shape: a small tile in Tally: "From mail this month: 38 top-loaders, 52 team bags, 90 sleeves, about $9.10 at replacement price." A minus button logs use. A second line counts what went to waste: plain envelopes, cardboard, tape.
- Risks: counts drift, because no one logs use. The price per supply is a guess the owner sets once. The count must read as an estimate, never as stock taken.
- Owner decides: whether use is tracked at all, or only intake. Whether supply value nets against shipping in the cost basis, or stays separate.

## Envelope Math: the cost of one card at a time
- Idea: show what each envelope cost against what it carried. "You paid $1.27 shipping for a $0.25 card" across 40 orders is a pattern no single order shows.
- Who and why now: the buyer, at the moment of the next cart. Name the sellers who sent 3 or more separate envelopes in a month, and the products where shipping beat the card price.
- Shape: a Tally column for shipping share, and a monthly line: "212 envelopes, 1.3 cards each, shipping 61% of spend". A rough footprint line ("about 1.9 kg of paper and plastic") sits behind a disclosure, labelled an estimate.
- Risks: needs a shipping figure per order (premise unknown). Splitting order shipping across cards is a choice that can mislead. Footprint grams are invented averages, so give them as a range or drop them.
- Owner decides: how shipping splits across cards (even, or by price). Whether the footprint line ships at all.

## Packing Signature: the envelope as a fingerprint
- Idea: sellers pack in habits: a branded sleeve, a blue top-loader, a printed thank-you card, a handwritten label. Record the habit once, as free tags on the seller. When orphaned mail arrives, list the outstanding sellers whose tags match.
- Who and why now: Orphaned mail exists because an envelope carries no sender. The packing often does carry one. This helps where the app is weakest today.
- Shape: on an orphan, tap what you see ("blue top-loader", "thank-you note"). The app lists "Likely: Dusty Binder Cards (2 cards still out), Gutterfold TCG (1 card)". The collector confirms by hand. Data: a short tag set per seller, filled in at check-ins on normal mail.
- Risks: it must stay a suggestion. It never assigns, closes or marks anything (orphaned mail never decides). Tags rot when a seller changes supplies. Photos would help but sit permanently in history, so use text tags only.
- Owner decides: whether tags are free text or a fixed list. Whether a match may sort the orphan's candidate list, or only annotate it.

Strongest: Packing Signature, because it uses the envelope's leftovers to fix the app's hardest case, the unattributed package, and costs taps only on mail already in hand.
