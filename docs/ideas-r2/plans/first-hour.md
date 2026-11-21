# The first hour

Premises (all from the brief, with no repo files read, as it asked). I set a premise to "holds" only where the auto-loaded project CLAUDE.md shows it:
- The new user starts with no data. Source: brief. Unknown.
- The new user does not know how to export orders. Source: brief. Unknown.
- Envelopes arrive before the first import. Source: brief. Unknown. Today the only home for mail with no known sender is Orphaned (CLAUDE.md, three views).
- About 200 cards arrived before the user started. Source: brief. Unknown. Nothing I can see lets a user mark them all at once.
- Imports add to what is there and never wipe it. Source: invariant `imports-merge-never-replace`. Holds. Directions C and B depend on it.
- Each new state must fit the frozen saved-state shape. Source: invariant `saved-state-shape`. Holds. It limits A and B.

## A. The starting line
Idea: on the first import, ask one question: "On what date did you start checking mail here?" Every card ordered more than N days before that date is marked "arrived before the ledger". The user then checks off only what is missing, instead of ticking 200 cards by hand.
Who and why now: the cold user with 200 cards already in binders. Without this, hour one is spent ticking the past, and that is when they quit.
Shape: after the import, one card shows: "You have 74 orders (412 cards). 61 orders are older than 10 days. Treat them as arrived?" There is a slider for N and a preview ("Ironvale Cards, 6 cards, ordered 2026-10-02"). The flip view lists the treated orders, and one tap means "this one never came". Data: order date and import time only.
Risks: one wrong blanket mark hides a lost package that is still within the refund window. The cost tally and lost-mail flags must treat "arrived before the ledger" differently from "checked in".
Owner decides: whether this is a third state or a dated note on "received", given `saved-state-shape`. Also the default N, and whether lost-mail flags stay quiet for those orders.

## B. Envelopes before data
Idea: let the user log envelopes before any import exists, like "envelope from 'M. Okafor', 3 cards: Lightning Bolt, ...". When the first CSV lands, each logged envelope is offered as a likely match to an order.
Who and why now: the user with three envelopes on the table and no export yet. Their first act should be opening mail, not reading export docs.
Shape: the empty state's main button is "I have mail in hand", above "Import orders". The form takes a sender line, a card count and optional card names. After the import, a "Match your 3 envelopes" step shows ranked candidates, and the user confirms each one.
Risks: this overlaps Orphaned. `orphaned-mail-never-decides` (orphaned mail never decides anything) means a match must stay a suggestion until the user confirms it. Fuzzy name matching across sellers that sell the same cheap card will be wrong often.
Owner decides: whether a pre-import envelope is just an Orphaned entry that gains a "suggest match" step, or a new kind. Reusing Orphaned is the simpler route and keeps one home.

## C. The export coach and the import receipt
Idea: the empty state teaches the export, recognises the wrong file, and gives a receipt after every import.
Who and why now: the user who heard "export your orders" and has no idea where. The second import, a week later, is the day-two moment. The receipt proves nothing was lost.
Shape:
- A three-step text guide, with the menu path written as words.
- A "drop any file" zone. It names what it got wrong ("This looks like a seller payout file, not an order export") and says which columns it expected.
- A receipt after each import, for example: "58 new cards, 142 already here, 3 rows skipped (not card purchases), see why."
- An optional sample ledger with invented sellers. It is tagged SAMPLE and wiped with one tap.
Data: the parser's skip reasons, and a count of duplicates per import.
Risks: the export steps drift when the marketplace or OrderWand changes its menus, so the guide needs a check or a date. The sample data must never mix with real data or sync.
Owner decides: whether to ship a sample ledger at all, and whether skipped rows are shown or only counted (`parser-filters`, the parser keeps only card purchases).

## D. Tomorrow's mail
Idea: a "what should come next" line for each day, such as "Expect 4 to 7 envelopes this week; 2 are late." The expected window starts from a default transit time and then learns from the user's own check-ins.
Who and why now: the day-two return. A new user has no reason to reopen the app until the mail comes. A forecast gives them one, and it makes the lost-mail flag feel earned rather than arbitrary.
Shape: a strip at the top of Packages: today, this week, and late. Each late order shows its days past the window and its cost, and offers "mark lost" or "keep waiting". Data: order date, check-in date, and a per-seller or per-region transit estimate built from history.
Risks: the default is wrong until about 20 check-ins exist. The strip must say it is a guess, and the window should widen rather than flag too early. If the strip can collapse or expand under the pointer, it breaks `no-layout-shift-under-pointer` (no layout shift under the pointer).
Owner decides: the default window, whether the forecast learns per seller or only globally, and whether "late" needs a separate setting from "lost".

## E. Phone at the mailbox, key in the drawer
Idea: in the first hour, pair the phone from the web import in one step (a QR code on the web page, scanned by the phone app). Right after, show a one-time "recovery card" to print or save, holding the device key.
Who and why now: the user imports on a laptop but opens mail at the front door. If the phone has no data, the habit never forms. If the key is lost, months of check-ins are gone (open thread `nothing-recovers-without-the-key`).
Shape: after the first import, a step reads "Check mail on your phone? Scan this." After pairing, the user is asked "Save your recovery card", and the step is skippable but asked again on day two. Data: the existing device key and the sync server.
Risks: a QR code that holds a credential is a leak path (`the-token-is-a-credential`). It needs a short-lived pairing code, not the key itself. A printed key is also a credential.
Owner decides: whether pairing is offered in hour one or held back until the user has checked in a few envelopes, and whether the recovery card exists at all.

Strongest: A. The starting line. It removes the single largest first-hour cost (re-ticking 200 cards already received) with one question and two data fields, and every other direction assumes the ledger already starts out true.
