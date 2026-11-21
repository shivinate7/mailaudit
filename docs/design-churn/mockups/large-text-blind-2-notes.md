# Large text: notes on three concepts

Designer kind: blind. Designer: large-text-blind-2. Mockup: `large-text-blind-2.html`.

I saw no current screen, spec, tokens or other mockup. Each choice below starts from the job in
the brief: at very large text, or on a narrow screen, the person must always see how many cards
arrived out of how many, how much money is still owed, and the primary button. So I cite no file
or symbol of today's app, and I label nothing "Today:". Every dashed label in the mockup reads
"New:". Every figure is sample data.

## Deep links

Each control writes the URL hash. Keys: `c` concept (`ledger`, `queue`, `sentence`), `d` device
(`folded`, `open`, `phone`), `ts` text size (`large`, `xxxl`, `ax3`, `ax5`), `t` theme (`auto`,
`light`, `dark`), `s` state (`loaded`, `editing`, `saved`, `done`, `empty`, `loading`, `failed`),
`h` hidden concepts, `l=0` hides the "New:" labels.

- `#c=ledger&d=folded&ts=ax5&s=editing`
- `#c=queue&d=folded&ts=ax5&s=editing`
- `#c=sentence&d=folded&ts=ax5&s=editing`
- `#c=ledger&d=open&ts=large&s=editing`
- `#c=queue&d=open&ts=xxxl&s=editing&t=dark`
- `#c=sentence&d=open&ts=large&s=saved`
- `#c=ledger&d=phone&ts=ax3&s=failed&t=dark`

Focus ids for a pick by looking: `pick-ledger`, `pick-queue`, `pick-sentence` (each concept's
first screen, left page when open).

## Devices and sizes

- Duo folded: 466 x 678 pt, from the brief. Drawn first.
- Duo open: 951 x 669 pt, from the brief. Two pages of 455.5 pt with the 40 pt hinge gap at
  x 455.5 to 495.5. Nothing sits across it; each open pose is its own layout, not the folded one made wider.
- Large phone: no size is written. `layout.py devices` printed `unknown` for this repo, the brief
  gives none, and the HIG layout page I fetched holds no device table. So the frame starts at the
  folded Duo size and its corner drags (252 to 760 pt wide) to test narrow and tall phones. The
  readout under it prints the current size.
- Safe-area insets: the frames use `env(safe-area-inset-*)`. No page I read gives a Duo inset, so
  the drawn status-bar band (40 pt) and home-indicator band (20 pt) are my placeholders.

## Apple pages read (2026-11-21, each answered 200)

- Typography (`tutorials/data/design/human-interface-guidelines/typography.json`): the iOS Dynamic
  Type tables. All type sizes in the mockup come from the Large (default), xxxLarge, AX3 and AX5
  tables there, for example Body 17/22 at default and 53/62 at AX5, Large Title 60/70 at AX5.
- Accessibility: 44 x 44 pt default control size, 4.5:1 contrast up to 17 pt, text larger to at least 200 percent.
- Buttons: hit region at least 44 x 44 pt.
- Sheets: Cancel on the leading edge of the top bar, Done on the trailing edge.
- Layout, toolbars, tab bars, lists and tables: read; layout gave the safe-area rule and no device sizes.

## Choices

1. **Three concepts, each with its own structure, movement and first screen.** Gain: the owner
   picks a structure, not a skin. Loss: three times the review. Pick: show all three; each has a
   Hide control in the mockup, so one press removes one.

2. **Pinned ledger.** A fixed strip holds the count, the money and a meter; the list scrolls under
   it; Save is full width at the bottom; Cancel leads the top bar. Gain: the most familiar shape,
   and the three facts never scroll away. Loss: at AX5 on the folded Duo, the fixed parts take
   about 60% of the height, so the list shows about one card at a time. Pick: keep as the safe option.

3. **One at a time.** One card fills the screen at Title 1. Came in adds one copy, and when the
   card is complete it moves to the next card still out and says so. Back and Next walk the cards;
   "Card 2 of 8 still out. See all." opens a sheet to jump. Save and Cancel sit in the top bar.
   Open: the card on the left page, the list of cards still out on the right. Gain: a card name
   never shares a line with anything, so it never truncates; the largest button is the one used
   most. Loss: Save is at the top, out of one-thumb reach; no overview on the folded Duo without the sheet.
   Pick: keep; best for a big parcel opened card by card.

4. **Sentence dock (the bold one).** No columns. The list is sentences ("Thalia, Guardian of
   Thraben: 2 of 4 here."), which wrap at any size. The count, the money and Save join in one dock
   at the bottom. With nothing to save, the dock is plain text. With marks to save, the whole dock
   becomes the button: the biggest target on screen, at thumb height. Words move you around: "Show
   all 12." and "Show only the 8 still out." Open: sentences on the left; the right page says where
   the money still owed sits, above the dock. Gain: no layout to break at any size; the button is
   impossible to miss. Loss: a large target is easy to press by mistake (see 9); the dock is three
   or four lines tall at AX5, so the first screen at AX5 shows the intro and no card. Pick: keep
   for the owner to judge. Owner grant: yes (a structure no common app uses).

5. **Marks are a draft until Save; Cancel drops them.** A tap adds one unsaved mark, shown as
   "+1"; Save commits; Cancel clears. This gives the brief's primary and Cancel buttons one meaning
   across all three concepts. The count and the money include unsaved marks. Gain: a slip costs
   nothing until Save. Loss: one more press per check-in; if today's app saves each tap at once,
   this departs from it. Departs from: unknown to a blind designer. The owner or an informed
   designer checks. Pick: draft. Owner grant: yes.

6. **No word breaks inside a word.** `word-break: normal`, `hyphens: manual`, and
   `overflow-wrap: break-word`, which breaks a word only when the word alone is wider than the
   line. Numbers sit in no-wrap groups, so "1,188 of 1,204" breaks only before "of". Gain: no
   "Thra-ben"; no clipped figure. Loss: a word wider than the screen would still break; no card
   word does at 466 pt and AX5. Pick: as drawn.

7. **Nothing sits under the bottom bar.** Each screen is a column: top bar, facts, a scroll area,
   dock. The dock is in the flow, not over the list, so the last row always scrolls clear of it.
   Gain: no row or button hidden under a bar. Loss: none seen. Pick: as drawn. No tab bar is
   drawn: the brief names one screen. A tab bar would add a fourth fixed band at AX5.

8. **Rows switch shape at large sizes.** From xxxLarge up, a ledger row puts its count under its
   name (a CSS stand-in for SwiftUI `ViewThatFits`). Gain: no name is cut to fit a column. Loss:
   rows get taller. Pick: as drawn.

9. **Undo where the press was.** Each row with marks shows a "−" (ledger), "Take one back"
   (one at a time) or "+1 ✕" chip (sentence) that takes one back. Its box is kept even when empty,
   so a tap never moves the row under the finger. After a save, the sentence dock shows
   "Saved 3 cards. Undo." because its large target invites a slip. Gain: every slip has a one-tap
   way back. Loss: an empty gutter on rows with no marks. Pick: as drawn.

10. **A disabled button says why, in its own label.** With nothing marked, the Save slot reads
    "Tap each card that came in." in a dashed box; after Save it reads "Saved 3 cards."; after
    Cancel, Cancel reads "Cancelled". Gain: no separate reason line, which at AX5 cost two lines.
    Loss: the slot holds text that is not a press. Pick: as drawn.

11. **At AX sizes the count drops its label.** The ledger strip and the one-at-a-time line show
    "1,188 of 1,204" with no "cards here"; the meter under it (ledger) and the screen's job carry
    the meaning, and a screen reader still hears the label. Gain: one more list line at AX5. Loss:
    a first-time reader may ask "of what". Pick: as drawn.

12. **States.** Loading says "Counting cards…" in the facts and keeps the Save slot. Failed says
    "Count unknown" and "Money owed unknown", never 0, with "Try again" in the primary slot and the
    cause in a closed "What went wrong". Empty says "Import an order export to fill this list."
    with "Import orders" in the primary slot. All here says "All is well." Gain: unknown never
    reads as empty or done. Pick: as drawn.

13. **Colour.** A ledger green for actions, an amber-brown for money owed, on cool grey-green
    paper; a dark set of each. My own values: tokens.md gives roles, not colours. Text and
    button pairs are above 4.5:1 by my reading; not measured with a tool. Pick: as drawn.

14. **Haptics.** A light haptic on each mark and on Came in, a success haptic on Save (house rule
    ux-haptics-feel-substantial). Not drawable in HTML. Pick: as stated.

15. **Marks survive leaving.** Unsaved marks are input no server can return, so they stay as a
    draft when the person leaves and comes back (house rule ux-keep-what-was-made). Not drawn.
