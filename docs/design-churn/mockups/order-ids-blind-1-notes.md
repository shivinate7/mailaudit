# Order numbers, blind designer 1: notes

Designer kind: blind. Mockup: `order-ids-blind-1.html` in this folder. The brief gave the job only:
quote an order number, copy it in one tap, open the seller page of that one order. I saw no current
screen, spec, token file or other mockup. Every figure on the page is sample data.

Deep links (append to the file URL):

- `#s=loaded&t=light`, `#s=loaded&t=dark`, `#t=system`
- States: `#s=copied`, `#s=nolink`, `#s=loading`, `#s=empty`, `#s=failed`
- One device: `&d=folded`, `&d=open`, `&d=phone`, `&d=ax5`
- Hide a way: `&hide=list`, `&hide=message`, `&hide=deck` (comma list). Hide labels: `&labels=off`

Focus ids for the waiting page: `concept-list`, `concept-message`, `concept-deck`.

## Choices

1. **Three ways, each with its own structure.** Number list (list to detail, tab bar), Message
   first (composer as the first screen, order list in a sheet), Number deck (one order per screen,
   no list). Gain: the owner sees three roots, not three skins. Loss: more to cull. Pick: show all
   three. Each has a Hide control on the page.

2. **Number list: the whole number on every row, with its own copy button.** Gain: one tap copies
   with no screen change; the full number is readable without opening the order. Loss: rows are
   two lines tall, so fewer fit. Pick: yes. The row tap opens the detail with "Open order page".

3. **Number list: a Recent tab, with a clock icon.** Lists numbers copied this session, newest
   first, each copyable again. It is not named "Copied" and has no copy icon, so the copy answer
   and the copy icon keep one meaning (ux-one-plain-name). Gain: a second message to the same seller needs no hunt. Loss: one more section to keep.
   Pick: keep, but it is the first thing to cut if the owner wants one screen. Owner grant: yes
   (adds a section).

4. **Message first: the message is the first screen.** The person's words were "I need to paste
   the order number into a message". The app writes the message with the number in it; three
   reasons (Not arrived, Card missing, Wrong card) change the text. "Copy number" gives the
   number alone, so no "Number only" reason. The message box takes the free height. Gain: the paste
   target is ready, not just the number. Loss: a new kind of screen, with templates to keep up.
   Pick: show it. Owner grant: yes (a new screen and new copy).

5. **Message first: edits are kept per order and reason.** "Start the message again" brings back
   the template. Gain: typed text survives a switch of reason or order (house rule
   ux-keep-what-was-made). Loss: a draft store to build. Pick: yes. In the mockup the drafts live
   in the frame only.

6. **Message first: a warning line under the box while "[card name]" is still in the text.**
   Gain: a template blank never reaches the seller unnoticed. Loss: one reserved line of space.
   Pick: yes. Added after the critique.

7. **Number deck (the bold way): the number fills the screen, one dash group per line, and the
   number itself is the copy button.** Swipe or use the arrows to move; "Find" filters by any part
   of the number or the seller name, such as the tail printed on a packing slip. Gain: the number
   is legible at arm's length and a copy is the biggest target on screen. Loss: no overview; seven
   orders need seven swipes without Find. Pick: show it as the bold way.

8. **Number deck, open pose: the number on the left page, that order's own page live on the right.**
   Gain: the person sees that the link lands on the exact order before they write. Loss: a web view
   loads for every swipe. Pick: show it. Owner grant: yes (an embedded web view).

9. **When an order has no page link.** The open button is replaced by one sentence and "Copy and
   open all orders", which copies the number first and opens the list of all orders with a line
   that says to paste it into the search. Gain: no dead end (house rule ux-no-dead-end), and the
   fallback is honest about landing on the list. Loss: a second link to know per seller. Pick: yes.
   Whether such a list URL exists is unknown to me.

10. **Copy answers at the press and moves nothing.** The button keeps the box of its wider label
    ("Copy order number" and "Copied" share one grid cell); the icon button turns to a check.
    The answer clears after about 2.6 s. Gain: house rules ux-answer-at-press and no shift. Pick: yes.
    A success haptic on copy is advised (ux-haptics-feel-substantial); a mockup cannot show it.

11. **Copied text is the number exactly as issued, dashes included.** The deck says so in its hint.
    Gain: what the seller's search expects. Loss: none known. Pick: yes.

12. **The number set in the system monospace with a slashed zero, wrapping only at its dashes.**
    Gain: 0 and O, and group lengths, read apart; at AX5 a group never splits. Loss: monospace runs
    wider. Pick: yes. The app chrome stays in the system font.

13. **Search matches any part of the number, ignoring dashes and case, or the seller name.** Gain:
    a tail from a packing slip finds the order. Pick: yes. A search that matches nothing keeps the
    field and offers "Clear search" (ux-unknown-is-not-empty).

14. **States.** Loading keeps row-sized placeholders; "No orders yet" is one sentence and "Import
    orders"; "File unreadable" says nothing changed, offers "Try again" and "Choose another file",
    and hides the reader's raw message behind "What the reader said". Pick: yes.

15. **Largest text size (AX5).** Rows stack, the reason control becomes a list, and in Message first
    and the deck the actions scroll with the content instead of covering it. Search placeholder
    shortens to "Search". Tab bar labels stay at their default size. Pick: yes.

16. **Colours are my own** (blind house rule): a deep ink blue for actions, green only for "copied",
    red only for warnings. Light and dark sets by role. Spacing on the 4 px step, radius 8 px.

## Sizes and sources

- Duo folded 466 x 678 pt and open 951 x 669 pt with the hinge from x 455.5 to 495.5 come from the
  brief. `layout.py devices` printed `unknown` for this repo, so it gave no size.
- Large phone: no size is written anywhere I may read. The frame is drawn at a starting box of
  460 x 900 px, which is a drawing size, not a device size. Drag its corner to resize.
- Status bar (44 pt) and home indicator (20 pt) heights are placeholders; no page I read gives them.
- Apple pages read 2026-11-21, each answered 200, through the `tutorials/data` JSON:
  [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) (safe areas),
  [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
  (Dynamic Type sizes at Large and AX5),
  [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
  (44x44 pt controls, text to 200 percent),
  [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) (44x44 pt hit region),
  [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) (Cancel or Close dismisses),
  [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) (navigation only, floats),
  [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars),
  [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables).

## Labels

As a blind designer I cannot know what exists today, so the mockup has no "Today:" labels. Dashed
"New:" labels mark the parts each way adds, on the folded frame only; the "New" labels control or
`&labels=off` hides them.

## Input needed

- Items 3, 4 and 8 are marked `Owner grant: yes`.
- Does each seller have an order page URL that takes the order number? The design assumes it does,
  and item 9 covers an order that has none.
