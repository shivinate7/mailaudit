# Record an envelope: directed designer 2, keyboardless

Designer kind: directed. Direction: keyboardless: tap-to-pick from the order's own cards, typing only as a fallback.

Mockup: `record-envelope-directed-2.html`, beside this file. It draws two concepts, Packing slip and Card index, on the
iPhone Duo folded (466 x 678 pt), the folded pose at the largest accessibility text size (AX5), the Duo open
(951 x 669 pt, hinge 455.5 to 495.5 pt), and a large phone. Every state is live and has a deep link:
`#c=slip|index|both&s=empty|picking|orders|typing|armed|discarded|closed|saved|edit|editarmed&d=all|folded|ax5|open|phone`.
The owner's choice is the picker: focus `#choice-slip` or `#choice-index` (folded frame, any compose state).
Light theme only: the app ships one theme (decision `design-parchment-ledger`; `UIUserInterfaceStyle` is held to light).

The job, in the person's words: "I keep losing the envelope I'm in." The draft holds card names, matched lines and a
count. Today the composer opens with the keys up (`ComposerView.onAppear` sets `focused = .name` in
`native/Manifest/OrphanedView.swift`), the keys cover the tab bar (debt `composer-keys-cover-tab-bar`), the armed
Discard panel covers the envelope head (debt `native-discard-panel-covers-head`), and Discard keeps the draft (debt
`discard-keeps-draft`).

## Choices

1. **Keys down by default; Type opens them.** The composer opens with no focus. A Type button beside the picker opens
   the card name field and the keys. "Back to tapping" closes them.
   Gain: the head, the tray, Save and the tab bar are all on screen while you record; the tab-bar test in
   `composer-keys-cover-tab-bar` has a reachable tab. Loss: a card that is not in the ledger takes one more tap.
   Pick: yes.
   Departs from: `orphan-entry-takes-one-input` ("The input is autofocused when the view opens") and
   `ComposerView.onAppear` (`focused = .name`). Owner grant: yes.

2. **Pinned envelope head.** "New envelope", the start time, the "Could have come from" line, and a stamp box with the
   card count, at the top, outside every scroll view. No key, bar, menu or ask is drawn above it. At AX5 the title is
   capped at 40 pt and the head shows the title and count only; VoiceOver reads the whole head.
   Gain: the person always sees which envelope they are in, the stated job. Loss: 76 pt (120 pt at AX5) of height
   that a list would use. Pick: yes.
   Departs from: `ComposerView`, whose "New envelope" micro label scrolls with the form. The AX5 cap follows the
   precedent of owner item 105 a in `duo-card-in-hand` (head trimmed at large sizes). Owner grant: yes (the cap).

3. **Concept Packing slip.** First card from an A to Z list with a letter rail. After that, "Its orders" shows each
   candidate order as a slip of its own lines; a tap on a line adds that card. Slips keep their order while you tap
   (the order is taken when you open the segment); a slip that explains less goes soft in place; a tie prints a manila
   line "N orders fit equally well. Nothing is checked in". A line the envelope fully covers shows a green tick.
   Gain: the second card on is one tap, from a short list, which is the direction. Loss: the slips show every line of
   an order, which can read as "the rest of the package"; the tie line and the soft ink guard against reading it as a
   decision. Two orders with the same commons look alike, as they should. Pick: offered; hide with "Hide Packing slip".
   Rules kept: `orphaned-mail-never-decides` (nothing is checked in; a tie gets no emphasis), `no-layout-shift-under-pointer`
   (no re-sort under a tap), `candidates-skip-date-filter` (the slips use `rankCandidates` order, no date filter).

4. **Concept Card index.** One flat index of every card still out, as tiles, A to Z with a letter rail, or oldest
   order first. Nothing narrows or reorders. The matched lines sit behind one line under the picker head, "Could
   have come from N orders", which opens a read-only list of each order's matched lines.
   Gain: the most predictable picker; no list depends on what you tapped. Loss: every card after the first still
   needs a scroll or a letter jump. Pick: offered; hide with "Hide Card index".

5. **The orders cue (Packing slip).** After the first card, "Its orders · N" turns accent with a dot. The view never
   switches by itself, since an automatic switch would move the list under the finger.
   Gain: the next step shows without moving anything. Loss: one more tap than an automatic switch. Pick: yes.

6. **Tray of recorded cards.** A fixed 52 pt strip under the head holds a chip per card with its count. A tap on a chip
   opens a menu: One more, One fewer, Take it out. On the open Duo the left page holds the same list with − and +
   steppers, as `ComposerView.stepper` draws them today.
   Gain: the draft stays in view while you pick. Loss: on the folded screen a long draft scrolls sideways.
   Pick: yes. Departs from: the entry rows inside the form in `ComposerView`. Owner grant: no (layout only).

7. **One bar for the draft, in thumb reach.** Close, Discard and Save envelope sit in one 60 pt bar above the tab bar
   (on the open Duo, at the foot of the left page). Close and Discard are plain toolbar text; Save is the one filled button. The armed Discard takes the bar's own row: Cancel (first focus)
   and "Tap again to discard N cards"; it lapses after 4 s, as `DiscardLapses` does today. At AX5 the ask grows up
   over the list, never over the head.
   Gain: the ask can never cover the head; it fixes the cause of `native-discard-panel-covers-head` for the draft.
   Loss: Discard sits one button from Close; the arm step covers a mis-tap. Pick: yes.
   Departs from: today's composer, which has Cancel and Save only, with Discard on saved envelopes only
   (`EnvelopeCard`, the armed panel). Owner grant: yes (Discard on a draft is a new act).

8. **Close keeps; Discard is gone.** Close (today "Cancel") leaves the draft and the record button becomes "Resume
   envelope · N cards". After Discard the button reads "+ Record an envelope" again, a new draft opens empty, and a
   receipt in the bar slot says "Draft discarded. Its N cards are gone." No Undo: the ask is the guard
   (ux-ask-or-undo).
   Gain: the person can see that a discarded draft is really gone, and that a closed one is kept.
   Loss: a rename of Cancel to Close. Pick: yes.
   Departs from: `ComposerView` ("Cancel") and `OrphanedView.list` ("+ Record an envelope" whatever the draft).
   Owner grant: yes (rename, and the build must end the draft per `discard-keeps-draft`).

9. **Typing fallback.** The field sits directly under the tray, so the head and tray stay above the keys. Suggestions
   come from the cards still out (`outstandingNames`), with today's "Add “…” as typed" manila row. A typed card shows
   as a manila chip.
   Gain: today's behaviour for a card not in the ledger. Loss: none over today. Pick: yes.

10. **Open Duo: envelope left, picker right.** The left page holds the head, the envelope's own list and the bar; the
    right page holds the picker and the tab bar (round 2 item 23 a in `duo-card-in-hand`). With Type, the system keys
    span both pages from y 405 pt, as `duo-fold-and-keyboard` measured; the field moves to the top of the right page.
    Gain: list beside detail, per the HIG layout page. Loss: the system keyboard crosses the hinge, which the brief
    says nothing may sit across. The app cannot stop that; the keys are rare in this design. Pick: yes.
    Departs from: `OrphanedView.body` on the open Duo (`DuoPages`), which puts the envelope pile on the left page
    and the picked envelope's `detail` on the right, with the composer inside the left-page list. The pile keeps
    that layout here; only the composer takes both pages. Owner grant: no (layout only, while composing).

11. **AX5, folded.** Rows wrap the name to its own line; the letter rail hides, section heads stay; the tray folds into
    the head's count; Close, Discard and Save keep their places with "Save" for "Save envelope".
    Gain: every control stays reachable. Loss: two rows per screen. Pick: yes.

12. **Edit draft names its envelope.** Edit on a saved envelope opens its own draft (per-envelope keys, as
    `orphan-entry-takes-one-input` holds). The head reads "Envelope of 19 Nov" and "Editing · saved with 3 cards".
    The bar says "Discard changes" and "Save changes". Discard here drops the changes only; the envelope keeps its
    saved cards, and the receipt says so. Close keeps the changes, and the saved card's Edit becomes "Resume edit".
    The saved card's own Discard still deletes the envelope, so the two acts get two names (ux-one-plain-name).
    Deep links `#s=edit` and `#s=editarmed`.
    Gain: the hardest envelope to tell apart, one being edited, is named at the top. Loss: two more labels.
    Pick: yes. Departs from: `ComposerView` ("Edit envelope" micro label, Cancel and "Save envelope" for both
    targets). Owner grant: yes (what Discard does on an edit draft).

13. **Wording "out".** Rows say "2 out · 3 sellers", today's suggestion text (`ComposerView`), not a new word.

## Sizes and sources

- Folded 466 x 678 pt, tab bar from y 595 pt (83 pt), and the folded keys 250 to 289 pt tall: `duo-fold-and-keyboard`.
  The mockup draws 289 pt.
- Open 951 x 669 pt, hinge 455.5 to 495.5 pt, keys drawn from y 405 pt: the brief and `duo-fold-and-keyboard`.
- Status-bar foot: unmeasured; drawn at the 20 pt floor of `DuoHandUITests.statusBarFloor`, as earlier Duo mockups do.
- Open Duo tab bar band (from y 586 pt) and left-page bar place: unmeasured.
- Large phone: no size is written in the brief, the repo or `layout.py devices` (it prints "unknown"). Drawn at
  402 x 874 pt with a 54 pt top inset and the Duo's 289 pt keys. These are placeholders, not measurements.
- Apple pages read 2026-11-21, each answered 200, from `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`:
  layout (safe areas; list beside detail at larger widths), typography (Dynamic Type table: body 17 pt at Large,
  53 pt at AX5; Title 2 22 pt at Large), accessibility (default text 17 pt, minimum 11 pt; text to 200 percent),
  buttons (44 x 44 pt hit region), sheets (Cancel and Done pairing), tab-bars, toolbars, lists-and-tables, keyboards.

## Checks

- `check_ios_mockup.py`: one fault, `system-font`: content is set in Cochin, by decision `typography-cochin-and-mono`;
  chrome (tab bar, keys, segmented control, page) starts with `-apple-system`. Main's merged mockup
  `duo-hand-post-sender.html` faults the same way (run 2026-11-21). The check refuses the repo's ruled content font,
  while the ios-apps rule text names only the chrome's font. This needs a ruling outside the design folder.
- design-review, applied to this page (no reviewer agents could be spawned; this is the designer's own read).
  Structure verdict: `new` for both concepts (the composer becomes a full page with a picker; keys no longer open
  first). Native verdicts, both concepts: folded `native` (segmented control, section index, floating tab bar,
  bottom toolbar with plain Close and Discard and one filled Save, a menu on the chip); AX5 folded `native` (rows
  wrap, controls keep 44 pt); open Duo `native` (list beside detail); large phone `native`. One part leans
  `web-like`: the Card index tiles with a corner "+" read like web cards; a list row, as in Packing slip, is the
  more native form.
- impeccable critique (design review inline; the detector ran): fixed the "owed" wording (now "out"), the hidden next
  step (orders cue), the AX5 ask that clipped its text, and the striped hinge (detector, repeating stripes). Kept: the
  cream palette finding, which is the ruled parchment palette (`design-parchment-ledger`).
- Letter rail targets are under 44 pt each, like the iOS section index they copy. Section heads and scrolling remain.

## Input needed

- Items 1, 2, 7, 8 and 12 are marked Owner grant: yes.
- A written size for the large phone.
- Critique questions: should the slips show only the lines still out, not the whole order? Should the first
  screen be "Oldest order first" rather than A to Z, since lost mail skews old? Is one tap on "Its orders" worth
  keeping, or should the second card's list sit beside the first on the open Duo with no switch?
