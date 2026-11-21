# Record an envelope: blind designer 2 notes

Designer kind: blind. Mockup: `record-envelope-blind-2.html` in this folder. Every name, seller, price
and count in it is a sample.

The job: the person types card names from an envelope, matches each to an order line, then saves
or throws the draft away. The header that says which envelope this is must never be covered by the
keys, by Save, or by the throw-away question. A thrown-away draft must really be gone.

Deep links: `#c=<concept>&s=<state>`, with `d=<device>`, `t=light|dark`, `u=block`, `m=off` and
`hide=<concept,...>` as options. Concepts: `stack`, `lines`, `envelope`. States: `draft`, `empty`,
`keys`, `pick`, `nomatch`, `unknown`, `confirm`, `gone`, `saved`, and `today` (Mail stack only).
Devices: `all` (the default), `folded`, `open`, `phone`, `ax5`.

## Choices

1. **Three concepts, each with its own structure and first screen.** Mail stack: a Today list, then
   one page per envelope, with the field at the bottom. Lines first: the open order lines are the
   first screen, with a slim envelope tray pinned on top and the search field under it. The
   envelope (bold): the screen is drawn as the envelope itself, with a big postmark number and a
   rail of envelope numbers down the edge, and no list screen at all. Gain: the owner sees three
   real answers, not three skins. Loss: three times the review. Each concept has a Hide button
   (the cross beside its name). Pick: The envelope. The lit number on the rail and the postmark
   answer "I keep losing the envelope I'm in" more directly than a title can.

2. **The header sits outside every scroll area.** In all three concepts the screen is a column:
   header, then a scroll area, then the field, then the keys. The keys only shrink the scroll area.
   Gain: no state can cover the header; the click-through test checks it in each concept. Loss:
   while typing, fewer lines show. Pick: yes, in all three.

3. **Save and Throw away live in the header.** No bottom bar, no floating button. Gain: Save can
   never cover anything, and never hides under the keys. Loss: on a tall phone, the top is far from
   the thumb (house rule ux-thumb-zone asks for the main action in reach). The field, which is the
   input used most, is in thumb reach in Mail stack (bottom, above the keys). In Lines first the
   field is at the top, under the tray. The envelope puts it in the middle of the envelope. Pick:
   header, and the owner tries thumb reach on the phone.

4. **Throw away asks in the same box as Save, not in a dialog or sheet.** Mail stack and Lines
   first: the row with the count, Throw away and Save turns into "Lose 4 names for good? Keep /
   Throw away". The row keeps its height, so nothing moves. Keep lands where Throw away was, so a
   double tap keeps the draft. Gain: the question never covers the header, and it says what is lost.
   Loss: a short sentence, with less room than a dialog. Pick: yes.

5. **The envelope: hold to throw away.** Press and hold for one second; the button fills. Let go
   early and nothing happens, and the button says so. A keyboard or a screen reader press asks the
   same in-place question as item 4. Gain: no question appears at all, so nothing can cover
   anything. Loss: a hold is hidden until tried, and one second is a drawn guess, not a measure.
   Pick: yes, for the bold concept only.

6. **Thrown away means gone. There is no undo.** After Throw away, the draft is deleted, not
   hidden: the Today list and the rail lose it, the number is free again, and the screen says
   "Envelope 5 thrown away. Its names are gone. Nothing was marked received." with New envelope.
   Gain: matches the job ("must really be gone"). Loss: a mistaken throw-away cannot come back; the
   question (item 4) or the hold (item 5) is the only guard. Pick: no undo. Owner grant: yes.

7. **Saving with names that have no line.** Two options, both drawn (the control "Save with names
   that have no line"). Allowed: Save marks the matched cards received, and each name with no line
   stays on the envelope as mail with no order. Blocked: Save says why ("2 names need a line
   first") at the button, on press, hover and focus. Gain of allowed: the person is never stuck
   with a card that has no order. Loss: unmatched names pile up for later. Pick: allowed. Owner
   grant: yes.

8. **The envelope's identity is its number for today, plus the sender.** The number is given when
   the envelope opens. The sender comes from the matched lines ("From Harbor Cards"). If the
   matched lines come from two sellers, the header turns red: "Lines from 2 sellers. Check each
   card." Gain: an envelope has a name before anything is typed, and a mixed match shows at once.
   Loss: the number means nothing on paper; the person could write it on the envelope. Pick: yes.
   Owner grant: yes, because it adds a daily envelope number to the data.

9. **Lines from the same sender come first.** When picking a line, lines from this envelope's
   sender are grouped first, then other sellers. Gain: the likely line is on top. Loss: none seen.
   Pick: yes.

10. **One draft at a time.** New envelope is off while a draft is open, and says why: "Save or
    throw away envelope 5 first." Gain: there is always exactly one envelope you are in. Loss: two
    envelopes cannot be worked on side by side. Pick: yes.

11. **The draft survives leaving.** In Mail stack, Back to Today keeps the draft, shown first in
    the list as "Draft. 2 of 4 ready". House rule ux-keep-what-was-made. Pick: yes, in all three.

12. **Names before lines, or lines before names.** Mail stack and The envelope: type the name, add
    it, then pick its line. Lines first: type, and tap the matching line; the name and line are
    added in one tap. The envelope also shows live matches while you type, so one tap can add both.
    A name with no line can be added in all three. Pick: the one-tap add, where it exists.

13. **No match, and lines that did not load, are different states.** No match: "No open line is
    named ..." with Fix spelling and Keep with no line. Did not load: "Order lines did not load, so
    no match can show. Your names are kept." with Try again, and the machine text behind a closed
    disclosure. House rule ux-unknown-is-not-empty. Pick: yes.

14. **Ready is shown by shape.** Each name is a dot in the header (filled when it has a line), a
    filled tick or a dashed ring in rows, and a solid or dashed chip. The word "ready" shows once,
    in the count. House rule ux-label-once. Pick: yes.

15. **Duo open pose: a list beside its detail, never the folded layout made wider.** Mail stack:
    Today on the left page, the envelope on the right. Lines first: the envelope and its names on
    the left, the search and lines on the right. The envelope: the rail and the envelope on the
    left, the lines on the right. The keys come up on the page that holds the field. Nothing sits
    in the hinge gap (x 455.5 to 495.5). Pick: yes.

16. **Largest text (AX5).** The list, the field, the lines and the chips grow to AX5 (body 53 pt).
    The header bars stop growing at xxxLarge (body 23 pt), the largest size before the
    accessibility sizes, so the header and the field both still fit on one screen with the keys up.
    In The envelope at AX5 on one screen, the chips give way to a "Next name" control in the lines
    area. Gain: the header is never pushed off. Loss: header text is smaller than the rest at AX5;
    iOS's Large Content Viewer would show it full size on a long press (not drawn). Pick: yes.
    Owner grant: yes, because it caps Dynamic Type in the header.

17. **Colour.** Role colours of this designer's own: a cool grey surface, an ink-blue accent, a
    green for ready, a red for throw away, and a manila tone for the envelope (the number tag in
    Mail stack and Lines first, the whole envelope in The envelope). Light and dark sets. Pick: yes.

## Sizes and sources

- Duo folded 466 x 678 pt and Duo open 951 x 669 pt, hinge gap x 455.5 to 495.5: from the brief.
  `layout.py devices` printed `unknown` for this repo.
- Large phone: no size is written anywhere I may read, so it is drawn at the folded size, with a
  drag handle to resize. `#d=phone` opened on a phone narrower than 600 px fills the real screen.
- Keys: drawn at 40% of the screen height. No page I read gives a keyboard height; unmeasured.
- Status bar (24 pt) and home indicator (16 pt) areas: drawn guesses, no page gives them; the frame
  also pads with `env(safe-area-inset-*)`.
- Hold time, one second: a guess, unmeasured.

Apple pages read 2026-11-21, each answered 200, through the `tutorials/data` JSON:

- https://developer.apple.com/design/human-interface-guidelines/typography: Dynamic Type sizes,
  Large (default) and AX5 and xxxLarge tables.
- https://developer.apple.com/design/human-interface-guidelines/accessibility: 44x44 pt default
  control size, 17 pt default text, text to at least 200 percent.
- https://developer.apple.com/design/human-interface-guidelines/buttons: 44x44 pt hit region;
  a destructive button is never the primary button.
- https://developer.apple.com/design/human-interface-guidelines/sheets: Cancel and Done placement,
  and an action sheet to confirm a swipe-away with unsaved changes. No sheet is used here.
- https://developer.apple.com/design/human-interface-guidelines/layout: lay out by size class, not
  device.
- https://developer.apple.com/design/human-interface-guidelines/toolbars: large title and one
  primary action on the trailing side.
- https://developer.apple.com/design/human-interface-guidelines/tab-bars: a tab bar is for
  navigation, not actions. No tab bar is drawn: the app's other sections are not in this brief.
- https://developer.apple.com/design/human-interface-guidelines/lists-and-tables: read; no number
  used.

## Not drawn

- The app's tab bar and its other sections.
- A saved envelope opened in full. The envelope's rail shows a saved one read-only; Mail stack
  lists saved envelopes without opening them.
- Haptics. Proposed: a light tap when a line is picked, and a firm one when the hold completes.
