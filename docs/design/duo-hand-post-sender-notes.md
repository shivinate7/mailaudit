# Card in Hand: the Post offer keeps the sender

Mockup: `duo-hand-post-sender.html`. Debt: `hand-post-scroll-hides-sender`, retired: its pinning test passed on the first attempt in CI run 42577148982. Decision: `duo-card-in-hand`.
Lane kind: informed (the brief names no kind).

Deep links: `#s=today`, `#s=a`, `#s=a-posted`, `#s=b`, `#s=folded`. No hash shows all.

## Sizes and sources

- `layout.py devices` gives `unknown` for this repo. So the open pose is drawn at the brief's size: 951 by 669 pt, fold 40 pt at 455.5 to 495.5 pt (`duo-fold-and-keyboard`).
- The keys top is the brief's 405 pt: the panel draws there, 44 pt above the 449 pt frame (`duo-keyboard-gap-unmeasured`).
- The status bar foot on the inner screen is unmeasured. It is drawn at 20 pt, the floor in `DuoHandUITests.statusBarFloor`.
- Row heights come from the code at the default text size, and are estimates. Sender block: 16 + 13 + 8 + 27 + 8 + 14 = 86 pt to the date's foot. One-copy `ItemLine`: about 64 pt. Offer bar (`offerRow`, pinned above the keys): 61 pt at the normal text size, measured at L through the receipt test, not the bar itself. The old box's 110 pt estimate no longer applies. The Today frame is offset so "It came from" sits at y -152, as the simulator measured. The seller at y -131 then checks only the sender block, not the row or box heights, so the row counts below are estimates.
- Theme: one. The native app is held to light (`design-parchment-ledger`).
- Apple pages read 2026-10-29, each answered 200: Layout (respect the system safe areas), Buttons (a hit region of at least 44x44 pt), Accessibility (44x44 pt default control size on iOS).

## Items

1. **Where the offer sits.** Ruled: owner item 42 b (`duo-hand-post-order`, 2026-11-18 23:22 CST), "Build B now", with the note "make the pin not so thick". The ruled parts are the pinned bar, the dropped Post-under-sender order, and the thinner bar (decision `duo-card-in-hand`).
   - Built (`rightPage`, `slotBar` and `offerRow` in `HandScreen.swift`): the sender is pinned at the top of the answer page, outside the scroll view. The lines scroll in that view, below it. `slotBar` pins `offerRow` at the foot, above the keys (`safeAreaInset(edge: .bottom)`). No reveal scroll is in `HandScreen.swift`. The bar is one row, 61 pt at the normal text size, measured only through the receipt test (run 44479867180). No test measures the bar itself.
   - Gain: the offer stays after the lines, the order of mockup pose 2. At rest 2 whole lines show above the bar, where the mockup showed 3 (design-review finding in debt `duo-post-bar-unmeasured-s-m`; unmeasured).
   - Loss: with the keys up, SwiftUI's keyboard safe area ends at the keys' drawn top, so the bar adds no pad. A 44 pt pad left Post 52 pt above the drawn top (duo-ui run 44469334404). The drawn top is the simulator's figure, unmeasured on a device (`duo-keyboard-gap-unmeasured`). With the keys down, the bar clears the floating tab bar, unmeasured (debt `duo-post-bar-unmeasured-s-m`).
   - Items 2 and 4 below are superseded by the built pinned layout and owner item 42 b.
   - Departs from: the Post-under-sender build (offer under the sender, scroll to the top on show), which item 42 b replaces.

2. **What scrolls.**
   - A replaces `scrollTo(offerID, anchor: .bottom)`, now gone from `HandScreen.swift`, with a scroll to the page top when the offer shows: the scroll position at edge `.top`, or an id on the padded VStack. Not an id on the sender text, which could align it to the bounds top, under the status bar. It drops both `onScrollGeometryChange` handlers and `revealPending`. The page then sits at its top, so no row is under the status bar (unmeasured). Gain: less code, and no read of the keyboard. Loss: none found.
   - Pick: A.
   - Owner grant: no.

3. **After Post.**
   - Today (`HandModel.post` sets `offer = nil`): the box leaves. In A, the lines would then rise into the slot the finger just pressed. In B, they would grow down into it.
   - `HandModel.post` also refuses when the ledger changed since the offer (a line check-in or a sync reply). It then sets `offer = nil` too, and the box leaves the same way.
   - New: a receipt of the same height takes the slot on either outcome. On success it reads "2 cards checked in · 1 was held". On a refusal it reads "Not posted. Type the card again to post.", since the Post button is gone and the left page already gives the reason; the saved count is `manilaInk`, not the mockup's green: green measures 4.03:1 on the slot, under 4.5:1. It holds until the next card is typed, or New envelope ends the envelope. The view keeps it in its own state; the model does not change. Precedent: the round-2 mockup's posted pose puts the receipt where the press was. Gain: nothing moves under the finger (`no-layout-shift-under-pointer`). Loss: one more state to build and test.
   - Pick: the receipt.
   - Departs from: today's box that leaves on Post (`HandModel.post`). Not blocking.
   - Owner grant: no.

4. **The offer arrives on an envelope already shown.** `HandModel.read` sets the offer in the same call that sets the hits. So the offer usually comes with its envelope. When the same envelope stays shown and an offer comes later, A moves the lines down by 118 pt. That happens on a keystroke on the left page, away from any press on the right page. B moves no line. Pick: accept it in A, and say so. Owner grant: no.

5. **The check-in error band.** The `hand-checkin-error` overlay sits at the top of the right page, and covers the sender while it shows. No change here; it shows only after a failed save. Owner grant: no.

6. **Folded pose.** Card in Hand opens only on two pages (`PackagesTab.twoPages`). The folded frame is drawn only to say that nothing changes. Owner grant: no.

## SwiftUI change implied by A

Superseded by item 42 b (`duo-hand-post-order`): the offer is pinned above the keys, not moved above the lines (`slotBar` and `offerRow` in `HandScreen.swift`). The slot still holds a receipt after Post, on success and on refusal (`receiptRow`).
