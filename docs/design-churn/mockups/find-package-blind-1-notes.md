# Find a package: blind designer 1, notes

Designer kind: blind. Mockup: `find-package-blind-1.html`. I saw no current screen, spec, token
file or other mockup. Every part is marked with a dashed "New:" label, since I cannot know what
exists today. The "Labels" control hides the labels.

Deep links: `#c=search` or `#c=envelope`, plus `&s=<state>`, `&t=light|dark` and
`&d=iphone-duo-folded|iphone-duo-unfolded|iphone-regular|ax5`. The state names are on the State
control. `&hide=search,envelope,dates,postmark,thickness` hides a concept or an option.

## Items

1. **Concept: Clue search.** One search box at the bottom takes any clue: seller, card, order
   number or a date ("nov 8", "11/8", "last week", "3 weeks ago", "october"). The results are
   grouped by what matched, with the match highlighted. Tap a package to open it and tick its
   cards. With no query, the open orders are grouped by how likely they are to be in today's mail:
   bought 5 to 20 days ago first.
   Gain: one place to type, and it works for every kind of clue. Familiar to anyone.
   Loss: the person must type with one thumb while holding an envelope. A vague clue, such as a
   thick envelope, cannot be typed.
   Pick: keep. Hide control: "Hide" beside Clue search. Owner grant: yes (new structure).

2. **Concept: Envelope (the bold one).** The screen is the envelope. Four fields mirror what is
   on the envelope in your hand: From (return address), Postmark, Thickness (how many cards it
   feels like) and Inside (a card name or order number you can read once it is open). Each clue
   shrinks or reorders the pile of open orders above it. When one order is left, it opens in
   place, ready to tick. There is no second screen. No common order app works this way.
   Gain: the person answers questions about the object in their hand. Most clues are a tap, not
   typing. Thickness and postmark use what the person can feel and see, which a search box
   cannot take.
   Loss: it is new, so the first use needs a moment to learn. It uses more of the screen than a
   search box.
   Pick: keep, as the bold concept to compare. Hide control: "Hide" beside Envelope.
   Owner grant: yes (new structure).

3. **Fuzzy clues rank, they never hide.** Postmark and Thickness only reorder the pile. An order
   that does not fit them drops to "Less likely", faded, with the reason on the row. From and
   Inside are exact and filter.
   Gain: a wrong guess about thickness or a smudged postmark never hides the right order.
   Loss: the count shrinks only with exact clues.
   Pick: keep. Hide controls: "Hide Postmark clue", "Hide Thickness clue".

4. **Date clues in the search box.** A typed date becomes a "Bought around Nov 8" group (plus or
   minus 3 days), a month, or a week.
   Gain: answers "roughly when I bought it" without a date picker.
   Loss: the date words are a small grammar that the person must guess. A failed parse just
   matches nothing.
   Pick: keep. Hide control: "Hide Date clues".

5. **Open orders only, with an escape.** Both concepts search only orders that are not yet all
   arrived. When an arrived order would match, a switch at the end of the list says how many and
   includes them.
   Gain: hundreds of orders become dozens. The switch catches an order ticked by mistake earlier.
   Loss: one more control, shown only when it changes the list.
   Pick: keep.

6. **Ticking.** Each card line has a tick that marks the whole quantity, and a stepper ("2 of 4")
   when the quantity is more than one. One button marks the rest of the order. Its answer shows at
   the button, with Undo and "Next envelope", which clears the clues for the next piece of mail.
   The order stays in place after it is all ticked, until the next envelope, so nothing jumps
   under the thumb. A haptic on each tick and step is intended (house rule on haptics).
   Gain: one press for the common case, exact counts for the rare one.
   Loss: the stepper takes room on lines with quantities above one.
   Pick: keep.

7. **Duo open pose.** Clue search: the list is on the left page, and the order is on the right.
   The best match for the typed clue opens on the right while you type, ready to tick. Envelope:
   the large envelope is on the left page, and the pile is on the right. Nothing crosses the hinge.
   The page checks this on every render ("Hinge check" under the frames).
   Gain: on the open device, finding and ticking need no tap between them.
   Loss: none seen.
   Pick: keep.

8. **Set aside.** A "Set aside" button in the top bar keeps an envelope that cannot be matched,
   with an optional note. It goes to an "Unmatched" tab.
   Gain: no dead end when nothing matches.
   Loss: I do not know if the product already has this act or its name. The name is my own.
   Pick: keep. Owner grant: yes (names an act and a tab).

9. **Empty, loading and failed states.** No orders: one sentence and "Import orders", with no
   search box. Loading: placeholder rows and "Reading your orders". Failed: a sentence, "Try
   again", and the raw text behind "What the app said". No match: one sentence and one control
   that clears the search, or drops the Inside or From clue.
   Pick: keep.

10. **State shown by glyph, not words.** Each row shows an empty ring, a half ring or a filled
    check. The words are in the key above the frames and in each glyph's accessible label, so a
    status word never repeats down the list.
    Pick: keep.

11. **Largest text (AX5).** The rows restack: the date and card count move below the name, and
    nothing truncates. The envelope fields stack in one column and scroll with the pile, which
    moves the clues out of thumb reach at that size. The status bar, nav bar buttons and tab bar
    stay at default size, as iOS bars do.
    Pick: keep. Readability wins over reach at this size.

12. **Colour and type.** The colours are my own picks, by role, in a light and a dark set. Ink blue
    for action. The only decoration is the airmail stripe on the envelope, in the Envelope concept.
    Type is the system font at Apple's Dynamic Type sizes: default (Large) and AX5.
    Spacing is on the 4 px step and the radius is 8 px (house tokens).
    Pick: keep. A builder should map these roles to the repo's own tokens.

## Sizes

- Duo folded 466 x 678 and Duo open 951 x 669, hinge 455.5 to 495.5, from the brief.
  `layout.py devices` printed `unknown` for this repo, and the layout file gives no Duo size.
- Large phone: no size is written in the brief or the layout file. I drew it at 430 x 900, my own
  pick, in a frame you can resize by dragging its corner.
- Safe-area fallbacks (48 pt top, 20 pt bottom) are my own picks. No Apple page I read gives
  inset figures.

## Apple pages read 2026-11-21 (each answered 200)

- Layout: safe areas, and lay out by size class, not by device.
- Typography: Dynamic Type sizes. Default: Large Title 34, Title 2 22, Title 3 20, Headline 17,
  Body 17, Subhead 15, Footnote 13, Caption 1 12. AX5: 60, 56, 55, 53, 53, 49, 44, 43.
- Accessibility: 44x44 pt default control size, 17 pt default text, at least 200 percent text.
- Buttons: a hit region of at least 44x44 pt.
- Sheets: Cancel on the leading edge, Done on the trailing edge.
- Search fields: put search at the bottom when there is room. Start the search as the person
  types. Show suggestions.
- Lists and tables, Tab bars, Toolbars: read. The tab bar is used for navigation only.
