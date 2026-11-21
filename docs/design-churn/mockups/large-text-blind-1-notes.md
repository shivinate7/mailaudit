# Large text check-in: notes (large-text-blind-1)

Designer kind: blind. I read no current screen, spec, token file or other mockup. Colours, type and spacing come from `~/.claude/docs/design/tokens.md` (4 px step, 8 px radius, colour by role, system font) and my own choices where it gives no value. Every figure, card and seller in the mockup is a sample.

Mockup: `docs/design/large-text-blind-1.html`. Deep links: `#c=dock`, `#c=tabs`, `#c=ask`; states `#s=picking`, `#s=empty`, `#s=error`, `#s=done`, `#s=max` (biggest figures); `#t=dark`, `#t=light`; text size `#z=xxxl`, `#z=ax3`, `#z=ax5`; `#a=off` hides the dashed labels; `#hide=tabs,ask` hides concepts. Keys combine, such as `#c=ask&s=max&z=ax5&t=dark`. Focus ids for the owner's pick: `focus-dock`, `focus-tabs`, `focus-ask` (each concept's folded AX5 frame).

Each concept draws four frames: Duo folded at the chosen text size, Duo folded at AX5, Duo open, large phone. Every frame of a concept shares one state, so a tap in one shows in all.

## Choices

1. **Thumb dock (concept).** One list grouped by seller. The arrived count, the money still owed and the main button share one band at the bottom. Cancel and Undo sit at the leading edge of the title bar. Open: sellers on the first screen with the facts under them, the seller's cards on the second with the button.
   Gain: the most familiar shape; one place to look for all three facts; the button sits where the thumb is.
   Loss: at AX5 folded the band takes about half the screen, so the list shows one to two rows at a time.
   Pick: keep as the safe option.

2. **Fact tabs (concept).** The two facts are the tabs: tap the money to see cards still coming, tap the count to see cards that arrived. The button bar sits at the bottom with Cancel beside the button; at accessibility sizes Cancel moves to the title bar. At accessibility sizes the tab not chosen shows its figure only.
   Gain: the facts are also the way around, so they cannot be pushed off; "where am I" is the chosen tab.
   Loss: the most crowded at AX5 folded (about one row of list while picking); the open pose leaves space under the tabs on the first screen.
   Pick: keep only if the arrived view is wanted as its own place.

3. **One card at a time (concept, the bold one).** The first screen holds the facts and one button, "Start with <seller>". Then each screen asks about one card: "All 4 came", "Some" (a stepper), "None". The list is a sheet behind "All cards" when folded and the whole second screen when open; tapping a row jumps to that card.
   Gain: nothing competes with the text, so AX5 needs no compromise: one name, one question, three big answers under the thumb. The open pose uses the hinge well: question on one screen, list on the other.
   Loss: slower for a person who wants to tick many rows at once; at accessibility sizes the question screen drops the words "arrived" and "still owed" (item 12).
   Pick: my recommendation for the large-text job.

4. **Act name "Check in N".** The main button reads "Check in 7", and "Move 2 back" in the arrived view. A longer form such as "Mark 7 received" wrapped to two lines at AX5 and cost the list a row.
   Gain: one line at every size, with the same name everywhere.
   Loss: a new word, if the app names this act another way today.
   Pick: "Check in". Owner grant: yes.

5. **The button with nothing picked says what to do.** It shows "Tap the cards that came" (AX: "Pick the cards") and is off. It turns into "Check in N" at the first pick.
   Gain: the reason for the off state is the label; the button keeps its place.
   Loss: two labels for one off state, by size.
   Pick: keep.

6. **Figures change style at accessibility sizes.** Facts use Title 2 at the standard sizes and Headline at AX1 to AX5; the count reads "1,284 of 2,031" at standard sizes and "1,284/2,031" at accessibility sizes. Each figure never breaks; it wraps only between its parts.
   Gain: "1,284/2,031" fits one line at AX5 on the 466 pt screen, up to "9,957/9,999".
   Loss: the slash form is terser.
   Pick: keep.

7. **Names wrap at spaces.** A card name wraps at spaces only. A single word wider than the line breaks at a syllable with a hyphen (`hyphens: auto`), never mid-letter.
   Gain: ends the mid-word breaks people named.
   Loss: a very long one-word name still breaks once, with a hyphen.
   Pick: keep.

8. **Rows grow, never clip.** The count and its mark move to their own line under the name when they do not fit beside it. Rows keep at least 44 pt.
   Gain: no cut-off count at any size.
   Loss: fewer rows per screen at large sizes.
   Pick: keep.

9. **Cancel placement.** Thumb dock and One card at a time: title bar, leading edge (Apple, Sheets). Fact tabs: beside the button at standard sizes, in the title bar at accessibility sizes. In Fact tabs, Cancel shows as off when nothing is picked, so the button never moves under the finger.
   Gain: two placements to compare.
   Loss: Fact tabs moves Cancel between sizes.
   Pick: title bar.

10. **Undo.** In Thumb dock and Fact tabs, Undo takes the Cancel slot after a check-in. In One card at a time, the person jumps back through the list and taps "Unmark".
    Gain: a check-in is one tap to undo where lists are used.
    Loss: no one-tap undo in One card at a time.
    Pick: keep; add Undo to One card at a time if that concept wins.

11. **Failed read and empty.** A failed read shows "Unknown" once, never zero, with "Try again" and a closed "What the device said". Fact tabs gives way to that one line, since there is nothing to switch between. An empty history shows one sentence and "Import orders". All arrived shows "Everything has arrived."
    Pick: keep.

12. **One card at a time, accessibility sizes.** On the question screen the facts show figures without the words "arrived" and "still owed" (screen readers still hear them), and the seller moves from the title bar to the line under the question, so the card name stays in view at AX5.
    Gain: the card name and all three answers fit the folded screen at AX5.
    Loss: the person must learn the figures on the first screen, where the words show.
    Pick: keep.

13. **"Money still owed" means the price of the cards not yet arrived.** The brief's words could also mean money a seller owes back.
    Pick: price of cards not yet arrived, labelled "still owed". Owner grant: yes (meaning of the figure).

14. **Sizes.** Duo folded 466 x 678 pt and open 951 x 669 pt with the hinge gap 455.5 to 495.5 come from the brief; nothing sits across the gap. `layout.py devices` printed `unknown` for this repo, and no Apple page I read gave a phone size (the Layout page's specification table did not load in its data), so the large phone is drawn at 440 x 956 pt, a size I chose. Safe-area insets are drawing values (Duo 24 pt top and 20 pt bottom, phone 60 and 32), read through `env(safe-area-inset-*)` first.
    Owner grant: yes (the phone size to draw at).

## Apple pages read, 2026-11-21

Each answered 200, through `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`.

- Typography: the Dynamic Type tables for Large (default), xxxLarge, AX3 and AX5. Body is 17 pt at default and 53 pt at AX5; every size in the mockup comes from these tables.
- Accessibility and Buttons: hit regions of at least 44 x 44 pt; text should grow to at least 200 percent.
- Layout: respect safe areas; at larger text, stack views that sat side by side, and let rows grow instead of cropping text.
- Sheets: Cancel on the leading edge of the top toolbar, Done on the trailing edge.
- Toolbars: a large title turns into a standard title when people scroll (drawn in Thumb dock and on the first screen of One card at a time).
- Tab bars and Lists and tables: read; no tab bar is drawn, because each concept has one screen and the tabs in Fact tabs switch views of one list.
