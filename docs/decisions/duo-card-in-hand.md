# On the iPhone Duo, Card in Hand checks cards in by name

Kind: build

Plan: docs/design/duo-blind/README.md#pick (native)

**Status:** ruled on 2026-10-27 at 12:25 CDT. Round 2 answers came on 2026-10-27 at 14:26 CDT, on the waiting page. The round 2 design is PR 144, the Duo round 2 design pull request. Item 22 is provisional. Item 25 (the Lost stamp) and item 27 (held Suspense cards) are open. No native Duo view is built yet.

On the iPhone Duo, Card in Hand checks cards in by name. The concept comes from PR 139, the Duo blind-design pull request. The card you hold is the search, and the envelope is the answer. Two parts come from other concepts in the same PR: the past-transit page from the Sorting Frame, and the Suspense line from the Account Book.

## Ruled

The owner ruled on 2026-10-27, 12:25 CDT. Round 2 answers, 14:26 CDT, are marked as round 2.

- **Concept.** The card you hold is the search. You type a few letters of its name. The open phone shows the envelope the card came from, and the cards that should travel with it.
- **Shared name.** A card whose name two envelopes share is held as a stray, until the next card from that envelope decides it. Round 2 item 26 (option a) chose this rule, and added a New envelope control.
- **Suspense.** An envelope with no sender waits in Suspense. It waits until its cards name the account it fits.
- **Past transit.** Late envelopes sit on their own page, oldest last. Lost and Refunded sit beside them.
- **Claim deadline.** 30 days from the order date, the rule in `lost-mail-flags-use-order-date`. The 28 days in PR 139 is dropped.
- **Usual transit.** 14 days. The past-transit page starts where the amber flag starts. The 10 days in PR 139 is dropped.
- **Tab bar.** Round 2 item 23 (option a): the tab bar on two pages always sits under the right page.
- **Other tabs.** Round 2 item 24 (option b): on the open Duo, Tally and Orphaned spread over both pages. Ledger stays full width.
- **Stacked poses.** Round 2 item 28 (option a): in stacked poses (laptop, held tall), the answer page goes on top.

## Keys across the fold

Round 2 item 22 is provisional. The owner said: "do whichever will require less work to build now, and then once i review/test i can say if i want to go another direction." The build uses the system keyboard, as iOS gives it, which spans both pages. There is no custom key pad. The owner reviews after testing.

## Still open

**Item 25, the Lost stamp.** Choose one: add a Lost stamp kind, or offer the six existing stamps.

**Status:** open.

**Item 27, held Suspense cards.** When Card in Hand closes, the held Suspense cards either stay held, or go to Orphaned.

**Status:** open.

## Fold measure

The fold figures are in `duo-fold-and-keyboard`. This record keeps the rules that use them.

- The build reads the fold at run time, through the reservedRegions call with kind division, as the degen project does for its Duo spread. No width is hard-coded.
- An earlier reading, taken at 01:25 CDT in one short Device Hub run that the owner allowed, had the phone boot closed. It gave the outer screen as 382 by 644 pt of safe content, and reported no fold while closed. The 14:03 reading reports no fold while open. The two readings do not agree on the closed state. Re-read the fold in the build.

## Default, not an owner ruling

Two pages show only when the hinge reports a fold inside the window. Otherwise the phone shows today's one-page layout. This is the same rule as section 4.6.2 of the degen plan. The owner has not ruled on it.

A typed query matches the start of each word of the normalized name, see `envelope-names-match-normname`. This is a default, not an owner ruling.

**Holds while:** no native Duo view is built yet, and the owner's pick of Card in Hand stands. Item 22 holds until the owner reviews the test build.

## See also

- `lost-mail-flags-use-order-date` — the amber and red flags that set the 14 and 30 day figures.
- `native-swift-rebuild` — the ruling that makes the native client.
- `native-parity-table` — the scope of each feature in the native client.
- `duo-fold-and-keyboard` — the fold strip, keyboard frame and outer screen figures.
- `new-envelope-ends-an-envelope` — the New envelope control, and how a shared name is decided.
