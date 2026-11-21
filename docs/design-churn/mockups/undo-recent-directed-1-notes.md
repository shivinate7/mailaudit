# Undo from anywhere, directed designer 1: design notes

Designer kind: directed. Direction: shake-free undo: always one tap away from anywhere, no panel.

Mockup: `undo-recent-directed-1.html` beside this file. Open it from disk. Every frame works: tick a card box, press Undo, change tab, open a row. All frames share one sample ledger and one log, as the synced log would.

Governing records: decision `recent-checks-can-be-undone`, debts `recent-log-unbuilt` and `recent-undo-under-bar`, invariant `no-layout-shift-under-pointer`, the earlier mockup `recent-log/recent-log.html`.

## Sizes, themes, deep links

- Duo folded 466 x 678 pt; system tab bar from y 595, 83 pt tall (measurement `duo-fold-and-keyboard`).
- Duo open 951 x 669 pt, fold 455.5 to 495.5 pt; the custom bar pill under the right page, 64 pt tall, 12 pt up, 24 pt in (`DuoBarMetrics`, `DuoBar` in `native/Manifest/DuoSpine.swift`).
- Large phone: no size is written for it (`layout.py devices` printed `unknown`, the brief gives none). Drawn at 375 x 812 pt, the phone size of `test/screens.mjs` (`WIDTHS`, viewport height 812). The tab bar is drawn 83 pt tall, the only measured system bar height. See Input needed.
- AX5 text on the folded Duo, with the HIG sizes: body 53/62, footnote 44/52, caption 1 43/51, caption 2 40/48, large title 60/70.
- One theme, light. `Theme.swift` reads no dark token, so the app ships light only. No theme switch.
- Top inset unmeasured on the Duo screens: drawn at the 20 pt floor, as `duo-hand-tap-shift.html` draws it.

Deep links take `c=both|shelf|tab`, `p=all|folded|open|phone|ax5`, `s=rest|undone|opened|keys|mac|empty|unknown`, `d=3|1`, and `hide=shelf,tab,d3,d1`. Examples: `#c=shelf&p=folded&d=3`, `#c=shelf&p=folded&d=1`, `#c=tab&p=open`, `#c=both&p=ax5&s=keys`. Each frame prints its first Undo's measured box and its clearance above the bar.

Focus ids for the waiting page: `shelf3-folded` (Undo shelf, three tickets), `shelf1-folded` (Undo shelf, one ticket), `recent-tab-folded` (Recent tab). Each pose has its own id, such as `shelf3-open` and `recent-tab-ax5`.

## Choices

1. **Concept: Undo shelf** (`#c=shelf`, focus `shelf3-folded`). A strip on every tab, directly above the tab bar, holding the newest taps, each with its own Undo. It never opens, scrolls or moves. In SwiftUI it is the tab view's bottom accessory (`tabViewBottomAccessory`) with `tabBarMinimizeBehavior` left at never, since a minimized bar moves the accessory inline (SwiftUI doc). On the open Duo the system bar is hidden (`DuoSystemBar`), so the app draws the shelf as a pill under the left page, mirroring `DuoBar` under the right. Gain: undo of the last tap is one tap from any tab, with no step to reach it, and the person sees what they just did without looking for it. Loss: 72 pt (one ticket) or 116 pt (three tickets) of every tab at rest, on a 678 pt screen. Pick: this, with three tickets.
   Departs from: `recent-checks-can-be-undone`, Where the entrance sits (a Recent row above History in the Ledger tab, opening a panel) and its Rejected entrances ("A line or toast after each tap. It opens under the thumb, and it costs 40px at rest"). The shelf does not open, so nothing arrives under the thumb; the cost at rest stands. Not blocking. Owner grant: yes.

2. **Concept: Recent tab** (`#c=tab`, focus `recent-tab-folded`). Recent becomes a fifth tab: a page with a large title, not a panel. Rows newest first under day headings, one Undo cell each. A tap on the rest of a row shows its package, with the row's card marked, so the person ticks the card they meant. On the open Duo the list stays on the left page and the package shows on the right, the picked row carrying the 2 pt accent mark (`pickedMark` in `Theme.swift`). Gain: the whole 14-day log is one tap away, and the fix ("tick the right card") sits beside the undo. Loss: two taps for the newest undo; a fifth tab; the tab bar is for places, so Recent must read as a place (HIG tab bars: "navigation, not actions"). Pick: second to the shelf. The two combine well: the shelf for the last three, the tab for anything older.
   Departs from: the same entrance ruling, and `RootView`'s four tabs (`RootView.Tab`, the `duoSpine` items). The open-Duo spread needs `DuoSpread.spreads(tab:)` to take Recent. Not blocking. Owner grant: yes.

3. **Shelf depth** (`#d=3`, `#d=1`, focus `shelf3-folded` and `shelf1-folded`). Three tickets side by side, or one with its Undo at the trailing edge. Gain of three: "the last several" stay in view, and a mis-tap two taps ago is still one tap away; the Undo row sits 69 pt above the bar, with the text band as an inert buffer. Loss of three: 116 pt at rest; names cut at about 14 letters on the 375 pt phone. Gain of one: 72 pt at rest. Loss of one: only the newest; its Undo sits 21 pt above the bar. Pick: three. AX5 shows one either way.

4. **Which device did it.** Each ticket and row reads `This phone` or `Mac` after its time, in inkSoft for both. Gain: the brief's job asks for it, and a row from the other device explains a change the person did not make here. Loss: one more word per row. Pick: show it.
   Departs from: `recent-checks-can-be-undone`, What a row shows ("A row does not say which device wrote it"). The log entry holds no device field today, so the log rules would gain one. Not blocking. Owner grant: yes.

5. **Only Undo acts.** On the shelf, the ticket's text takes a tap and does nothing, so a near miss lands on nothing. On the Recent tab the row body opens its package, which changes no data. After an undo the cell turns to plain text (`Undone 14:35`), so a second tap does nothing. Hit boxes: three-ticket shelf Undo 97 (phone) to 127 (folded) by 44 pt, Recent Undo cell 75 by 71 pt (measured in the page). Gain: no tap but Undo changes data. Loss: on the shelf the name itself is not a way into the package. Pick: this.

6. **Nothing slides under a control.** The working list ends 8 pt above the shelf, and the shelf ends 12 pt above the bar; the Recent list ends 12 pt above the bar, with a hairline. No row scrolls beneath the glass. Gain: the debt `recent-undo-under-bar` cannot recur: no Undo is ever under a bar, in any frame (checked in every frame by the page). Loss: the list loses the system glass look where content shows through the bar. Pick: this.

7. **Nothing moves under the finger.** The shelf takes in new entries only at the person's own tap or a tab change. A write from the Mac waits (`#s=mac`: the card's count changes, the shelf does not). The Recent list reads the log on tab entry, as the decision freezes the panel at open; a reserved 44 pt line reads `Up to date` or `2 new since you opened` with Show, so a late entry never pushes a row. Gain: the Undo the person aims at cannot turn into another one as they tap. Loss: a Mac write is not on the shelf until the next tap here. Pick: this. Source: `no-layout-shift-under-pointer`; the decision's No layout shift section.

8. **When something opens.** A card opening (`#s=opened`), a tab change, or the Mac's write leave the shelf at the same y (the page measures it; the click-through check also compares it). With the keys up (`#s=keys`) the keys cover the bar and the shelf; neither rides up on the keys. Keys drawn from y 405 open (`duo-fold-and-keyboard`), 289 pt tall folded (the taller outer reading). Gain: the control is never somewhere new. Loss: no undo while typing. Pick: this. The keys already cover the bar on the 18 Pro (debt `composer-keys-cover-tab-bar`).

9. **The answer to an undo.** The pressed cell turns to `Undone hh:mm` in place, the card's line in the list takes an accent glow that fades in 1.2 s (paint only, none with Reduce Motion), and VoiceOver hears "Undone: checked Lightning Bolt, Alpha Cards". Gain: the HIG asks to show the result of an undo when its content may be out of view (undo-and-redo). Loss: one more motion. Pick: this.

10. **Words and symbol.** `Undo` with the u-turn arrow, the standard system undo symbol (HIG undo-and-redo: use the system symbols). Action labels and end states are the decision's: `Checked`, `Count 1 → 2`, `Package checked`, `Stamp · refunded`, `Un-checked`, `Assigned`; `Undone`, `Changed since`, `Nothing to undo`. Same-card taps in a row merge into one entry, as ruled: tick Brainstorm twice and its ticket reads `Nothing to undo`. The spoken name is "Undo checked Lightning Bolt, Alpha Cards", as the HIG's "Undo Typing".

11. **Biggest text (AX5).** The shelf shows one ticket, stacked: Undo on top, then the action on one cut line, then the card. The seller moves into the button's spoken name. A Recent row drops its fixed 72 pt height and leads with its Undo, so the newest Undo is in view without a scroll (`ViewThatFits` in the build). Gain: every Undo stays reachable at 53 pt body. Loss: the shelf takes 204 pt with its gap; a Recent row fills most of the screen, so about one row shows at a time. Pick: this.
    Departs from: `recent-checks-can-be-undone`, "Every row has the same fixed height", at accessibility sizes only. An undo still changes no row's height. Not blocking. Owner grant: yes.

12. **Empty and unknown.** With nothing logged (`#s=empty`) the shelf keeps its place and reads "Your next tick shows here, with its Undo."; the Recent tab gives one sentence and Go to Packages. A failed read (`#s=unknown`) says "Recent taps could not be read." with Try again, never an empty shelf (`ux-unknown-is-not-empty`).

13. **Fill.** Drawn opaque, card fill with a hairline, so no content shows through. The system accessory on the folded Duo and the phone draws Liquid Glass; with the list ending above it nothing sits behind it, so the glass reads as plain. Gain: one look in every pose. Loss: none found.

14. **The web client.** Not drawn; the brief's devices are native. Either concept closes `recent-undo-under-bar` on the web too: the shelf over the bottom bar, or Recent as a fifth bar item, with the list ending above the bar.

## Apple pages read 2026-11-21 (each answered 200)

layout (size classes), typography (Dynamic Type table, default and AX5), accessibility (44 x 44 pt default, 28 x 28 pt minimum control), buttons (44 x 44 pt hit region), tab-bars (navigation, not actions; floats above content; bottom accessory), toolbars, undo-and-redo (show the result; describe the action; standard symbols), and the SwiftUI page for `tabViewBottomAccessory(content:)` (the accessory moves inline when the tab bar minimizes). The layout page gave no device sizes.

## Checks

- Click-through check in headless Chrome, 19 cases, all pass: undo turns its ticket to Undone and unticks the card; a tick enters ticket 1; the shelf and the first Undo keep their y after an undo, a tick and a tab change; same-card taps merge; Recent re-reads on entry; a row opens its package with the line marked; the open Duo shows the picked row's package; the open list says "new since you opened" and Show adds the rows; no Undo under 44 pt; no Undo under a bar; no page error.
- `check_ios_mockup.py`: one fault, `system-font`, on the Cochin declaration. The app sets words in Cochin (`typography-cochin-and-mono`, `Font.cochin` in `Theme.swift`), and the house tokens allow a brand face in content. The chrome (status bar, tab bar, titles, buttons) is `-apple-system`. The check does not tell content from chrome, so this reads as a false alarm; `duo-hand-gaps.html` on main fails the same way today.
- `label_once.py` on the rendered folded page: "Counterspell", "Lightning Bolt" and "This phone" show twice. Each is data (a card in the list and on the shelf), not a label.

## Critique (impeccable critique, design review only, native platform)

Heuristics 31/40. Findings and fixes:

- Fixed: a toast at the top of the screen answered an undo far from the press (`ux-answer-at-press`). Now the cell answers in place and the card's line glows where it is.
- Fixed: at AX5 the newest Recent row's Undo fell below the list edge. Undo now leads the row.
- Fixed: `Mac` was set in manilaInk, a colour checked only on manila (`palette-inksoft-and-manilaink`). Both device words are inkSoft.
- Fixed: the frames were built by script, so the mockup check found no Duo frame. The frames are now static.
- Open: the one-ticket shelf's Undo sits 21 pt above the bar. A low tap there hits the tab bar, which only changes the tab.
- Open: the three-ticket shelf costs 116 pt of every tab. The owner weighs it against one tap.

## Input needed

- Items 1, 2, 4 and 11 carry `Owner grant: yes`.
- The large phone's size: none is written. Drawn at 375 x 812 pt from the web screens check.
- Is the shelf allowed beside the ruled Ledger-tab entrance, or does it replace it? The mockup assumes it replaces it.
- Critique questions: Should the shelf hold this device's taps only, so the Mac never fills it? Should the Recent tab and the shelf ship together, the shelf for the last three and the tab for the rest?
