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

## Phase 2: The starting line (fleshed out)

**Idea.** On the first import, ask one question: "From what date are you checking mail here?" Orders placed before that date are marked arrived in one step. The user only names the few that never came. They do not tick 300 cards by hand.

### Flow, step by step
1. **The trigger.** The user's first import lands in an empty ledger (no check-ins yet). The import receipt from round 1 shows its counts. Below it, a starting-line panel opens in space the page holds for it, so the list under the pointer does not move.
2. **The question.** "When did you start watching your mail?" A date stepper defaults to 10 days before today: 2026-11-11. Beside it is a live count in fixed-width figures: "61 of 74 orders (338 of 412 cards, $87.40) will count as arrived."
3. **The preview.** The orders before the line are grouped by seller, oldest first. Example: "Ironvale Cards, 6 cards, ordered 2026-10-02, $3.10." Each row has a "Never came" switch. A row expands to per-card switches for an order that came partly. The orders after the line sit under "Still expected (13)", read-only.
4. **Confirm.** One button names its act: "Mark 59 orders arrived (2 left out)." No native dialog. The button stays where it is and becomes the result line: "59 orders marked arrived. Undo." This line keeps the panel's height until the user leaves the view.
5. **After.** Packages shows as outstanding only the 13 later orders and the 2 left out. The existing lost-mail warning fires at once on the 2 left out, which is correct, since the user said they never came. Tally counts the marked cards as received, and their cost stays in the cost basis (and in landed cost, if that ships).
6. **Skip.** "Start with everything outstanding" closes the panel. The offer comes back only through the import receipt: "12 orders in this file are older than your first import. Treat them as arrived?"

### Screen states
- **Empty.** There is no import, so there is no panel. The empty state says one line: "Mail already in hand? After your first import you can mark it all at once."
- **Normal.** As in steps 2 to 4. At phone width the stepper and count sit on one row, and the preview is a single column with a 44 pt switch per row.
- **Edge: every order is before the line.** The count reads "All 74 orders will count as arrived. Nothing left to watch." The button stays, with no second prompt, because Undo covers it.
- **Edge: no order is before the line.** "Nothing before 2026-11-11." The stepper stays live and the button is disabled with its reason shown.
- **Edge: an order with no date** (the parser kept the row, but its date did not read). It is never marked. It is listed as "3 orders with no date: check these yourself."
- **Edge: an order that already has a check-in, a "claim filed" stamp or a "refunded" stamp.** It is never touched. The count adds "14 already checked, 1 with a claim."
- **Edge: a large first import** (900 orders). The preview shows totals per seller and pages its rows. The count stays exact.
- **Edge: Orphaned.** Orphaned entries are never matched, used up or counted (`orphaned-mail-never-decides`). The panel does not mention them.
- **Error: the write fails** (storage full or blocked). All or nothing. The panel says inline: "Nothing was marked. Your import is safe. Try again." No partial set is saved.
- **Error: sync is down.** The marks are saved locally. The existing sync status shows, and the panel adds nothing.

### Data, and the rule each part touches
- **Slice 1 adds no new fields.** Each mark is an ordinary received check-in, written by the code path a hand check uses. `saved-state-shape` (fixed shape) holds. `storage-keys-are-frozen` holds. `imports-merge-never-replace` holds: the starting line only adds checks and never rewrites or drops an imported row. `parser-filters` (only card purchases kept) holds: the line sees only rows the parser kept. The device key is not touched (`the-token-is-a-credential`).
- **The recent-checks log.** Unknown: whether it can hold one batch entry or would get 327 rows. The builder reads its shape first. If a batch entry needs a new field, that is owner decision 1.
- **Slice 2, under an owner ruling:**
  - One field for the whole ledger, `startLine: { date, setAt }`, inside the existing saved-state object, not under a new storage key.
  - "Arrived before the ledger" is derived: received, ordered on or before `date`, and checked in at `setAt`. No field per card.
  - This lets Tally and the forecast leave these cards out of their transit times, and lets the line be moved later.
- **Sync.** The marks merge like any check-in. Under `merge-later-change-wins`, a hand check on another device after the mark wins, which is harmless because both read "received".

### Smallest first slice that ships alone
The panel shows on the first import only, with the date stepper, the live count, a per-order "Never came" switch, one confirm, and an inline Undo for that view. It writes plain check-ins and adds no fields. The proof is a set of new tests, red first. They show that the marks touch only dated, unchecked, unstamped orders on or before the line that the user did not leave out. They show the write is all or nothing. They show Undo restores exactly the cards the line changed and leaves alone any card touched by hand since. A screen verdict covers each state above at phone and desktop width, in light and dark.

Later slices, in order: the offer in the import receipt for older orders (builds on round 1's receipt with undo); then the `startLine` field (needs a ruling); then a line that can be moved.

### Risks
- **One blanket mark hides a real loss** while the refund window is still open. To lessen it, the preview defaults to oldest first, the button names its count, and Undo is one tap.
- **A transit history polluted by the marks.** Marked cards carry check-in dates that are not real arrival dates. Until slice 2, the mail forecast and the seller record card (both round 1) must ignore check-ins made by the starting line. In slice 1 they cannot tell those apart, which is a known gap and should be filed as a debt.
- **An Undo that also reverts later hand checks.** Undo must limit itself to the cards the line wrote and that no one has touched since.
- **A panel that moves the page when it opens or closes** breaks `no-layout-shift-under-pointer`. Hold its height, and swap its contents in place.
- **A user who skips the panel and later regrets it.** Slice 1 gives no way back, except checking cards by hand.

### Owner decisions, each with a recommendation
1. **Is "arrived before the ledger" its own state?** Recommended: not in slice 1, where marks are plain received. In slice 2, add one ledger-level `startLine` field and derive the state from it. Never add a field per card.
2. **The default line.** Recommended: 10 days before the first import. Match the mail forecast's default transit time if that ships.
3. **When the panel is offered.** Recommended: automatically once, on the first import into an empty ledger. After that, only from the import receipt, when a file holds orders older than the first import. No standing menu item.
4. **Lost-mail warnings on the orders left out.** Recommended: they fire at once. The user has just said those orders never came.
5. **Undo's lifetime.** Recommended: a single entry in the recent-checks log, valid until any card it marked is touched by hand. If the log cannot hold a batch entry without a new field, ship an inline Undo for that view only in slice 1.
6. **Granularity of "never came".** Recommended: per order, with expansion to per card. Partial envelopes are common, so Tally's "did all four arrive" must stay true.
7. **Moving the line later.** Recommended: not until slice 2. Until then, Undo and then set the line again.
