# On the iPhone Duo, Card in Hand checks cards in by name

Kind: build

Plan: docs/design/duo-blind/README.md#pick (native)

**Status:** ruled on 2026-10-27 at 12:25 CDT. Round 2 answers came on 2026-10-27 at 14:26 CDT, on the waiting page. Defaults and deferrals came at 15:34 CDT. Item 22 is provisional. Item 25 (the Lost stamp) is deferred. Item 27 (held Suspense cards) is default, not owner. The Duo shell (the tab bar under the right page) and Card in Hand with its past-transit page are built; the spread tabs are not. The round 2 design is PR 144, the Duo round 2 design pull request.

On the iPhone Duo, Card in Hand checks cards in by name. The concept comes from PR 139, the Duo blind-design pull request. The card you hold is the search, and the envelope is the answer. Two parts come from other concepts in the same PR: the past-transit page from the Sorting Frame, and the Suspense line from the Account Book.

## Ruled

The owner ruled on 2026-10-27, 12:25 CDT. Round 2 answers, 14:26 CDT, are marked as round 2. Answers of 15:34 CDT are marked as 15:34.

- **Concept.** The card you hold is the search. You type a few letters of its name. The open phone shows the envelope the card came from, and the cards that should travel with it.
- **Shared name.** A card whose name two envelopes share is held as a stray, until the next card from that envelope decides it. Round 2 item 26 (option a) chose this rule, and added a New envelope control.
- **Suspense.** An envelope with no sender waits in Suspense. It waits until its cards name the account it fits.
- **Past transit.** Late envelopes sit on their own page, oldest last. Refunded sits beside them. The page uses the existing stamp list, with no Lost kind (item 25, deferred at 15:34 CDT).
- **Claim deadline.** 30 days from the order date, the rule in `lost-mail-flags-use-order-date`. The 28 days in PR 139 is dropped.
- **Usual transit.** 14 days. The past-transit page starts where the amber flag starts. The 10 days in PR 139 is dropped.
- **Tab bar.** Round 2 item 23 (option a): the tab bar on two pages sits under the right page. Stacked poses are the exception, see below.
- **Other tabs.** Round 2 item 24 (option b): on the open Duo, Tally and Orphaned spread over both pages. Ledger stays full width.
- **Stacked poses.** Round 2 item 28 (option a): in stacked poses (laptop, held tall), the answer page goes on top. At 15:34 CDT (owner, a), the system tab bar sits at the bottom of the screen.
- **Tracked late packages.** At 15:34 CDT (owner, a), keep today's `lostMail` rule, which skips tracked packages. See `lost-mail-flags-use-order-date`.

## Keys across the fold

Round 2 item 22 is provisional. The owner said: "do whichever will require less work to build now, and then once i review/test i can say if i want to go another direction." The build uses the system keyboard, as iOS gives it, which spans both pages. There is no custom key pad. The owner reviews after testing.

At 15:34 CDT (owner, a), the tab bar stays under the keys while they are open. It shows again when the keys close.

## Deferred and default answers

**Item 25, the Lost stamp.** The options were: add a Lost stamp kind, or offer the six existing stamps. At 15:34 CDT the owner deferred it: "i dont think this is so important that it holds up a lane we can leave it deferred for now". The past-transit page uses the existing stamp list, with no Lost kind.

**Status:** deferred.

**Item 27, held Suspense cards.** When Card in Hand closes, the held Suspense cards either stay held, or go to Orphaned. Default, not owner: they stay held. The web app copies this, where nothing moves on its own.

**Status:** default, not owner.

## Fold measure

The fold figures are in `duo-fold-and-keyboard`. This record keeps the rules that use them.

- The build reads the fold at run time, through the reservedRegions call with kind division, as the degen project does for its Duo spread. No width is hard-coded.
- An earlier reading, taken at 01:25 CDT in one short Device Hub run that the owner allowed, had the phone boot closed. It gave the outer screen as 382 by 644 pt of safe content, and reported no fold while closed. The 14:03 reading reports no fold while open. The two readings do not agree on the closed state. Re-read the fold in the build.

## Defaults

Owner, 15:34 CDT: where the owner has not ruled, the native Duo copies the web app's current behaviour. Each such default is marked default, not owner.

Two pages show only when the hinge reports a fold inside the window. Otherwise the phone shows today's one-page layout. This is the same rule as section 4.6.2 of the degen plan. Default, not owner. The owner has not ruled on it.

A typed query matches as the web search does: a case-insensitive part of the card name, set, seller or order id, through the web's one matcher. Default, not owner.

Packages does not spread on the open Duo. It keeps the web's one-page layout. Default, not owner.

Card in Hand opens from a `hand-open` control at the top of Packages, on two pages side by side only, and covers both pages. The mockup makes it the Packages tab itself. Default, not owner. The owner is being asked.

A unique name shows its envelope with a check-in tap on each line. Post shows only when a held card came with the typed one, and it never runs by itself. Default, not owner.

**Holds while:** the owner's pick of Card in Hand stands. Item 22 holds until the owner reviews the test build.

## See also

- `lost-mail-flags-use-order-date` — the amber and red flags that set the 14 and 30 day figures.
- `native-swift-rebuild` — the ruling that makes the native client.
- `native-parity-table` — the scope of each feature in the native client.
- `duo-fold-and-keyboard` — the fold strip, keyboard frame and outer screen figures.
- `new-envelope-ends-an-envelope` — the New envelope control, and how a shared name is decided.
