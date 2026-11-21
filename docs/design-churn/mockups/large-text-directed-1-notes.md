# Large text: nothing truncates (directed designer 1)

Designer kind: directed. Direction: reflow: let the layout stack and scroll; nothing truncates, ever.

Mockup: `docs/design/large-text-directed-1.html`. Sample figures only. Light theme only: the native app is held to light (`UIUserInterfaceStyle`, decision `design-parchment-ledger`).

Debts this answers: `native-masthead-axl-clips`, `native-count-line-clips`, `native-axl-rows-break`, `hand-open-under-bar-at-l`.

## Concepts

- **One column.** Every row that cannot fit stacks into the next line, and the tab scrolls. The pinned facts stay in the running head at the top. On the open Duo, Card in Hand pins to the top of the right page.
- **Facts at the thumb.** The same reflow. The pinned facts sit in a strip just above the tab bar, and Card in Hand docks there on the open Duo. The focus element for the owner's pick is `<concept>-pinned-facts` on the folded frame (`flow-pinned-facts` or `dock-pinned-facts`).

Both concepts keep today's tabs, first screen and way between tabs. Structure verdict from my own pass: `same` for both. Native verdict: `native` for both (system tab bar, large content viewer, 44 pt targets, scroll views). See item 12.

## Items

1. **Rows stack at accessibility sizes instead of squeezing.** The masthead tallies, the missing line with the save slot, the Tally row's figure column, the envelope header's Edit and Discard, and the armed Reset each move to the next line at AX1 and above. Today's code already does this in places: `MastheadView.tallies` stacks on `isAccessibilitySize`, `AskRow.restoreRow` stacks, and the version rows in `LedgerTab.swift` drop `lineLimit` when stacked. Gain: no row clips, ellipsizes or breaks mid-word, at 320 pt and at AX5. Loss: the tab gets longer and scrolls more. Pick: yes, both concepts.

2. **A line breaks only at a separator, then at a space, never inside a word.** Each part between " · " wraps as one unit first; only a part wider than the line wraps at its own spaces. A figure breaks only after "/". Gain: fixes "ENVELOP/E", "Discar/d" and the mid-word Tally names. Loss: a ragged right edge. Pick: yes.

3. **Every figure reserves its widest 4-digit form.** A hidden copy of "0,000/0,000" or "$0,000.00" sits under each figure, so the line count depends on the reserve, never the live figure. The mockup's "One card tapped" state moves 999 cards to 1,000, and the in-page check reports whether any letterhead, running head or strip height changed. Holds `no-layout-shift-under-pointer` and extends `masthead-save-slot-reserved` (which reserves the slot only, and leaves figures alone on purpose). Gain: reflow never moves rows under the thumb. Loss: some white space beside short figures. Pick: yes.

4. **The count line reserves the longest of its tab variants.** The variants stack in one cell, so a tab change never changes the letterhead's height (`masthead-save-slot-reserved`, native paragraph). Today it wraps at AX sizes with no reserve, so its height can differ by tab. Gain: fixes `native-count-line-clips` without a scale factor. Loss: a blank line on tabs with a short count line. Pick: yes.

5. **The running head grows by whole lines with the text size.** Its height is fixed per text size and never changes with a figure; it still pins by opacity, over a clear slot of the same height. At AX sizes the word mark leaves the head and the seal stands for it, so the figure gets the width. Departs from: `masthead-running-head-sticky` (a fixed 46 pt head) and `MastheadScreen.RunningHead` (title and figure on one line). Gain: "MANIF… 0/14 · $…" becomes the whole figure. Loss: at AX5 the head is about three lines tall on the folded Duo. Pick: One column. **Owner grant: yes.**

6. **Facts at the thumb: the pinned figure sits above the bar, not at the top.** The strip shows once the letterhead's figure has scrolled off, so the figure shows once on screen (`ux-label-once`). The scroll keeps the strip's height free at its end. Gain: the top of the page stays for reading, and the facts sit in thumb reach (`ux-thumb-zone`). Loss: less list shows above the bar at AX5; the strip is new chrome the web does not have. Departs from: `masthead-running-head-sticky` (the head pins at the top). Pick: offered as the second concept. **Owner grant: yes.**

7. **The word mark keeps today's scale-to-fit.** "Manifest" scales down to half size before it would clip (`MastheadView`, `minimumScaleFactor(0.5)` on the title). It is one fixed word, not data, so it is the one thing allowed to shrink. Gain: no mid-word break in the title at 320 pt. Loss: the title is smaller than its Dynamic Type size on a narrow phone. Pick: yes, unchanged behaviour.

8. **Tally sets wrap; they no longer degrade to an ellipsis.** Counts stay first in the meta line. Departs from: `card-tally-row-counts-first` (the set list is cut first). Gain: every set name reads whole. Loss: a row with many sets grows tall. Pick: yes. **Owner grant: yes.**

9. **The armed Reset stacks: Reset full width, Cancel under it.** Reset still arms in place. At rest its box keeps the armed label's height, and the Cancel slot is kept free, so arming moves nothing. Departs from: `armed-reset-takes-the-row` (Reset and Cancel side by side) and `AskRow.resetRow` (fixed 80 pt Cancel, `lineLimit(1)`). Gain: "Tap again to clear 1,350 cards" and "Cancel" read whole. Loss: at rest a tall Reset box with a blank slot under it. Pick: yes at AX sizes; side by side, with a wrapping label, below them. **Owner grant: yes.**

10. **Every scroll keeps the bar's height free at its end.** The last control always scrolls above the bar. Today the open Duo's Packages content can sit under the right-page bar (debt `hand-open-under-bar-at-l`; `duo-left-page-dead-margin` names the opposite case on the left page). Gain: no control is left under the bar. Loss: blank space at the end of each tab. Pick: yes.

11. **On the open Duo the letterhead takes the left page; the tab's body takes the right page.** Nothing sits in the hinge, 455.5 to 495.5 pt. Card in Hand leaves the masthead's flow: One column pins it to the top of the right page (the debt's own second fix), and Facts at the thumb docks it above the right-page bar. Departs from: `duo-card-in-hand` defaults (Packages keeps one page, default, not owner) and round 2 item 24 b (Ledger stays full width). Gain: the facts never scroll away while the list scrolls, and Card in Hand is always in reach. Loss: the left page is mostly letterhead on Packages and Ledger. Pick: yes. **Owner grant: yes** (the Ledger part changes an owner ruling).

12. **Tab bar labels stay at the default size, with the large content viewer.** Unchanged from `duo-card-in-hand`, Tab bar text. A long press on a tab in the mockup shows the viewer. Pick: keep.

13. **No haptic is added.** No control here changes a value (`ux-haptics-feel-substantial`).

14. **At accessibility sizes a dotted line becomes a short list.** "Envelope · 2026-11-02 · 12 cards" reads as three lines with no dots; order ids and dates never break at their hyphens. Gain: no part wraps at a stray space. Loss: taller rows; the count line reserves two lines on tabs whose own line needs one, which reads as a blank line above the missing line. Pick: yes.

15. **A word wider than the whole line takes a hyphen.** Only on the 320 pt phone at AX4 and AX5 ("Counterspell", "Remastered", "Innistrad:"). Nothing else on the Duo, folded or open, needs it. Gain: the word reads whole across two lines, as print does. Loss: it is still a break inside a word, which the brief calls out; the only other way is to shrink the text, which the direction rules out. SwiftUI needs a hyphenation factor in an attributed string for this. Pick: yes, as the last resort. **Owner grant: yes.**

## Checks run on this mockup

- In-page truncation check (button at the page foot, or `#audit=all`), headless Chrome, 2026-11-21: every concept, device, text size, tab and state (324 frames each). One column and Facts at the thumb: no clip, no ellipsis, no plain word split, nothing in the hinge, nothing past an edge, no target under 44 pt, no last control under the bar; 9 frames each show item 15's hyphen on the 320 pt phone. Today: 280 of 324 frames flagged. The 999 to 1,000 tap changed no letterhead, running head or strip height at any size or tab.
- `check_ios_mockup.py`: exit 1 on `system-font`, because app content is set in Cochin (`typography-cochin-and-mono`). The existing `duo-hand-post-sender.html` fails the same way. Chrome uses the system font. Possible false alarm against house tokens ("brand fonts appear only in content").
- `label_once.py` on a rendered frame: "near mint" and "order" repeat; both are data.
- Own design-review pass (no blind reviewers spawned): structure `same` for both concepts; `native` for both.
- impeccable critique (native: design review only; no detector, no snapshot). Fixed: content collided with the status bar time when scrolled (added a scroll-edge fade); empty tag labels drew on some rows. Open: at AX5 the letterhead fills the folded screen's first view, so the list starts below it (question below); the count line's reserved blank line (item 14).

## Sizes and sources

- Devices: `layout.py devices` printed `unknown` for this repo, and the layout file gives no sizes. Folded Duo 466 x 678 pt and open 951 x 669 pt with the hinge at 455.5 to 495.5 pt come from the brief; both match measurement `duo-fold-and-keyboard`. Folded bar from y 595 pt, 83 pt with the bottom inset (same record). Open bar x 520 to 927, y 593 to 657 (debt `hand-open-under-bar-at-l`).
- The large phone has no written size. It is drawn at the brief's 320 pt width, which the frame lets you widen by dragging, with the folded Duo's height and bar borrowed. Not a real device size.
- Status bar foot drawn at 20 pt, the UI tests' floor, as in `duo-hand-post-sender.html`; unmeasured.
- Type sizes: each app style keeps its base size from the code (`Font.cochin` and `Font.mono`, `relativeTo:`), scaled by the ratio of its text style at that level to Large, from the iOS Dynamic Type tables. The point sizes in the mockup are derived, not read off a device. AX names: AX1 AccessibilityM, AX2 AccessibilityL (the debt's "AccessibilityL"), AX3 XL, AX4 XXL, AX5 XXXL.
- The browser has no Cochin or Menlo, so widths differ from iOS. The in-page check proves the layout in Chromium with fallback fonts only.

Apple pages read 2026-11-21, each through its `tutorials/data/...json` form, each answered 200:

- https://developer.apple.com/design/human-interface-guidelines/typography (the Dynamic Type tables, xSmall to AX5)
- https://developer.apple.com/design/human-interface-guidelines/layout (safe areas; respond to text-size changes)
- https://developer.apple.com/design/human-interface-guidelines/accessibility (44x44 pt default control size; enlarge text to at least 200 percent)
- https://developer.apple.com/design/human-interface-guidelines/buttons (44x44 pt hit region)
- https://developer.apple.com/design/human-interface-guidelines/tab-bars (the bar floats above content at the bottom)

## Today, as drawn

The Today section approximates the code's one-line limits with CSS: `lineLimit(1)` as no-wrap with a clip or an ellipsis, the 80 pt Cancel, the 13-character save slot. It cannot draw `minimumScaleFactor`, so a tally cell that would shrink shows as cut. Strings match the debts in kind, not word for word, because the sample has 4-digit figures.

## Input needed

- Items 5, 6, 8, 9, 11 and 15 need an owner grant.
- The large phone's size is not written. Name it, or keep 320 pt.
- At AX5 the folded Duo's first view is all letterhead. Should the tallies collapse to the one cards-and-money line at AX4 and up, with the rest a tap away? That would trade "nothing hidden" for a shorter first screen.
