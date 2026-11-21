# One mailbox, several buyers

Premises (blind by brief: I read no code, screens or records):
- Today one collector owns the ledger and no buyer field exists. Source: brief (product text). Unknown: not checked against code.
- Each seller ships separately in a plain envelope, often with no clear sender. Source: brief. Holds as stated.
- Copies sync through a small private server with per-device keys. Source: brief, plus the loaded CLAUDE.md index (`the-token-is-a-credential`, the device key is a credential). Unknown beyond that.
- The saved state has a fixed shape, and imports merge and never replace. Source: loaded CLAUDE.md index (`saved-state-shape`, the fixed saved-state shape; `imports-merge-never-replace`, imports merge). Any buyer field touches both. Not read further.
- Glossary: there, "mailbox" means the git message store. Below, "the box" means the physical letterbox, and no feature takes that name.
- Order: the buyer tag in Twin envelopes underlies Sealed gift orders and Settle up. Ask the house needs only names.

## Ask the house before "lost"
- Idea: an order past its lost-mail threshold first goes to "unaccounted", not "lost". Each household member taps "not seen" or "I have it". It turns lost only when every member says "not seen".
- Who and why now: the collector. Once a second person fetches the mail, the most common "lost" envelope is sitting on a roommate's desk. A false lost claim costs a small seller a refund, and repeat claims can flag the buyer's account.
- Shape: a short "Has anyone seen…" card for each overdue order, showing the seller, the ship date and the envelope count. Data: a member list (names only) and one synced answer per member per order.
- Risks: a member who never answers blocks the flag for good, so it needs a timeout or a buyer override. It adds one synced record per member.
- Owner decides: does a non-buying member need the app at all, or does the buyer tick names for them ("asked Sam: no")?

## Twin envelopes: seller collision warning
- Idea: tag each import with the buyer whose account it came from. When two buyers have open orders from the same seller, mark both orders "twin", because their envelopes will look identical.
- Who and why now: whoever sorts the mail. A plain envelope carries at best the seller's return address. That is enough with one buyer, but with two it is a coin toss.
- Shape: the import asks "whose export is this?" once per file and remembers the account. Packages shows a twin badge with both buyers' names. Checking in a twin asks "whose cards were inside?" after opening, never before.
- Risks: this is a new field on every order, and old data defaults to the owner. A wrong tag mislabels a whole file, so the owner needs a way to re-tag one file.
- Owner decides: is the buyer set per file, per order, or per line (see Settle up)?

## Hand-off slip: arrived vs opened
- Idea: split check-in into "in the house" (anyone who brings the mail in) and "opened and counted" (the buyer). Packages becomes a sort tray, and each envelope gets a routing line such as "Hand to Mira: 3 cards from Oakleaf Games".
- Who and why now: the partner who grabs the mail but cannot tell whose envelope is whose. Today a check-in means the buyer saw the cards. A helper's tick breaks that meaning.
- Shape: one tap marks "in the house", and the buyer later counts cards line by line. Outstanding shows three bins: in transit, in the house unopened, and done.
- Risks: a second state changes what "received" means everywhere, Tally included. It takes two taps where one did before.
- Owner decides: does Tally's cost basis count "in the house", or only "opened and counted"?

## Sealed gift orders
- Idea: a buyer marks an order "gift for Ana". On Ana's devices it shows only "Not yours: hand to Jo, do not open", with no cards, seller or price.
- Who and why now: a partner or parent who buys cards for the collector in the same home, mostly before birthdays and holidays. Without this, the shared ledger spoils the surprise. Or the gift buyer stays out of the ledger, and their envelopes land in Orphaned as noise.
- Shape: a toggle and a recipient on each order, unsealed on a set date or by hand. Data: a gift flag, a recipient, and per-member views.
- Risks: a filter only in the screen hides nothing from a curious teenager with browser dev tools. Real hiding needs per-member views on a server built for one owner. Gift lines must also stay out of the recipient's Tally until unsealed.
- Owner decides: is hiding on screen enough, or must the server never send sealed rows to the recipient's device key?

## Settle up: who owns vs who paid
- Idea: lines in one order can belong to different people. A roommate rides on the collector's cart to reach free shipping, or a parent's card pays for a teen's cards. Each line gets an owner, and the order keeps its payer.
- Who and why now: the payer, at month end. A line such as "Sam owes $12.40 for 9 cards received" counts only received lines. Lost mail never bills the wrong person, and a refund lands on the right side.
- Shape: long-press a line to set its owner. A Settle tab lists a balance per person with "mark paid". Data: the line owner, the order's payer, and settlement entries.
- Risks: every rule for splitting shipping and tax (by count, by price, or the payer absorbs it) looks unfair to someone. Settlement history is money data on a shared server.
- Owner decides: the shipping split rule, and whether settling up belongs in MANIFEST or exports to the household's existing money app.

Strongest: Ask the house before "lost" — it fixes the one signal (lost mail) that quietly goes wrong once a second person fetches the mail, and it needs only names, with no per-member views or money rules.
