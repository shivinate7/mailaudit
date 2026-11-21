# Envelope progress: blind designer notes

Designer kind: blind. Mockup: `envelope-progress-blind-1.html` in this folder.

I read the brief, the house rules (`principles.md`, `layout.md`, `tokens.md`), the glossary,
and the Apple pages below. I read no current screen, no repo spec, no repo tokens and no other
mockup. So no item here cites a file or symbol of the app, and no item has a "Departs from:"
line: I cannot know today's behaviour. The informed designers and the owner judge that.

## Job

A person holds one envelope from one sender, with about a dozen cards in it. They read the
cards off one by one, and want to know found, left, and complete or short "without counting".

## Deep links

Open the file from disk. Add a hash to open one state:

- Concept alone: `#c=ledger` or `#c=tray`.
- State: `#s=progress` (default), `#s=complete`, `#s=short`, `#s=nomatch`, `#s=over`,
  `#s=empty`, `#s=loading`, `#s=failed`.
- Theme: `#t=light` or `#t=dark`. No `t` follows the system setting.
- Device: `#d=folded`, `#d=open`, `#d=phone`, `#d=ax5`.
- New labels off: `#labels=0`.
- Combine with `&`, for example `#c=tray&s=short&t=dark&d=folded`.

Focus ids for the waiting page: `ledger-gauge` (Ledger list) and `tray-slots` (Slot tray). Each id
is on the folded frame only, so each focus finds one element.

## Sizes and devices

- Duo folded 466 x 678 pt and Duo open 951 x 669 pt, hinge x 455.5 to 495.5: from the brief.
  `layout.py devices` printed `unknown` for this repo, so no size came from the device list.
  I drew both poses because the brief asks for them.
- Large phone: neither the brief nor the device list gives a size. The HIG layout page (read
  2026-11-21) no longer holds a device-size table, so I took no number from it. The phone frame
  is drawn at the brief's folded size, 466 x 678, and the reader can drag its corner to resize.
- Largest text: the Duo folded frame at AX5.

## Apple pages read (2026-11-21, each answered 200)

- Typography, https://developer.apple.com/design/human-interface-guidelines/typography: every type
  size, from the "Large (default)" and "AX5" Dynamic Type tables.
- Accessibility, https://developer.apple.com/design/human-interface-guidelines/accessibility: 44x44 pt
  control size.
- Layout, https://developer.apple.com/design/human-interface-guidelines/layout: safe areas, size
  classes. No size taken.
- Buttons, tab bars, toolbars, sheets, lists and tables: the same paths. Sheet: Cancel on the
  leading edge. Tab bar: for sections only, so this one-task screen has none.

## Choices

1. **Two concepts, each with its own structure.** Ledger list: a checklist of names with a count
   bar on top. Slot tray: a picture of the envelope, one slot per physical card, and a name
   reader. Gain: the owner compares a known pattern with a new one. Loss: two to review. Pick:
   show both; each has a Hide control on the page.

2. **Count every physical card, not every name.** Both concepts count 18 cards, not 12 names. A
   name bought four times shows four ticks or four slots. Gain: "left" matches what is in the
   hand. Loss: the number differs from a count of names. Pick: count cards.

3. **Ledger list: one bar and one number above the list.** One tick per card; filled ticks are
   found. The number says how many are left. Gain: the answer to the job is one glance. Loss: the
   bar takes a line of height. Pick: keep.

4. **Ledger list: a done row stays in place until the next press.** A row that reaches its count
   turns done but holds its place. It sinks to Found on the next press. Gain: a fast second tap
   does not land on the row that slid under the thumb. Loss: for one press, a done row sits in
   To find. Pick: hold until the next press. A scroll does not move it yet; the builder can add
   that.

5. **Slot tray: the envelope as slots that fill in place.** Nothing moves when a card is found;
   only its slot fills. Done is a tray with no empty slot, which reads by shape, not by number.
   Gain: no row moves, and done needs no counting. Loss: slot names are small (Caption 2, 11 pt),
   and a very large envelope needs a scroll. Pick: offer it as the bold concept.

6. **Slot tray: the name reader answers in one card.** Typing shows the best match with "2 of 4
   found" and a Found it button. Other matches show as chips. Pressing a slot also fills it.
   Gain: one place to look for the answer. Loss: the answer card keeps its height when empty,
   so a hint fills it. Pick: keep; the fixed height stops the field from jumping.

7. **Short is only what the person says.** "Envelope is empty" marks the envelope done reading.
   With cards left, the envelope reads "2 short", and the missing cards turn amber. Before that
   press the screen says "to find", never "short". Keep looking undoes it. Gain: a slow mail day
   never shows as short. Loss: one more press per envelope. Pick: keep.
   Owner grant: yes. It adds a stored "marked empty" fact per envelope.

8. **A card that is not on the list.** Typing a name with no match says so and offers "Count as
   extra". A copy beyond the count offers "Count an extra copy". Extras show under "Not on the
   list". Gain: a wrong or bonus card is recorded, not lost. Loss: one more list. Pick: keep.
   Owner grant: yes. It adds stored extras per envelope.

9. **Undo.** An Undo control sits in the top bar after the first change. Each Ledger row has a
   minus button; each Slot tray slot unfills on a second press. The open Slot tray keeps a
   "Counted" log with a take-back on each line. Gain: a mistap costs one press. Loss: Undo sits
   at the top, out of thumb reach; the row and slot controls cover the thumb. Pick: keep.

10. **States.** Loading keeps the loaded layout's size and says "Reading the card list". A failed
    read says nothing is lost and offers Try again. An envelope with no list says so in one
    sentence with one control, "Pick another envelope", and hides the name field. None of these
    shows 0 or done. Pick: keep.

11. **Open pose.** Ledger list: To find and the name field on the left page; the count, Found
    and the done controls on the right. Slot tray: the tray and the count on the left; the name
    reader and the Counted log on the right. Nothing crosses the hinge. The Envelopes sheet opens
    on the right page. Pick: keep.

12. **Largest text (AX5).** The count stays pinned at the top and the name field at the bottom.
    The title and the list scroll between them. The Slot tray turns its slots into a strip of
    marks with no names, and the answer card shows only once there is an answer. Gain: "how many
    left" never scrolls away. Loss: at AX5 the list area is short. Pick: keep.

13. **Status word once.** "Found" shows only as the Ledger section heading. A done row shows a
    check. "Short" shows once, in the count. Pick: keep (house rule ux-label-once).

14. **Colour.** My own palette, by role: accent blue for found, green for complete, amber for
    short and missing, in a light and a dark set. Each state also changes the words or a shape,
    so colour never carries it alone. Pick: keep.

15. **Haptics.** Not drawn. The builder should add a light haptic when a card is counted and a
    stronger one when the envelope turns complete (house rule ux-haptics-feel-substantial).

## Self-critique

Run as a single context: this designer has no sub-agent tool, so the two assessments ran one
after the other. The detector found nothing. The browser overlay did not run (it needs a local
server); headless Chrome screenshots of each state stood in for it.

Fixed: the word "Found" showed on every done row and as a heading, so done rows now show a
check. The Ledger hint "Return counts ..." named a keyboard key; it is now a "Count ..." button.
Escape now closes the Envelopes sheet.

Open: Undo sits at the top of the screen; the slot names are small; the Slot tray answer card
holds a hint when idle; AX5 leaves a short list area.
