# On the iPhone Duo, mail day is Card in Hand

Kind: build

Plan: docs/design/duo-blind/README.md#pick (native)

**Status:** ruled on 2026-10-27 at 12:25 CDT, except the two items under "Open for round 2". No native Duo view is built yet.

On the iPhone Duo, mail day uses the Card in Hand concept from PR 139, the Duo blind-design pull request. The card you hold is the search, and the envelope is the answer. Two parts come from other concepts in the same PR: the past-transit page from the Sorting Frame, and the Suspense line from the Account Book.

## Ruled

The owner ruled on 2026-10-27, 12:25 CDT.

- **Concept.** The card you hold is the search. You type a few letters of its name. The open phone shows the envelope the card came from, and the cards that should travel with it.
- **Shared name.** A name that two envelopes share is held as a stray. The next card from that envelope decides it.
- **Suspense.** An envelope with no sender waits in Suspense. It waits until its cards name the account it fits.
- **Past transit.** Late envelopes sit on their own page, oldest last. Lost and Refunded sit beside them.
- **Claim deadline.** 30 days from the order date, the rule in `lost-mail-flags-use-order-date`. The 28 days in PR 139 is dropped.
- **Usual transit.** 14 days. The past-transit page starts where the amber flag starts. The 10 days in PR 139 is dropped.

## Fold measure

The owner allowed one short computer-use run on Device Hub. It opens the hinge on the simulator and measures the fold.

- Measured on 2026-10-27 at 01:25 CDT, on the iPhone Duo simulator with iOS 27.1. It boots closed. The outer screen gives 382 by 644 pt of safe content. No fold is reported while closed.
- Unmeasured until that run: the fold width, and whether the system keyboard spans the fold.
- The build reads the fold at run time, through the reservedRegions call with kind division, as the degen project does for its Duo spread. No width is hard-coded.

## Default, not an owner ruling

Two pages show only when the hinge reports a fold inside the window. Otherwise the phone shows today's one-page layout. This is the same rule as section 4.6.2 of the degen plan. The owner has not ruled on it.

## Open for round 2

Not ruled. Design round 2 decides these.

- Where the tab bar sits on two pages.
- The keyboard layout, if the system keyboard spans the fold.

**Holds while:** no native Duo view is built yet; the owner's pick of Card in Hand stands.

## See also

- `lost-mail-flags-use-order-date` — the amber and red flags that set the 14 and 30 day figures.
- `native-swift-rebuild` — the ruling that makes the native client.
- `native-parity-table` — the scope of each feature in the native client.
