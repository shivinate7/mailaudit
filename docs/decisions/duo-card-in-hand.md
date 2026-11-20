# On the iPhone Duo, Card in Hand checks cards in by name

Kind: build

Plan: docs/design/duo-blind/README.md#pick (native)

**Status:** ruled on 2026-10-27 at 12:25 CDT. Round 2 answers came on 2026-10-27 at 14:26 CDT, on the waiting page. Defaults and deferrals came at 15:34 CDT. Item 22 is provisional. Item 25 (the Lost stamp) is deferred. Item 27 (held Suspense cards) is default, not owner. Item 35 is ruled: option a, "Keep Packages; add a Card in Hand control", 2026-11-18 23:17 CST. Built: the Duo shell (the tab bar under the right page), Card in Hand on side-by-side pages, and the past-transit page, which the `hand-open` control on Packages opens. Not built: the spread tabs; the stacked poses (`duo-stacked-poses-unbuilt`); and eight mockup parts (`duo-hand-mockup-gaps`). The round 2 design is PR 144, the Duo round 2 design pull request.

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
- **Tab bar text.** Ruled by the coordinator on 2026-11-08 at 08:17 CST, under the rule that a port keeps the web's behaviour (claude-settings `building-port-keeps-behaviour`). The web bar's labels are a fixed 10 px (`src/app.jsx`, `.mdl-bar button`; decision `phone-nav-is-bottom-bar`). The open Duo's bar labels and count badge stop growing at the default text size (`dynamicTypeSize(...large)`), so no label passes its button or the 64 pt pill at any accessibility size. Each tab also offers the iOS large content viewer (`accessibilityShowsLargeContentViewer`, the tab's label and symbol), so a long press shows it big. Symbols only is ruled out. Departs from: the web bar, which has no long press — adds the iOS large content viewer on each tab. The debt is `duo-bar-dynamic-type-clips`.
- **Other tabs.** Round 2 item 24 (option b): on the open Duo, Tally and Orphaned spread over both pages. Ledger stays full width.
- **Stacked poses.** Round 2 item 28 (option a): in stacked poses (laptop, held tall), the answer page goes on top. At 15:34 CDT (owner, a), the system tab bar sits at the bottom of the screen.
- **Tracked late packages.** At 15:34 CDT (owner, a), keep today's `lostMail` rule, which skips tracked packages. See `lost-mail-flags-use-order-date`.
- **Card in Hand entry.** Owner, page item 35 (`duo-card-in-hand-entry`), option a, 2026-11-18 23:17 CST: "Keep Packages; add a Card in Hand control". Card in Hand is not the Packages tab. Option b, Packages becomes Card in Hand, is not chosen.
- **Still owed place.** Owner, page item 78 (`hand-still-owed-place`), option a, 2026-11-18 23:22 CST: "Still owed here" sits on the order line. Option b, under the lines, is not chosen.

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

Card in Hand opens from a `hand-open` control in Packages. The control is ruled, item 35 a (see Ruled). Default, not owner: the control sits at the top of Packages, on two pages side by side only, and covers both pages. The mockup makes Card in Hand the Packages tab itself, which is not chosen.

A unique name shows its envelope with a check-in tap on each line. Post shows only when a held card came with the typed one, and it never runs by itself. Default, not owner.

On Card in Hand, the match list and its "Matches" heading sit below the envelope row and New envelope. Mockup pose 2 draws them above. With the list above, a tap on a match shrinks the list and moves New envelope under the finger. The invariant `no-layout-shift-under-pointer` outranks the mockup. Departs from: mockup pose 2. Settled by the invariant, not the owner. After a tap on a match, the list holds: every row keeps its place until the next keystroke, a saved Post, New envelope or Close. So no row slides under the finger, and a Suspense box does not rise. The hold ends at a saved Post only after the press, so the next card starts with a clean list (owner, item 85 `hand-post-clears-hold`, option a, 2026-11-09 22:02 CST). The tapped row is bold with an accent bar; the others stay tappable in soft ink. Every row pads 10 pt, so the bar sits in a gutter and no name moves on a tap. No UI test pins the name's sideways place, because no UI test read can see it; the design review judges it from shots, and every other tap check stays. Ruled by the owner, item 48 `duo-tap-shift-check`, 2026-11-07 18:35 CST. The gap is `hand-tap-label-unpinned`. Departs from: today's collapse in `HandScreen.matches` (default, not owner). The gap `hand-suspense-tap-shift` is retired: its pinning tests passed on the first attempt in CI run 42577148982. The mockup is `docs/design/duo-hand-tap-shift.html`.

On Card in Hand, the Suspense and Released boxes sit below the matches, not above This envelope. So while a box shows, the one match row clears the keys. A press on New envelope that clears the Suspense box does not move the button. Departs from: HandScreen order with the boxes above This envelope (default, not owner). Loss: at large text, with two or more matches, or once word suggestions show, the boxes sit under the keys. A manila chip in the search field (`hand-held-chip`, "1 held · 1 released", capped at xxxLarge, not tappable) says above the keys that a card is held or released. The gap `hand-held-box-under-keys` is retired: the seven chip tests passed on the first attempt in CI run 42666668781. The mockups are `docs/design/duo-hand-notice-match.html` (box order) and `docs/design/duo-hand-held-box.html` (chip).

On Card in Hand, the lines keep the order sender, then lines. The sender (the "It came from" line, the seller and the order date) is pinned at the top of the answer page, and the lines scroll under it. The Post offer is a bar pinned just above the keys. Owner ruling: item 103 b, 2026-11-19 19:26 CST: the bar is 53 pt and holds the Post button alone, full width, on a hairline (1 pt, 4 pt, the 44 pt button, 4 pt). The sentence "Your held card came with this envelope." leaves the screen and becomes the first sentence of the button's VoiceOver hint, before "Nothing is checked in until you post." (`HandPostBar.hint` in ManifestKit). The held-card words are item 80, not ruled: they stay as built. Owner ruling: item 104 a, same time: the bar's text is capped at xxxLarge, so the bar holds 53 pt while the title fits one line at the cap (a long title wraps and grows the bar), and the Post button shows the large-content viewer at accessibility sizes. Owner ruling: item 106 a, post-bar-receipt-words, 2026-11-19 23:23 CST: at the largest text sizes the receipt shows the count alone; "Posted." is spoken by VoiceOver only. UI tests pin the offer bar and the receipt at 53 pt within 1 pt, at L and at AX5 (`testPostOfferBarIsFiftyThreePointsTall`, `testPostOfferBarStaysFiftyThreePointsTallAtAccessibilityXXXL`, `testPostReceiptIsOneRowFiftyThreePointsTall`, `testPostReceiptIsOneRowFiftyThreePointsTallAtAccessibilityXXXL`); no run has read them on the built screen yet. S, M and the refused receipt are unmeasured (debt `duo-post-bar-unmeasured-s-m`). Default, not owner: the bar's foot sits on the keys' drawn top, 44 pt above the keyboard frame XCTest reports (`duo-fold-and-keyboard`); SwiftUI's keyboard safe area already ends there, so the bar adds no pad with the keys up (duo-ui run 44469334404). With the keys down it clears the floating tab bar, unmeasured (debt `duo-post-bar-unmeasured-s-m`). Default, not owner: after a Post that saves or is refused, a receipt of the bar's height and one row holds the slot until the next card or New envelope: "Posted." with the count, or "Not posted." with "Type the card again to post." in red. A failed save keeps the offer. Owner ruling: item 42 b, `duo-hand-post-order`, "Build B now", 2026-11-18 23:22 CST, with the note "make the pin not so thick". The ruled parts are the pinned bar, the dropped Post-under-sender order, and the thinner bar. Departs from: the order of the Post-under-sender build (offer under the sender, scroll to the top on show) and its two-sentence stacked offer, both in `HandScreen.swift` before this change. Owner ruling: item 105 a, 2026-11-19 19:26 CST: from AX3 up the head shows the seller only, and its VoiceOver label holds the sender line, the seller and the order date. AX1 and AX2 keep the full head; no test reads that head. At AX2 the hand did not open on a tap (measured, debt `hand-open-under-bar-at-l`); AX1 is unmeasured; the sender-line test runs at the normal size (`testHeadKeepsItsSenderLineAtTheNormalSize`). The drawn top is the simulator's figure, unmeasured on a device (`duo-keyboard-gap-unmeasured`). The mockup is the page docs/design/duo-hand-post-bar-53.html and its notes, on the design branch design-duo-post-bar-53 until it merges; the earlier drawings are duo-hand-post-pin.html (design branch design-duo-post-pins) and `docs/design/duo-hand-post-sender.html`.

**Holds while:** the owner's pick of Card in Hand stands. Item 22 holds until the owner reviews the test build.

## See also

- `lost-mail-flags-use-order-date` — the amber and red flags that set the 14 and 30 day figures.
- `native-swift-rebuild` — the ruling that makes the native client.
- `native-parity-table` — the scope of each feature in the native client.
- `duo-fold-and-keyboard` — the fold strip, keyboard frame and outer screen figures.
- `new-envelope-ends-an-envelope` — the New envelope control, and how a shared name is decided.
- `duo-stacked-poses-unbuilt` — the stacked poses of item 28, not built.
- `duo-hand-mockup-gaps` — the eight mockup parts not built.
