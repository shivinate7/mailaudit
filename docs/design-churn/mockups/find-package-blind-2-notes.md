# find-package-blind-2: notes

Designer kind: blind. Mockup: `find-package-blind-2.html`. Drawn from the brief's job, users, data
shapes and the house rules only. I read no current screen, code, spec, token file or other mockup.

Deep links: `#c=clue|sieve`, `&s=loaded|loading|failed|unknown|empty|nomatch`, `&t=light|dark`
(no `t` follows the system), `&d=folded|open|phone|ax5` (one device), `&l=0` (hide the "New:"
labels), `&h=<concept>` (hide a concept). Focus ids: `concept-clue` and `concept-sieve`, the root of
the folded Duo frame of each concept.

No "Today:" label: a blind designer sees no current screen, so every marked part says "New:".

## Choices

1. **Two concepts, each with its own first screen.**
   - Clue search: a list of waiting orders, with one search box and clue chips at the bottom.
   - Sieve: a count and a field of dots, with one question at a time at the bottom.
   Gain: the owner compares a familiar structure with a bold one. Loss: no third concept, such as a
   "likely in today's mail" deck. Pick: both; cull one. Each concept has a Hide control.

2. **Clue search: one box that reads any clue.** It matches the seller, a card name or any part
   of the order number. The order number match ignores dashes. Results rank seller matches first,
   then card matches, then order number matches. Each row shows why it matched, with the match
   highlighted. Gain: the person types what they can read, with no choice to make first. Loss:
   short queries match many card names. Pick: yes.

3. **Clue search: scope chips (Seller, Card, Order no., When).** A chip narrows what the box reads.
   When swaps the box for four time spans. Gain: fewer false matches for a short query. Loss: one
   more row of controls. At AX5 the chips become one "Look in" button that cycles. Pick: yes.

4. **Box and chips at the bottom, under the thumb** (`ux-thumb-zone`). The Apple search-fields
   page says search at the bottom "keeps the search experience easy to reach". Gain: one hand.
   Loss: the keyboard covers the lower rows while typing. Pick: yes. At AX5 the box moves under the
   title, because a tall bottom dock would leave no room for results.

5. **Sieve (bold): find by what the envelope tells you, not by typing.** Each waiting order is a dot,
   grouped by when it was bought. Four questions, one at a time: how thick it is (1 or 2 cards, 3 to
   8, 9 or more), the first letter of the sender, when you bought it, and any word you can read. A
   dot that cannot match goes hollow, and the dot keeps its place. At 8 or fewer, the dots turn into
   rows. Gain: a thumb answers without a keyboard, and the person sees how close they are. Loss:
   the thickness answer guesses a card count from feel. A toploader or a bubble mailer can mislead
   it. A wrong clue hides the right order. The short list therefore ends with "Not in the list? A
   clue may be off", and each clue pill removes its clue with one tap. Pick: yes, for the owner to
   judge.

6. **Sieve shows only orders with nothing arrived.** One order is one package, so an envelope
   in hand most likely belongs to an order where nothing has arrived. Gain: a smaller starting set.
   Loss: a second envelope for an order already ticked as partly arrived is not in the field. Pick:
   yes. Clue search still finds every order.

7. **Sieve letter keys show only letters that occur.** This follows `ux-control-earns-place`. A
   letter with no sender among the candidates is absent. Gain: each key narrows the field. Loss:
   the key grid changes shape between envelopes. Pick: yes.

8. **Same order screen for both concepts.** Each card line has a tick. A line with a quantity
   above 1 has a stepper that reads "2 of 4". One primary button at the bottom reads "Mark all N
   arrived". After a press, that bar reads "Marked all N arrived" and offers Undo
   (`ux-answer-at-press`). It also offers "Next envelope", which returns to a clean finder.
   When every card is ticked, the button is absent and a sentence says so. Gain: one press for
   the usual case, and exact counts for a short package. Loss: none found. Pick: yes.

9. **State shown by shape, not by a repeated word** (`ux-label-once`). An empty ring means
   nothing arrived. A half-filled ring means some arrived. A filled check means all arrived. A dashed
   ring with "?" means arrival is unknown. A row adds "2 of 6 in" only when part arrived. Pick: yes.

10. **Duo open: the finder on the left page, the order on the right.** No element crosses
    x 455.5 to 495.5. A headless check of every element in the open frame confirms this. In Sieve the
    right page is a live candidate list, newest first, until an order opens. Gain: the open pose
    uses its width (layout page, size classes). Pick: yes.

11. **No tab bar.** This brief covers one job on one screen, and a blind designer cannot know the
    app's other sections. tokens.md says a phone app navigates with a bottom tab bar. Gain: the
    bottom of the screen goes to the box or the question. Loss: other sections need a way in.
    Pick: leave it to the informed designer. **Owner grant: yes**, if the app has sections.

12. **States** (`ux-unknown-is-not-empty`). Each state is distinct.
    - Loading: a status line and fixed-size skeleton rows.
    - Read failed: a sentence, "Try again", and a closed "What the app said" disclosure.
    - Arrival unknown: orders show with "?" rings and ticks turned off, with the reason and "Try again".
    - No orders: one sentence, one "Import orders" control, and no filters.
    - No match: the clues stay, and one control removes the last clue or clears the search.

13. **Haptics** (`ux-haptics-feel-substantial`). A light haptic on each tick and stepper press. A
    success haptic on "Mark all arrived". A selection haptic on each Sieve answer.

14. **Colour and type.** The colours are my own, by role, in a light set and a dark set. I used no
    product or Apple system colours. The airmail blue accent is for actions. The arrived, partial
    and danger roles each check against their surface. The font is the system font. Sizes come from
    the iOS Dynamic Type table, Large (default) and AX5. The Sieve count (56 pt) is the one display
    size, and it uses Large Title at AX5. Spacing is on the 4 px step, with an 8 px radius.

15. **Default order of the waiting list: newest first.** This follows `ux-order-holds-still`. Gain:
    the order is plain, and it matches the Sieve dot groups. Loss: orders bought today sit on top,
    and they are the least likely to be in today's mail. The other choice is oldest first within the
    last four weeks. **Owner grant: yes**, if the order should change.

## Devices and sizes

- `layout.py devices` printed `unknown` for this repo, so the brief's device list governs.
- Duo folded is 466 x 678 pt and Duo open is 951 x 669 pt, both from the brief.
- **Large phone: no size is written** in the brief, the device list or any Apple page I read. I
  drew it at the folded Duo size, and the frame resizes by drag. The layout is fluid. **Owner
  grant: yes**: give the phone size.
- Status bar (32 pt) and home indicator (20 pt) heights are my own placeholders, because no page I
  read gives them. Each frame also pads with `env(safe-area-inset-*)`.

## Apple pages read 2026-11-21

Each page was read through its `tutorials/data/...json` path, and each answered 200.
- layout: safe areas, and size classes over device types.
- typography: the iOS Dynamic Type sizes, Large (default) and AX5.
- accessibility: 44x44 pt default control size.
- buttons: 44x44 pt hit region.
- search-fields: search in a toolbar at the bottom.
- lists-and-tables.
- tab-bars: a tab bar floats above content at the bottom.
- toolbars: large title behaviour.
- sheets: read, but no sheet was used.
