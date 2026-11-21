# Large text: notes for large-text-informed-1

Designer kind: informed. Mockup: `docs/design/large-text-informed-1.html`. Sample figures only.

**The pain.** At accessibility text sizes, and at xxxLarge on a narrow screen, the three facts break.
The running head reads "MANIF… 1,2…" and loses the money (`RunningHead` in
`native/Manifest/MastheadScreen.swift`, debt `native-masthead-axl-clips`). The count line clips with no
ellipsis at four digits (`MastheadView.countLine`, debt `native-count-line-clips`). The missing line wraps
over three lines beside the 13-character save slot (`MastheadView.tallies`, `SaveSlot`). Set names and the
envelope header break mid-word, and the armed Reset shows "C…" (debt `native-axl-rows-break`). At AX L the
Card in Hand control sits under the Duo bar (debt `hand-open-under-bar-at-l`). The user's words: "I can't
tell where I am, and I can't hit the button."

**What is drawn.** Today beside two concepts, Stacked letterhead and Facts dock. Each shows the Ledger,
Orphaned, Tally and Packages tabs at Large, xxxLarge, AX1, AX3 and AX5, on the Duo folded, the Duo open
and a large phone. States: at rest, scrolled with the head pinned, armed ask, Card in Hand open, held
(large content viewer), and all received. Taps work: a row checks one copy in and runs the save slot,
Reset and Discard arm for 4 s with Cancel, a hold on the running head or the dock opens the viewer.

## Items

1. **Text sizes follow Apple's table.** Each element scales from its native size and `relativeTo:` style
   (`Font.cochin`, `Font.mono` in `native/Manifest/Theme.swift`) by the ratio in Apple's Dynamic Type
   table. Gain: the AX5 drawing matches what SwiftUI does. Loss: Cochin's own line height is not Apple's
   leading, so row heights are near, not exact. Pick: as drawn. Owner grant: no.

2. **Stacked letterhead: tallies become ruled rows at accessibility sizes.** Today they stack as centred
   label-over-figure blocks (`MastheadView.tallies`, `stacked`). The concept sets label left, figure right,
   and lets the figure drop under the label, breaking only between "$3,104.20" and "/$4,388.80". Gain:
   about a third less height, and no figure is scaled or cut. Loss: the letterhead is no longer centred at
   AX sizes. Pick: yes. Owner grant: no (keeps `masthead-is-one-letterhead`: one block, ruled).

3. **Stacked letterhead: the missing line moves up under the cards row at accessibility sizes.** Apple's
   typography page: "keep primary elements toward the top of a view even when the font size is very
   large". Today the missing line is the last row of the foot (`masthead-save-slot-reserved`, native: "the
   missing line and the slot share row 2"). Gain: at AX5 on the folded Duo both facts show on the first
   screen with no scroll. Loss: the foot order differs between default and AX sizes. The save slot keeps
   its own row, still reserved at 13 characters. Pick: yes. Departs from: `MastheadView.tallies` foot
   order. Owner grant: yes (it changes the native foot that `masthead-save-slot-reserved` describes).

4. **The count line wraps only at " · " and reserves the height of the longest tab's line.** All four
   tabs' lines sit in one cell, so a tab change cannot change the height (`no-layout-shift-under-pointer`).
   Below AX it stays one line when it fits. Gain: closes `native-count-line-clips` without the 0.75 scale
   the spec asked for. Loss: at xxxLarge and up on a narrow screen the foot can be one line taller on the
   shorter tabs. Pick: wrap and reserve. Owner grant: no.

5. **Stacked letterhead: the running head keeps 46 pt.** Its text is capped at xxxLarge, as the Duo bar
   caps its titles (`DuoBar`, `accessibilityShowsLargeContentViewer`), and when the title word and the
   figure do not both fit, the title word goes and the seal stays (SwiftUI `ViewThatFits`). A hold shows
   the full figure in the large content viewer. At accessibility sizes it pins once the missing row has
   scrolled under it, not at the letterhead's end, so no stretch of scroll shows neither the row nor the
   head (Departs from: `MastheadScreen.body`, `pinAt = headHeight`). Gain: "1,204/1,530 · $1,284.60" is always whole, and
   `masthead-running-head-sticky` (height never changes) holds. Loss: at AX sizes the pinned figure is
   smaller than the text the person chose; the hold is not discoverable. Pick: yes. Owner grant: yes (caps
   Dynamic Type on a content element, where `typography-cochin-and-mono` says Dynamic Type scales the text).

6. **Facts dock (bold concept).** The cards figure and the money still out leave the letterhead for a
   manila dock that is always mounted 8 pt above the tab bar (on the open Duo, at the foot of the left
   page, where no bar sits). A 6 pt progress strip runs on its top edge (accent, green at 100 %,
   `progress-bar-accent-then-green`). The tab's main button sits in the dock: New envelope on Orphaned,
   Card in Hand on the open Duo's Packages. The dock text caps at AX1, with the viewer on a hold. The
   letterhead keeps the seal, title, house line, packages and value, the count line and the save slot.
   Gain: the three facts are in reach of the thumb on every tab, at every size, at rest and scrolled, and
   nothing pins or unpins, so nothing moves (`motion-nothing-may-reflow`). Loss: the dock takes about
   90 pt at AX5, about 145 pt with a button, of a 678 pt screen (read from the mockup render); the running head and the letterhead's bar retire;
   the dock's height differs between tabs with and without a button. Pick: offered for the owner to cull.
   Departs from: `MastheadScreen` (running head overlay), `MastheadView` (cards cell, bar, missing line).
   Owner grant: yes (retires `masthead-running-head-sticky` and changes `masthead-is-one-letterhead`).

7. **Tally rows stack at accessibility sizes.** Name first, wrapping at word gaps only; then count, basis
   and amount out as a wrapping row; then the meta line with the counts kept whole and the set names cut
   with an ellipsis. Today the right column keeps its width and squeezes the name to about 100 pt
   (`TallyView.TallyRowView`). Gain: no mid-word break, and `card-tally-row-counts-first` holds (counts
   never cut, sets degrade first). The amount out keeps its line when done, hidden. Loss: taller rows. A
   single word longer than the line would still break, as a last resort. Pick: yes. Owner grant: no.

8. **The armed Reset stacks at accessibility sizes.** Reset keeps its row; the ask wraps inside the red
   fill; Cancel takes a full-width row below that is laid out, empty, all along, so arming moves nothing.
   Today Cancel is a fixed 80 pt cell with one line (`AskRow` in `native/Manifest/LedgerTab.swift`). Gain:
   "Tap again to clear 1,537 cards" and "Cancel" are whole, and `armed-reset-takes-the-row` holds (Cancel
   after Reset, Reset does not move). Loss: an empty 44 pt or taller row under Reset at rest. Pick: yes.
   Owner grant: no.

9. **The envelope header breaks at the dots, and Discard drops to its own row.** Cancel's reserved row
   sits right under Discard at accessibility sizes (`ux-answer-at-press`), not after the card lines.
   Today both share one line and break mid-word (`EnvelopeCard` in `native/Manifest/OrphanedView.swift`).
   Gain: "Envelope · 2026-11-02 · 3 cards" reads whole. Loss: an empty reserved row in the open envelope
   at rest. Pick: yes. Owner grant: no.

10. **Card in Hand opener on the open Duo.** Stacked letterhead pins it at the top of the right page, out
    of the scroll, as the debt `hand-open-under-bar-at-l` proposes. Facts dock puts it in the dock.
    Today it follows the masthead in flow (`PackagesView.openHand`). Gain: no text size can push it under
    the bar. Loss: a 61 pt strip at the top of the right page. Pick: pinned strip in Stacked letterhead.
    Owner grant: no (the debt names the fix).

11. **Two pages for Packages and Ledger on the open Duo.** The concepts draw the letterhead and list on
    the left page and the work (Card in Hand, Ledger groups and Reset) on the right. Today
    `DuoSpread.spreads(tab:)` returns false for both. Gain: the facts and the main button sit on
    different pages, so neither pushes the other. Loss: a layout change beyond this lane's debts.
    Departs from: `DuoSpread.spreads(tab:)` in `native/ManifestKit/Sources/ManifestKit/DuoSpread.swift`.
    Owner grant: yes.

## Sizes, devices and reads

- Duo folded 466 x 678 pt and open 951 x 669 pt with the hinge at x 455.5 to 495.5 are the brief's
  sizes; `layout.py devices` printed `unknown` for this repo.
- The large phone has no written size. It is drawn 430 pt wide (a width in `masthead-save-slot-reserved`)
  and 678 pt tall (the folded Duo's height). Its true size is unknown.
- The status bar foot is drawn at 20 pt, as `duo-hand-post-sender` draws it; unmeasured.
- The tab bar pill is 64 pt, 12 pt up, 24 pt in (`DuoBarMetrics`, `DuoBar`); the folded and phone bars
  are drawn the same with system-font titles, which is unmeasured.
- One theme: the native app is held to light (`design-parchment-ledger`).
- Apple pages read 2026-11-21, each answered 200: typography (Dynamic Type sizes for Large to AX5; "Keep
  text truncation to a minimum"; "consider using a stacked layout"; "keep primary elements toward the
  top"), accessibility (44 x 44 pt default control, 200 percent text), buttons (44 x 44 pt hit region;
  Large button 52 pt), layout (safe areas), tab-bars (labels, minimized bar).
- `check_ios_mockup.py` reports one fault, `system-font`: the content is set in Cochin, which
  `typography-cochin-and-mono` rules, and the check reads any non-system first family as a fault. The
  chrome uses `-apple-system`. The fault is a likely false alarm against a ruled content font.

## Deep links

- `#d=folded&ts=AX5&tab=tally&s=rest` (the largest size, folded)
- `#d=folded&ts=AX5&tab=ledger&s=armed` (the armed Reset)
- `#d=folded&ts=AX5&tab=orphaned&s=armed` (the armed Discard)
- `#d=folded&ts=xxxL&tab=packages&s=scrolled` (pinned head)
- `#d=open&ts=AX3&tab=packages&s=rest` (Card in Hand opener)
- `#d=phone&ts=xxxL&tab=packages&s=viewer` (large content viewer)
- `#d=all&ts=AX5&tab=orphaned&s=armed` (all poses)

Focus for a pick: `#stacked-facts` (the Stacked letterhead running head, shown when scrolled) and
`#dock-facts` (the dock).
