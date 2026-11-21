# Failed check-in: notes

Designer kind: informed. Designer: failed-checkin-informed-1. Mockup: `failed-checkin-informed-1.html` in this folder.

## The pain

The owner ticks hundreds of cards fast, often without looking. "I never know if it actually took."
Today a failed tick has three faults:

- It names no card. Packages and Tally show one footnote bar at the bottom (`PackagesView.swift`, overlay
  `checkin-error`; `TallyView.errorBar`). Card in Hand shows one red line over the top of the envelope page
  (`HandScreen.swift`, overlay `hand-checkin-error`).
- It does not last. The model holds one string, `checkInError`, and any good save clears it
  (`PackagesModel.checkIn`, `checkInError = nil`). So in a fast run the next tick on any card wipes the only
  sign. A tap on the stamped toggle wipes it too (debt `stamped-toggle-clears-error`).
- The failed line looks like a line not yet ticked: a failed `commitReceived` leaves `received` as it was.
  The masthead save slot says "couldn't save", but the masthead has scrolled away during a run.

Two concepts follow. Both keep `no-layout-shift-under-pointer`, `typography-cochin-and-mono`,
`design-parchment-ledger` and `motion-the-check-tick-is-written`.

## Items

1. **The miss stays on its line (both concepts).** A failed line keeps a mark until that same line
   saves: `redSoft` fill, a red box with "!", and a 3 pt red bar in `ItemLine`'s 4 pt leading pad (the
   pattern of the accent bar in `duo-hand-gaps.html`). VoiceOver reads "not saved" as the value. Gain: the
   person sees which card failed, at the press (`ux-answer-at-press`), and a good tick elsewhere does not
   erase it. Loss: the model needs a set of failed line keys, not one string, and the set must be shared
   by Packages, Tally and Card in Hand (`three-views-share-one-switch`), so a builder changes
   `PackagesModel` and `TallyModel` to read one home. No text moves and no frame grows. Pick: yes.
   Departs from: `PackagesModel.checkInError` and `TallyModel.checkInError`, one string cleared by any good
   save. Owner grant: no.
2. **Redo is the same tap.** To redo, tap the red box again. The count did not change, so
   `toggleCount` writes the same act again. No new control sits in the line. Gain: one tap, where the
   finger already is, with no scroll. Loss: none found. Pick: yes. Owner grant: no.
3. **An error haptic on each miss.** `sensoryFeedback(.error)` when a tick fails, none added on success.
   Gain: a person who is not looking feels the miss; Apple's Feedback page (read 2026-11-21) says to give
   feedback by colour, text, sound and haptics, so it reaches a person who looks away. Loss: the app has no
   haptic today, so this is its first; a run of misses buzzes on each one. Pick: yes. Departs from: no
   haptic in the native app (no `sensoryFeedback` in `native/Manifest`). Owner grant: yes.
4. **Marked line: a count in the running head.** "1 not saved", red mono, in a reserved slot at the
   trailing end of the running head, which stays pinned while the list scrolls (`RunningHead`,
   `MastheadScreen.swift`). A tap opens a paper panel under the head that lists each missed card with
   Tick again, and the system's reason in a closed "What the phone said". Gain: quiet; the place it lives
   is always on screen. Loss: the panel's Tick again sits at the top, out of the thumb's reach; the count
   is small at the default size. Pick: second. Owner grant: yes (it adds to the ruled head,
   `ruled-head-masthead-vocabulary`, `masthead-running-head-sticky`).
5. **Returned slip: a slip above the tab bar.** While any tick is not saved, a paper slip with a red top
   rule lies over the list above the tab bar. It names the newest missed card and its seller, and holds
   Tick again (44 pt). More misses show as "N more in the list"; a tap on the words opens the same list
   as item 4. The list gets the slip's height as a bottom scroll margin. For 400 ms after it lands the
   slip takes no tap, so a finger already moving to the line under it is not caught. Gain: the card's
   name and the redo sit in the thumb zone (`ux-thumb-zone`) and stay through a fast run. Loss: it covers
   about one line; the named line can sit under the slip until the person scrolls; the 400 ms is
   unmeasured. Pick: yes, the pick. Owner grant: yes (a new overlay; paper fill per
   `head-panels-carry-paper-fill`, default not owner for this panel).
6. **Returned slip: the drain and the stamp.** The failed tick fills the box red, then drains back over
   about 0.9 s, and a small "RETURNED" stamp lands on the slip (the vocabulary of
   `motion-the-stamp-lands`). Both are off at reduced motion, and the stamp is off at accessibility sizes.
   Gain: the miss reads as mail returned, not as a software alert. Loss: ornament; the drain timing was not
   chosen by looking side by side (`motion-method-side-by-side-proof`). Pick: optional; cull it freely.
   Owner grant: yes.
7. **Today's bars go.** The bottom bar on Packages and Tally and the top line on Card in Hand are removed.
   The system's `localizedDescription` moves behind "What the phone said" (`ux-machine-text-hidden`).
   Gain: closes debts `checkin-error-bar-is-sans` and `duo-checkin-error-under-bar`, and the notes line of
   2026-10-29 that the top banner covers the first lines. Loss: the reason is one tap further away. Pick:
   yes. Departs from: the `checkin-error` and `hand-checkin-error` overlays. Owner grant: no.
8. **How long a miss lasts.** A miss ends only when that line saves. A tick on another card, the stamped
   toggle, a tab change and a good Post leave it. Gain: closes `stamped-toggle-clears-error`. Loss: the
   set lives in memory, so a relaunch drops the marks; the line then shows open, which is true. A miss on
   a line whose package is later refunded stays until the person ticks it or the package leaves the list
   (unbuilt detail). Pick: yes. Owner grant: no.
9. **"No signal" is not a failed tick.** The native tick saves on the phone (`LedgerStore.commitReceived`),
   so a lost signal does not fail it. Signal affects sync to the Worker, and sync never touches the save
   slot (`remote-sync-is-off-the-save-path`). These concepts cover a failed save only. A per-line "not
   synced yet" mark would answer "did it take" more fully, but it departs from that ruling and is not drawn.
   Pick: ask. Owner grant: yes.
10. **Card in Hand, open pose.** Marked line puts the count at the top right of the pinned sender head.
    Returned slip sits on the envelope page just above the keys; with a Post offer up, it stacks above the
    53 pt Post bar (item 103 b). Nothing crosses the fold. Loss: with keys up and the slip shown, the lines
    get y 114 to 341, not 114 to 405. Pick: as items 4 and 5. Owner grant: yes (it shares the Post bar's
    region).
11. **Largest text (AX5).** Line text grows in full (Apple body is 53 pt at AX5, so Cochin 14 grows to
    about 44). The count and the slip are capped at xxxLarge (body 23, footnote 19, caption 1 18), and Tick
    again offers the large content viewer, as the Post bar does (item 104 a). Pick: yes. Default, not
    owner: carried from item 104 a by analogy. Owner grant: no.
12. **Tally.** Not drawn. Tally draws the same `ItemLine`, so it takes item 1's mark as is; its error bar
    goes (item 7); its slip sits on the detail page on the open Duo and above the bar folded. Owner grant:
    no.

## Sizes and sources

- Folded 466 x 678 pt and open 951 x 669 pt with the fold at 455.5 to 495.5 pt: from the brief, the same
  figures `duo-hand-gaps.html` uses. `layout.py devices` gives no size (`unknown`).
- Large phone: no size is written anywhere I could read, and Apple's layout page of 2026-11-21 holds no
  device table. The phone is drawn at the brief's folded size, 466 x 678 pt, as a stand-in.
- Status bar foot 20 pt and keys from y 405: unmeasured, as in the earlier Duo mockups.
- Apple pages read 2026-11-21, each answered 200 (JSON under `developer.apple.com/tutorials/data/`):
  layout, typography (the Dynamic Type tables), accessibility, buttons, tab-bars, feedback.

## Input needed

- Pick a concept: Marked line, Returned slip (recommended), or both (the slip with the running-head
  count).
- Items 3, 4, 5, 6, 9 and 10 carry `Owner grant: yes`.
- The size of the large phone.
- Critique questions: should a run of three or more misses stop the run with a stronger sign (the save
  may be broken for every tick, not one)? Should the slip name the oldest miss, not the newest?
