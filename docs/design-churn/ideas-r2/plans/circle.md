# The circle outside the house

Premises, from the brief. None checked against the repo, because the blind brief forbids reading it.
- One collector, one ledger (brief): unknown. CSV import of marketplace orders (brief): unknown. Sync through a small private server (brief): unknown.
- Guardrail for every direction: no profiles, feeds, follower graph or public directory. Sharing happens by file, QR code or an expiring link, one person to one small group.
- Glossary check: no proposed name clashes with `GLOSSARY.md`.

## Split Box (pooled orders with a handoff slip)
- **Idea:** Friends pool one seller's cart to clear the free-shipping line. The collector's CSV holds every line, but some cards belong to Kai or Priya. Tag each of those lines with a friend's first name. On check-in the card counts as received and owed onward.
- **Who and why now:** The person who receives pooled mail. Today a group chat tracks it, and "did my Llanowar Elves come?" goes unanswered for weeks.
- **Shape:** Multi-select lines, then "Belongs to: Kai". Packages shows a small owner chip. The Tally cost basis leaves out friends' lines. A per-friend handoff slip lists their arrived and outstanding cards, their share of the price, and a split of the $1.31 shipping. It goes out as an image or text to paste into the chat, and it can be marked handed over.
- **Data:** An owner label per order line, a shipping split rule, and handoff state. All of it stays in the collector's own ledger.
- **Risks:** It drifts toward a payments ledger. The friend's share may be lost mail, and who absorbs that loss is unclear.
- **Owner decides:** Cards only, or money owed too? Does a friend's lost card raise the collector's lost flag?

## Mail Weather (is it me, or the post office?)
- **Idea:** Collectors in the same city share anonymous transit times, for example "envelopes into our area took 9 days this week, against 5 normally". A late envelope then reads as a local slowdown, not a lost package.
- **Who and why now:** It makes the existing lost-mail flag sharper. It cuts false alarms and early claims, the costliest mistake with low-cost cards.
- **Shape:** Opt in, and join a circle with a short code. The device sends only (week, days in transit, shipped-from state) to the private server. No seller, card or price leaves the device. The lost flag gains one line: "Circle median this week: 8 days (6 members)."
- **Risks:** Small groups leak who ordered when. Hide the figure below a minimum group size, such as 5. This is the first data that leaves the single-user server, so it is a new trust boundary.
- **Owner decides:** Should the server ever hold data from more than one user? What group-size floor? Does the circle code expire?

## Seller Word-of-Mouth
- **Idea:** The ledger already knows each seller's days to arrive, lost rate and condition misses. Export a seller card such as "CardShackVT: 14 orders, median 6 days, 1 lost". A friend imports it into their own app before buying.
- **Who and why now:** A play group that buys from the same long tail of tiny sellers. One person's lost envelope warns everyone else.
- **Shape:** A seller detail view with a Share card button (file or QR). The import goes into a separate "heard from" layer, never into the collector's own numbers. Pooled figures show the sample size next to every number.
- **Risks:** Small samples smear honest sellers. Sharing seller grades may clash with the marketplace's terms. Repeated imports can count the same orders twice.
- **Owner decides:** Share raw counts or a grade? Does imported opinion ever change the lost-flag timing?

## Spares and Wants
- **Idea:** Tally already pools copies of each card across sellers. Add a "need" count per card. Anything above it becomes a spare, listed with its cost basis. Paste in a friend's want list as plain text, and the app shows matches, including cards still arriving: "Kai wants Thoughtseize: you have 1 spare, arriving Tuesday."
- **Who and why now:** Duplicates pile up quickly from overlapping cheap orders. Swaps happen at Friday night games, offline.
- **Shape:** A spares list exports as text or an image. Want lists come in as pasted text. Matching runs on the device. A spare can be marked swapped, gone or lent, with a return date.
- **Risks:** Scope creep into a full collection manager. Matching names from free text is fuzzy. Sharing cost basis shows what the collector paid.
- **Owner decides:** Is "need" a new field the ledger should own? Is lending in scope? Should cost appear on shared lists?

## House-Sitter Check-In
- **Idea:** While the collector travels, a roommate or a local game store (LGS) owner who receives the mail logs envelopes through a one-time link. They see only seller names and expected counts, never prices.
- **Who and why now:** Trips and conventions are exactly when envelopes pile up unlogged and the lost clock keeps running.
- **Shape:** The collector makes a scoped link that expires in 7 days, shown as a QR code. The sitter taps "envelope from CardShackVT arrived" or adds a photo. The collector reviews those entries on return, so nothing is final until they confirm.
- **Risks:** This is the first write access for anyone but the owner. The link must be its own scoped key, never the device key. An envelope the sitter mislabels becomes orphaned mail.
- **Owner decides:** Allow any non-owner writes at all? Is confirm-on-return enough protection for the check-in data?

Strongest: Split Box — it serves the circle's most common act (pooling to save shipping) using data the ledger already holds, and needs no new server trust.
