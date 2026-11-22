# Year close, blind designer 2: notes

Designer kind: blind. Mockup: `year-close-blind-2.html`. All figures on it are samples.

Job, from the brief: put fully received orders away at the end of the year so they stop
cluttering daily work, and keep a permanent record for taxes and disputes. Facts used: orders
fully received, orders still open, a year, and the total spent per year.

Deep links (open the file, then add the hash): `#c=shelf` or `#c=fold`; states
`&s=ready|done|record|nomatch|empty|closefail|loading|failed`; theme `&t=light|dark`; labels off
`&l=0`. Focus ids: `shelf-close` (Shelf) and `fold-close` (Fold), both in the folded frame.

## Choices

1. **Shelf option.** Two tabs, Orders and Records. A card at the top of Orders offers "Put away
   214 orders"; a sheet reviews it; Records lists each year with its total spent.
   Gain: a familiar split between work and archive; the archive is a place you can name.
   Loss: a second place to look; a tab bar for only two sections. Pick: keep as the safe option.
2. **Fold option (the bold one).** No tabs and no archive screen. One page runs in time order:
   past years sit at the top as folded slips, the current year below, open orders last. Closing
   the year folds its received orders into a slip. The slip's paper edge grows with its order
   count. A slip unfolds in place to show every order. On the open Duo, the left page holds the
   slips and the right page holds the unfolded year.
   Gain: one place for everything; "put away" is seen, not described; the two Duo pages map to
   folded and unfolded. Loss: the page grows by one slip a year; no common app works this way,
   so people learn it once. It drops the house bottom tab bar on a phone. Owner grant: yes.
   Pick: my pick, since it answers "put it away, never lose it" in one picture.
3. **Name of the act.** Shelf says "Put away", from the person's own words. Fold says "Fold",
   which is the option's picture. Gain: each verb matches what the screen shows. Loss: none
   between options, as only one ships. Pick: as drawn.
4. **Confirm step.** Shelf uses a sheet (Cancel leading, main button at the bottom, in thumb
   reach). Fold uses a second tap in place: "Fold 214 orders" and "Keep them out".
   Gain: Shelf shows the full review; Fold keeps the answer where the press was. Loss: Shelf
   covers the list; Fold shows less detail before the act. Pick: as drawn per option.
5. **Undo.** After closing, the result line holds an Undo button until the next change.
   Gain: a wrong press costs nothing. Loss: none seen. Pick: keep.
6. **File copy.** Each year has "Save a copy": a spreadsheet for taxes or a printable list for
   disputes. Shelf also offers "Save a file copy" in the close review, on by default.
   Gain: a record outside the app, which is the real "never lose it". Loss: one more control.
   The line "Saved to Files" must be true when built. Pick: keep.
7. **Which year an order belongs to.** The year it was placed. Spent per year counts every order
   placed that year, open ones too, and the record says how many are still open. An open order
   stays in the open list after the close. Once it arrives it can join its year; that late
   step is not drawn. Owner grant: yes (a data rule).
8. **Records never change.** A year record is read-only: search, open an order, save a copy.
   The copy says "Nothing is deleted". The builder must make that true. Owner grant: yes.
9. **Order detail.** Seller, order number, placed, received, items, paid, and "Copy details"
   for a dispute or claim. Shelf pushes it; Fold shows it in a sheet. Pick: keep.
10. **Search in a year.** By seller or order number. A search that finds nothing keeps the
    field and offers "Clear search" (house rule ux-unknown-is-not-empty). Pick: keep.
11. **States.** Loading keeps the loaded layout's space. Read failed says nothing was changed
    or lost, offers Try again, and hides the device text in a closed disclosure. Close failed
    says nothing moved, with Try again at the same place. Empty says why there is nothing to put
    away, with a control that shows the open orders.
12. **Open Duo pose.** Each pose is its own layout. Shelf: the list on the left, the review or
    the year record on the right. Fold: slips on the left, the year on the right. A sheet covers
    only the page it belongs to; nothing crosses the hinge (checked in a headless browser).
13. **Largest text (AX5).** Rows stack: the amount goes under the name, chevrons hide, figures
    stack, names wrap.
14. **Haptics.** The file-copy switch and the fold or put-away confirm should each give a
    haptic (house rule ux-haptics-feel-substantial). Not drawable here.
15. **Tab bar shape.** Shelf's tab bar is a floating capsule, as iOS draws it, not the 8 px
    house radius. Gain: native look. Loss: one radius outside the token. Owner grant: yes.
16. **Colour.** My own values, by role: surface, raised, text, accent (blue, for acts), open
    (amber, for orders still in the mail), fold (grey-blue paper). Light and dark sets. Open
    orders are marked by an amber bar, not a repeated word.

17. **See what gets folded.** Fold shows the newest received order and a line for the rest.
    The line opens the full list before the fold. Gain: the person checks before acting.
    Loss: one more press for that check. Pick: keep.
18. **Confirm in thumb reach.** Shelf's review sheet pins its main button to the bottom.

## Critique pass (impeccable critique, design review only)

Fixed: striped paper edge read as decoration (detector advisory), now one drawn leaf per 40
orders; Fold hid what it would fold; Shelf's confirm sat mid-screen; an opened slip repeated its
own totals; open-pose slips pointed down instead of across.
Not fixed: the Fold page grows by one slip a year (item 2); the late put-away of an order that
arrives after the close is not drawn (item 7).
Questions: should the close run by itself at year end? Should the file copy be required? Does
an order belong to the year it was placed or the year it arrived, for taxes?

## Sizes and sources

- Duo folded 466 x 678 pt and open 951 x 669 pt with the hinge gap from x 455.5 to 495.5: from
  the brief. `layout.py devices` printed `unknown` for this repo.
- Large phone 402 x 874 pt: **assumed**. No brief line, device list or page I read gives a size.
- Drawn status bar and home indicator insets (28 and 20 pt on the Duo, 54 and 34 pt on the
  phone): my own values, no written source. The CSS still reads `env(safe-area-inset-*)` first.
- Labels: every marked part says "New:". A blind designer cannot see today's screen, so nothing
  is labelled "Today:".

Apple pages read 2026-11-21 (each answered 200, through the `tutorials/data` JSON):
Layout (safe areas); Typography (Dynamic Type sizes at Large and AX5, used for every type
size); Accessibility (44 x 44 pt default control, 4.5:1 contrast up to 17 pt, text to 200
percent); Buttons (44 x 44 pt hit region); Sheets (Cancel on the leading edge); Lists and
tables; Tab bars (navigation only, floats at the bottom); Toolbars (large title).
