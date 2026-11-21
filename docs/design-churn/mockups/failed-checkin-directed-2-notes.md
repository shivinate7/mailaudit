# Failed check-in ribbon: notes (directed designer 2)

Designer kind: directed. Direction: one ribbon, a single persistent strip with a count and retry all.
Mockup: `docs/design/failed-checkin-directed-2.html`. Deep links: `#s=<state>` and `#c=foot|head`.
States: `today`, `rest`, `fail`, `many`, `list`, `retrying`, `saved`, `still`, `carry`, `hand`, `ax5`.
Every frame is live: tap a line's box, flip "Saving fails", press Retry all.

## What today does (the default this departs from)

- Packages and Tally hold one message, `checkInError: String?` (`PackagesModel` in
  `native/ManifestKit/Sources/ManifestKit/Packages.swift`, `TallyModel` in `Tally.swift`).
- Any good write clears it: `PackagesModel.checkIn(key:count:)` sets `checkInError = nil`, as do
  `write(_:_:)` and `toggleStamped()` (debt `stamped-toggle-clears-error`).
- A failed save rolls the ledger back (`LedgerStore.commitReceived(_:count:)`), so the line just
  stays as it was. Nothing on the line says it failed.
- The masthead slot reads the last write only (`MastheadModel.finished(failed:)`), so the next good
  tap turns "couldn't save" into "saved ✓".
- Packages draws the message in system footnote on `.regularMaterial` at the tab foot
  (`PackagesView.body`, id `checkin-error`; debt `checkin-error-bar-is-sans`). On the open Duo its
  right half sits under the pill bar (debt `duo-checkin-error-under-bar`). Card in Hand draws it
  over the top rows (`HandScreen`, id `hand-checkin-error`).
- So with fast ticking, a failure shows for about one tap, then is gone. That is the owner's "I never
  know if it actually took."

## Items

1. **Hold every failed check-in, keyed by line, until it saves.** What: one held list in ManifestKit,
   shared by Packages, Tally and Card in Hand. Each failed check-in stores the line key and the count
   it was set to. A later tap on the same line replaces it (latest wins). It leaves the list only when
   that line saves, or when a tap sets the line back to its saved count. A good save on another line,
   a tab change, the stamped toggle or opening Card in Hand never clears it. Gain: the failure cannot
   be lost, and it closes `stamped-toggle-clears-error` and `hand-stale-checkin-error` at the root.
   Loss: model change in two models; `checkInError` becomes a list. Pick: yes, under both concepts.
   Departs from: `PackagesModel.checkIn(key:count:)` and `toggleStamped()`, which clear the error on
   any good write.
2. **Foot ribbon (concept).** What: the strip sits above the tab bar, where iOS puts a tab bar
   accessory (HIG Tab bars: "a tab bar with an attached accessory, like the MiniPlayer in Music").
   Folded Duo: 52 pt capsule, bottom edge 8 pt above the bar's 83 pt band. Open Duo, keys down: the
   left page's foot, a 64 pt pill 24 pt in and 12 pt up, the twin of the pill bar across the fold
   (`DuoBarMetrics`). Card in Hand, keys up: the left page's 53 pt slot on the keys' drawn top (y 352
   to 405), the twin of the Post bar. Gain: thumb reach on every pose; never under the bar or across
   the fold; one place on every tab. Loss: on the folded screen it covers about one line of the list
   while it shows; the scroll view keeps a bottom margin of the ribbon's height so every line still
   scrolls clear. Pick: **yes, this is my pick.** Focus id `foot-ribbon`.
3. **Head ribbon (concept).** What: the strip fills the 47 pt running-head slot that
   `MastheadScreen` already reserves under the masthead (`MastheadScreen.slot`). It is sticky, so
   once scrolled it pins under the status bar in the running head's place. On the open Duo it spans
   the left page only. On Card in Hand it takes the header row's own box (Mail day and the count),
   and keeps Close. Gain: no new height anywhere; it never meets the keys, the bar or the Post bar.
   Loss: top of the screen, out of one-hand thumb reach on the 874 pt phone and the folded Duo
   (`ux-thumb-zone`); while held, Card in Hand loses its count. Pick: no; keep as the fallback if
   the owner wants nothing floating over the list. Focus id `head-ribbon`.
4. **The not-saved mark on the line.** What: the failed line keeps its saved look, gains a 4 pt red
   rule in its existing left gutter, and its box shows a dashed red square with a slash. The same
   glyph leads the ribbon and each list row (one icon, one meaning). Gain: the owner sees which card
   failed in place, without opening anything. Loss: none in height or place; the gutter and the box
   already exist (`card-the-action-row-is-reserved`, `no-layout-shift-under-pointer`). Pick: yes.
5. **The list.** What: a tap on the count opens the list of held check-ins: card, seller, the count
   it was set to, the time. Each row has its own Retry. "What the phone said" holds the system text,
   closed (`ux-machine-text-hidden`). The panel is paper filled (`head-panels-carry-paper-fill`) and
   overlays the rows; the ribbon does not move, so Retry all stays under the thumb. A second tap on
   the count closes it (`sync-line-toggles-its-panel` pattern). Gain: "see which card it was"
   without leaving the list. Loss: no "show me the line" jump; that would move the list, and the
   brief asks to keep the place. Pick: yes.
6. **Retry all is one write.** What: Retry all saves every held count in one save, through the bulk
   path `LedgerStore.commitReceived(_ counts:)` that Mark all and Clear already use. The button keeps
   its box while saving ("Saving 3…"). Success: a green receipt holds the strip until the next
   check-in, as the Post receipt does (`duo-card-in-hand`, receipt rule). Failure: "Still not saved"
   with Retry all again. With one held, the label is "Retry" in the same box. Gain: one tap, one
   answer at the press (`ux-answer-at-press`). Loss: none seen. Pick: yes.
7. **The resting strip (Foot only).** What: with nothing held, the Foot ribbon rests as a glass strip
   that names the last check-in that saved ("Saved: Ponder, 1 of 1"). It is not a control. Gain:
   every tick is confirmed where the thumb is, which answers "did it take" for the good taps too.
   Loss: 52 pt of the folded screen is always covered; it takes over the masthead slot's job (item 8).
   Pick: yes, but it is the most cullable part. Hide control: "Hide the resting strip". Focus id
   `foot-rest`. Owner grant: yes (it changes what the ruled save slot does).
8. **The masthead slot stands idle while the ribbon speaks.** What: the save slot keeps its
   reserved box, and shows its idle non-breaking space whenever the ribbon carries the status
   (`ux-label-once`). With the resting strip on, that is always on the Foot ribbon. Gain: one status,
   one place; no "saved ✓" at the top while three check-ins wait at the foot. Loss: the slot's
   message moves; `masthead-save-slot-reserved` says the slot reads saved or failed until the next
   save. Pick: yes. Owner grant: yes. Departs from: `MastheadModel.finished(failed:)` and
   `SaveIndicator`.
9. **Carry on the next good save (option).** What: when a later check-in saves, the held ones ride
   the same save, and the receipt says "2 more saved with Opt". Gain: when the signal or disk comes
   back, the owner need not press anything. Loss: a write the owner did not press at that moment
   (it is still their own tap's count). Pick: yes. Hide control: "Hide carry on the next save".
   Focus id `foot-carry` (and `head-carry`).
10. **Error haptic and a spoken notice.** What: a failure plays the system error notification haptic
    once per failure; VoiceOver hears "Not saved: Path to Exile". A saved retry plays the success
    haptic. Gain: the owner notices without looking (`ux-haptics-feel-substantial`). Loss: none.
    Pick: yes. Not drawable in HTML.
11. **Motion.** What: the ribbon draws on from its leading edge like a ruled line, once, 240 ms, no
    overshoot (`motion-stationery-not-software`); later failures only change the count. Reduced
    motion: drawn. Pick: yes. Timing is a guess until seen on the phone (`motion-remeasure-not-rereason`).
12. **Text size.** What: the ribbon's text is capped at xxxLarge (body 23 pt) with short words
    ("3 not saved"), and shows the large content viewer, as the Post bar does (`duo-card-in-hand`,
    item 104 a). The list is not capped; it scrolls at AX5. Pick: yes.
13. **Held check-ins across a quit.** What: keep the held list on disk, apart from the ledger file,
    so a quit or crash does not drop it. Gain: a failure is never lost. Loss: a new storage key, and
    `storage-keys-are-frozen` and `storage-split-three-adapters` govern storage. Pick: yes, but it
    needs its own ruling. Owner grant: yes. The mockup does not draw it.
14. **No Drop control.** What: there is no "give up" button on a held row. To give up, tap the line
    back to its saved count. Gain: nothing to arm, no ask. Loss: giving up on a line takes a tap on
    the line. Pick: yes.

## Out of scope, seen

- Packages on the open Duo spans both pages today, so its rows cross the fold (`DuoSpread.spreads`:
  `.packages` is false). Not this lane; drawn as built.
- Sync push failures (saved on the phone, not yet sent) are not in the ribbon. The ribbon is for
  check-ins that did not save on the phone.

## Sizes, sources and unknowns

- Duo folded 466 x 678 pt and the 83 pt tab bar from y 595: `duo-fold-and-keyboard`. The brief gives
  the same size.
- Duo open 951 x 669 pt, fold 455.5 to 495.5, keys drawn from y 405: `duo-fold-and-keyboard`.
- Large phone 402 x 874 pt: no record and no brief gives a size. Drawn at this size; its tab bar is
  drawn at the Duo's 83 pt. Both unmeasured.
- Status bar foot drawn at 20 pt on every frame: unmeasured (`DuoHandUITests.statusBarFloor`).
- Light theme only: the native app is held to light (`design-parchment-ledger`).
- Apple pages read 2026-11-21 (each answered 200): Layout (safe areas), Typography (iOS Dynamic
  Type: body 17/22 at Large, 23/29 at xxxLarge, 53/62 at AX5; footnote 13, 19, 44), Accessibility
  (44 x 44 pt control, 200 percent text), Buttons (44 x 44 pt hit region), Tab bars (floats above
  content; the attached accessory; navigation, not actions).
- Check `check_ios_mockup.py`: the frames are built by script, so a static device list carries the
  `data-device` order. It faults `system-font` on Cochin, which `typography-cochin-and-mono` rules
  for app text: a possible false alarm for this repo.

## Input needed

- Concept: Foot ribbon (pick) or Head ribbon.
- Items 7, 8 and 13 are `Owner grant: yes`.
- Critique question: should the resting strip also show on Tally, where a row's count is the only
  sign today?
