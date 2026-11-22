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

## Phase 2: Orphan clues (fleshed out)

**Premises.** Each comes from the coordinator's Phase 2 message. Each is unknown in code, because the brief bars reading the repo.
- An orphan has no known sender. The Orphaned view holds it, and a human assigns it. Unknown.
- The recent-checks log can undo an assignment. Unknown.
- The saved-state shape is fixed, so any new field needs an owner ruling. This blocks every slice below.
- Seller addresses are third-party personal data. This rules out storing address text, which leads to the "names this seller: yes/no" design below.

### The clue sheet: four rows, each a fixed set of chips
1. **Packing**: plain envelope, bubble mailer, rigid mailer, penny sleeve, top-loader (clear / blue / other colour), team bag, cardboard sandwich, thank-you card, branded sleeve.
2. **Postmark**: the sorting-centre city as text ("Larkfield"), or the first three ZIP digits. Never the full ZIP or a street.
3. **Return label**: printed sticker, handwritten, rubber stamp, or none. Then one question: does the label name this seller? (yes / no / can't read). The shop name itself is never stored.
4. **Hand**: block caps, cursive, label printer, typed sticker, or none.

### Flow: learning on normal mail (Packages view)
1. Check in a package as today. Below the package row, a collapsed "Clues" line reads "Same as last time? Blue top-loader · Larkfield · printed label". It shows once the seller has any history.
2. One tap confirms every row. Or tap "Change" to open the four chip rows. The drawer opens below the tapped line, so nothing above it or under the thumb moves.
3. Skipping the line costs nothing. A package without clues simply teaches nothing.
4. Clue taps write to the recent-checks log, so undo removes them with the check-in.

### Flow: using clues on an orphan (Orphaned view)
1. Open the orphan. If the card name is readable, the card-name match (another planner's "card speaks for itself") runs first. Clues then rank only among sellers who sold that card.
2. Tap what the envelope shows. Each tap re-ranks the candidates under the sheet at once. The sheet keeps a fixed height, so the list below it stays put.
3. Each candidate shows its evidence, for example: "Gutterfold TCG: blue top-loader 7 of 8 · Larkfield 3 of 3 · 2 cards outstanding, due Tue". Due dates come from the mail-forecast planner's work.
4. The human taps a candidate, then confirms in an in-app sheet (no native dialog). The confirm assigns exactly as manual assignment does today. Only after that confirm do the orphan's clues teach that seller.

### What the ranking may do and may never do
- It may sort and annotate. Score = Σ(clue matches × how consistently the seller shows that clue, seen n of m) + a small bonus inside the due window. Fewer than 3 prior packages caps the weight, so a single observation never outranks a habit.
- It may never assign, mark received, change outstanding counts, or close a lost-mail warning. It may never stamp "claim filed" or "refunded", or hide an outstanding seller. Every outstanding seller stays listed, clue-less ones last. It may never learn from an unconfirmed orphan. It never shows a percentage or "match"; it shows only "n of m" evidence.

### Screen states
- **Empty** (no seller has clues yet): the sheet still works. The note says "Clues build as you check in mail. 0 sellers so far." Candidates sort by due date alone.
- **Normal**: ranked list with evidence lines. A tie shows as a tie, labelled "same evidence", never broken at random.
- **Edge**:
  - Nothing is outstanding: "No open orders. This may be from an order not yet imported."
  - One seller has two open orders: the candidate expands to its orders, and the human still picks.
  - The clue contradicts history ("rigid mailer, 0 of 9"): the evidence shows the mismatch and is never hidden.
  - All clues are "can't read": the list falls back to due order.
- **Error**: clue history fails to load, or a sync conflict is pending. The sheet shows the unranked list with one quiet line, "Clue history unavailable; list in due order". Assignment still works.

### Data and the rules it touches
- One new field: `clues`, a short array of fixed tag ids, on a package check-in and on an orphan. The seller profile is derived from packages, never stored, so two devices cannot double-count. **saved-state-shape**: needs an owner ruling. **storage-keys-are-frozen**: no new key, because it lives inside the existing state.
- Postmark is stored as city text or 3 digits, and the label as yes/no. No address text is stored. This keeps third-party personal data out of the ledger and out of the Worker.
- **imports-merge-never-replace**: CSV rows never carry clues. A re-import must keep `clues` on the matched package. Test it with an import of the same orders.
- **orphaned-mail-never-decides**: covered by the ranking limits above. **parser-filters**, **the-token-is-a-credential**: untouched.
- Photos: the envelope-camera planner may prefill chips from a photo. Clues never require or store a photo.
- Sync merge: `clues` merges as part of its package. A last-write conflict on one package's tags is low stakes, and the record names it.

### Smallest first slice, which ships alone
Packing chips only (row 1), learned in Packages with "Same as last time". On the orphan, the slice annotates and sorts by packing evidence. Postmark, label and hand come in a second slice. Slice 1 needs only the `clues` field ruling. It proves the learning tap is cheap before the sheet grows.

### Risks
- Mail-day friction: if "Same as last time" is wrong more often than right, the owner stops tapping. Measure the share confirmed in one tap after 4 weeks.
- False confidence: a wrong confirm moves cards into the wrong seller's Tally. Evidence lines, the n-of-m cap and undo limit the damage.
- Habits rot: a seller changes supplies. Weight the last 10 packages only.
- Shared fulfilment: two shops ship from the same city. Postmark alone never ranks a candidate first by itself.
- An orphan from an order not yet imported has no candidate. The empty state says so.

### Owner decisions
1. Add the `clues` field to the package and the orphan? **Recommend yes**: one tag-id array. Seller profiles are derived, not stored.
2. Postmark detail: city, ZIP3 or full ZIP? **Recommend city or ZIP3, never full ZIP.**
3. Return label text: store the shop name, or only "names this seller: yes/no"? **Recommend yes/no only**, because a shop name can be a person's name.
4. Chips only, or free-text tags too? **Recommend chips only in slices 1–2**, with the owner adding chips later.
5. Do confirmed orphans teach? **Recommend yes, after the human confirms**, and undo removes it.
6. Sort, or annotate only? **Recommend sort plus evidence**, with every outstanding seller always listed.
