# Card in Hand: the Post offer keeps the sender

Mockup: `duo-hand-post-sender.html`. Debt: `hand-post-scroll-hides-sender`. Decision: `duo-card-in-hand`.
Lane kind: informed (the brief names no kind).

Deep links: `#s=today`, `#s=a`, `#s=a-posted`, `#s=b`, `#s=folded`. No hash shows all.

## Sizes and sources

- `layout.py devices` gives `unknown` for this repo. So the open pose is drawn at the brief's size: 951 by 669 pt, fold 40 pt at 455.5 to 495.5 pt (`duo-fold-and-keyboard`).
- The keys top is the brief's 405 pt: the panel draws there, 44 pt above the 449 pt frame (`duo-keyboard-gap-unmeasured`).
- The status bar foot on the inner screen is unmeasured. It is drawn at 20 pt, the floor in `DuoHandUITests.statusBarFloor`.
- Row heights come from the code at the default text size, and are estimates. Sender block: 16 + 13 + 8 + 27 + 8 + 14 = 86 pt to the date's foot. One-copy `ItemLine`: about 64 pt. Offer box (`HandScreen.postBox`): about 110 pt. The Today frame is offset so "It came from" sits at y -152, as the simulator measured. The seller at y -131 then checks only the sender block, not the row or box heights, so the row counts below are estimates.
- Theme: one. The native app is held to light (`design-parchment-ledger`).
- Apple pages read 2026-10-29, each answered 200: Layout (respect the system safe areas), Buttons (a hit region of at least 44x44 pt), Accessibility (44x44 pt default control size on iOS).

## Items

1. **Where the offer sits.**
   - Today (`HandScreen.envelope`, `postBox` after the lines; `revealOffer` scrolls it to the foot above the keys). Gain: the order of mockup pose 2. Loss: the sender leaves the top, and rows sit under the status bar.
   - A: the offer sits under the sender and the date, above the lines. Sender at y 36 to 106; Post hit frame at y 168 to 212. Gain: it clears the keys by 193 pt, with no keyboard figure. It also holds at large text sizes. Loss: the offer comes before the lines it posts. Lines above the offer: 0. Below it: 2 whole lines, and the top 44 pt of the third.
   - B: the sender is pinned above the scroll view, and the offer is pinned above the keys (`safeAreaInset(edge: .bottom)`). Gain: today's order. Lines above the offer: 2 whole lines, and the top 28 pt of the third. Loss: SwiftUI's keyboard inset ends at the 449 pt frame. So Post clears the drawn panel only with a 44 pt pad, an unmeasured figure. If the panel draws higher, a pinned Post is under the keys and no scroll reaches it.
   - Pick: A.
   - Departs from: today's order (`HandScreen.envelope`) and mockup pose 2 of round 2 (offer under the lines). Not blocking.
   - Owner grant: no.

2. **What scrolls.**
   - A replaces `scrollTo(offerID, anchor: .bottom)` with a scroll to the page top when the offer shows: the scroll position at edge `.top`, or an id on the padded VStack. Not an id on the sender text, which could align it to the bounds top, under the status bar. It drops both `onScrollGeometryChange` handlers and `revealPending`. The page then sits at its top, so no row is under the status bar. Gain: less code, and no read of the keyboard. Loss: none found.
   - Pick: A.
   - Owner grant: no.

3. **After Post.**
   - Today (`HandModel.post` sets `offer = nil`): the box leaves. In A, the lines would then rise into the slot the finger just pressed. In B, they would grow down into it.
   - `HandModel.post` also refuses when the ledger changed since the offer (a line check-in or a sync reply). It then sets `offer = nil` too, and the box leaves the same way.
   - New: a receipt of the same height takes the slot on either outcome. On success it reads "2 cards checked in · 1 was held". On a refusal it holds the refusal line. It holds until the next card is typed, or New envelope ends the envelope. The view keeps it in its own state; the model does not change. Precedent: the round-2 mockup's posted pose puts the receipt where the press was. Gain: nothing moves under the finger (`no-layout-shift-under-pointer`). Loss: one more state to build and test.
   - Pick: the receipt.
   - Departs from: today's box that leaves on Post (`HandModel.post`). Not blocking.
   - Owner grant: no.

4. **The offer arrives on an envelope already shown.** `HandModel.read` sets the offer in the same call that sets the hits. So the offer usually comes with its envelope. When the same envelope stays shown and an offer comes later, A moves the lines down by 118 pt. That happens on a keystroke on the left page, not under a press on the right page. B moves no line. Pick: accept it in A, and say so. Owner grant: no.

5. **The check-in error band.** The `hand-checkin-error` overlay sits at the top of the right page, and covers the sender while it shows. No change here; it shows only after a failed save. Owner grant: no.

6. **Folded pose.** Card in Hand opens only on two pages (`PackagesTab.twoPages`). The folded frame is drawn only to say that nothing changes. Owner grant: no.

## SwiftUI change implied by A

In `HandScreen.envelope`, move `postBox` up, under the date, above the lines. Scroll to the page top when the offer shows. Drop the two geometry handlers. Keep the slot as a receipt after Post, on success and on refusal.
