# Record an envelope: notes for record-envelope-informed-1

Designer kind: informed. Mockup: `docs/design/record-envelope-informed-1.html`. Sample figures only.

The pain, in the owner's words: "I keep losing the envelope I'm in." Four causes on main today:

- The composer's head scrolls away. `ComposerView` in `native/Manifest/OrphanedView.swift` calls `scrollTo(saveRow)` on each focus change and on `keyboardDidShowNotification`. That brings the Save row above the keys and pushes the head ("New envelope") off the top. The mockup measures the head at y -79 to -38 folded.
- The head names no envelope. It reads only "New envelope" or "Edit envelope" (`micro(target == .new ? …)`). It gives no date, no count and no note.
- The armed Discard panel covers the envelope header (debt `native-discard-panel-covers-head`). `.alignmentGuide(.bottom) { $0[.top] - 4 }` has no effect.
- Nothing hides the keys, so they cover the tab bar (debt `composer-keys-cover-tab-bar`). On the web, `discardEnvelope` in `src/app.jsx` leaves the envelope's draft behind (debt `discard-keeps-draft`).

Deep links: open the file, then add `#c=<option>&s=<state>`. The options are `today`, `pinned` and `sheet`. The states are `typing`, `held`, `keysdown`, `armed`, `gone`, `kept`, `edit`, `card-armed` and `away`. Focus ids for the waiting page: `pinned-head` and `sheet-head`. Each is on the folded frame only.

## 1. Option: Pinned head

- **What.** The composer stays in the list, as today.
  - Its head pins under the status bar (`position: sticky`; in SwiftUI, a pinned section header or `safeAreaInset(edge: .top)`).
  - Cancel, Discard draft and Save envelope move to a bar pinned on the keys (`safeAreaInset(edge: .bottom)`). It takes the 53 pt shape of the Card in Hand Post bar (item 103 b).
- **Gain.** The head and Save are always on screen, at y 21 to 75 and y 334 to 387 folded. No ask can reach the head. It is the smallest change to build.
- **Loss.** The bar is a second strip of controls over the list. The bar's mono mini buttons are the app's vocabulary, not an iOS toolbar, so they risk a `web-like` verdict. At AX5 the bar's labels wrap and the bar grows to 62 pt.
- **Structure verdict (Mockup set check, self-applied):** `same`. It keeps today's tabs, today's first screen and the composer in the list. **Native line:** native in structure; the bar buttons may read web-like.
- **Pick:** yes. It is the safe route.

## 2. Option: Envelope sheet (the bold one)

- **What.** + Record an envelope and Edit open the composer as a sheet. The sheet's toolbar is the head: Cancel leading, the envelope's name and count in the centre, Save trailing. This follows the sheets page.
  - The envelope's cards fill the middle as a slip.
  - The two-line card field sits on the keys, and the matches rise from it, best match nearest the field.
  - Discard draft is the last row of the slip.
  - On the open Duo, the envelope takes the left page. The matches, the field and Save take the right page.
- **Gain.**
  - Recording becomes one place with one head.
  - The field is in the thumb zone (`ux-thumb-zone`).
  - The head cannot scroll, so nothing can cover it.
  - The open Duo uses both pages for the one job.
- **Loss.**
  - The sheet covers the tab bar. While recording, a tab change needs Cancel first (the draft is kept). The view change in `testComposerDraftSurvivesAViewChange` then has another route.
  - Folded, two match rows show above the field and the rest scroll, so the slip keeps about three of the envelope's cards in view.
  - At AX5 with the keys up, the slip has almost no room: one match shows and the slip scrolls.
  - The matches read bottom-up, unlike the other lists. In the DOM and for VoiceOver the order stays best-first.
- **Structure verdict:** `new`. The composer leaves the list and covers the tabs, and the open Duo splits the job across both pages. **Native line:** native (a sheet with Cancel and Save in its toolbar).
- **Owner grant: yes.** It departs from the composer in the list.
- **Departs from:** `OrphanedView.list` (the composer is drawn inline, `ComposerView(model:target:.new)`), and from the view change in the UI test above.
- **Pick:** offer it. It fixes the pain at its root. Pinned head is the cheaper fallback.

## 3. The head names the envelope and the cards ready

- **What.** New envelope: "New envelope" and "3 cards ready". Edit: "Editing envelope · 2026-11-03" (sheet: "Envelope of 2026-11-03"), the count, and the start of the note, which holds the sender or tracking number.
- **Gain.** You can tell which envelope this is at a glance.
- **Loss.** It is one more line in the composer.
- **Departs from:** `ComposerView`, the micro label "New envelope" / "Edit envelope", and the card count in the footer (`Text("\(cards) card…")`). The count moves to the head.
- **Owner grant: yes** (new head words).
- **Pick:** both options.

## 4. Capped head, bar and card header at accessibility sizes

- **What.** The composer head, the action bar and the envelope card's header stop growing at xxxLarge (Body 23, Caption 1 18). Each control keeps the large content viewer on a long press. This is the same cap as items 104 a and 105 a on Card in Hand.
- **Gain.** At AX5 the head is 69 pt instead of about 4 wrapped lines. The card's Discard ask then has room below the header.
- **Loss.** Those labels are smaller than the person's chosen size.
- **Departs from:** `ComposerView` and `EnvelopeCard` micro labels, which scale with `relativeTo: .caption` at every size.
- **Owner grant: yes.**
- **Pick:** both options.

## 5. A Discard draft control in the composer

- **What.** A red Discard draft control that arms in place.
  - The ask for a new envelope reads "Tap again to discard 3 cards". For an edit it reads "Tap again to discard 1 change", and the saved envelope keeps its cards. The count is true: cards added or taken away against the saved envelope, plus one for a changed note (the count rule of `ux-house-rules-govern`).
  - Cancel takes first focus. The ask lapses after 4 s, as built.
  - With nothing to discard, the control is disabled and says why.
  - After the tap: "Draft discarded · 3 cards. Nothing was saved." The record control then shows no kept draft.
- **Gain.** Throwing a draft away becomes one act. Today Cancel keeps the draft, and the only way to empty it is stepping every card to zero.
- **Loss.** There are two red Discards: the envelope's and the draft's. The words "draft" and "changes" tell them apart.
- **Departs from:** `ComposerView` footer, which has Cancel and Save only, and `orphan-entry-takes-one-input` ("Only Discard or Save ends a draft"; Discard there is the saved envelope's).
- **Owner grant: yes** (a new control and new ask words).
- **Pick:** both options.

## 6. Where the composer's ask sits

- **What.**
  - Pinned head: the ask takes the bar's own row, the `armed-reset-takes-the-row` pattern. It reads y 334 to 387, and the head is clear.
  - Envelope sheet: the ask takes the Discard row in the slip. Pressing it ends typing, so the keys go and the ask has room. It reads y 267 to 321, and the head (y 39 to 96) is clear.
- **Gain.** By layout, no ask can overlap the head.
- **Loss.** In the sheet, pressing Discard draft drops the keys.
- **Pick:** as drawn.

## 7. The envelope's Discard: ask below the header, draft gone

- **What.**
  - The armed panel hangs 4 pt below the header and overlays the entries. It is on the paper fill (`head-panels-carry-paper-fill`, the default for other panels).
  - Confirming also ends that envelope's kept edit draft, on web and native.
  - Today's frame shows the panel covering the header (y 165 to 211 against 167 to 219).
- **Gain.** It closes `native-discard-panel-covers-head` and `discard-keeps-draft`.
- **Loss.** None found.
- **Owner grant:** no. It is the debts' own fix.
- **Pick:** both options.

## 8. A drag on the list hides the keys

- **What.** This is the owner's ruling, item 86 a. In the mockup, a drag or wheel on the list, or on the sheet's slip, hides the keys.
  - Pinned head: the tab bar then shows from y 595 folded, and under the right page open.
  - Envelope sheet: the tab bar stays under the sheet.
- **Gain.** The keys can be hidden.
- **Loss.** None found.
- **Pick:** both options.

## 9. The match list holds after a tap

- **What.** After a tap on a match, the list keeps every row in place until the next key. The tapped row goes bold with an accent bar. A second tap adds one more, which `orphan-entry-takes-one-input` describes. This is the same rule as Card in Hand, item 48.
- **Gain.** No row slides under the finger, and the second-tap rule becomes reachable.
- **Loss.** A stale list shows until you type.
- **Departs from:** `ComposerView` `.task(id: d.input)`, which refreshes the list when the field clears, so the list empties after each tap.
- **Owner grant: yes.**
- **Pick:** both options.

## 10. A kept draft is visible

- **What.**
  - After Cancel, + Record an envelope reads "draft kept · 3 cards" under its label.
  - An envelope with a kept edit draft shows a manila "edit draft kept" chip. Manila means advisory (`orphaned-colours-by-meaning`).
- **Gain.** You can see where an unfinished envelope waits.
- **Loss.** The record control grows by one line while a draft is kept.
- **Departs from:** `OrphanedView.list`, where the record button reads the same with or without a draft.
- **Owner grant: yes.**
- **Pick:** both options.

## 11. Colours

- Save keeps today's ink fill (`saveReadyFill` is ink). Red marks only Discard and Discard draft. Green appears nowhere, since green means a check-in (`orphaned-colours-by-meaning`).
- Ties are not drawn. The "Could have come from" block is unchanged (`orphaned-mail-never-decides`).

## 12. On the web

- Pinned head: the head becomes `position: sticky`. The bar sticks to the bottom of the visual viewport (`visualViewport` resize).
- Envelope sheet: on phone widths, a full-screen modal dialog, like the photo viewer (test 70.3). It is not a `window.confirm`, so `no-native-dialogs` holds.
- In both, `discardEnvelope` also deletes the envelope's entry in `composerDraft`.
- Not drawn: the web keeps its 375 px layout and only these parts change.

## 13. Sizes, figures and reads

- **Folded Duo.** 466 × 678 pt, with the tab bar from y 595 (`duo-fold-and-keyboard`). Keys from y 389, which is the 289 pt keyboard reading; the folded panel's drawn top is unmeasured.
- **Open Duo.** 951 × 669 pt, with the fold at 455.5 to 495.5 (brief). Keys drawn from y 405 (`duo-fold-and-keyboard`). The tab bar is drawn at y 586, which is unmeasured.
- **Shared.** The status bar foot is drawn at 20 pt, unmeasured. The system keys span the fold (item 22, provisional); the app draws nothing across it.
- **Large phone.** No size is written in the repo, in the brief, or on Apple's layout page, which no longer has a device table (read 2026-11-21). It is drawn at the brief's 466 × 678 pt, and its keys and tab bar reuse the folded figures.
- **Theme.** Light only (`design-parchment-ledger`: the app and the native client are held to light).
- **Apple pages read 2026-11-21** (each answered 200):
  - layout: safe areas; no device table.
  - typography: the Dynamic Type tables. Large Body 17, Caption 1 12. xxxLarge Body 23, Caption 1 18. AX5 Body 53, Caption 1 43, Footnote 44.
  - accessibility: 44 × 44 pt default control.
  - buttons: 44 × 44 pt hit region.
  - sheets: Cancel dismisses without saving; Done dismisses after saving.
  - tab-bars: for navigation, not actions; it floats above content.
  - keyboards: no figure used.
- **Check.** `check_ios_mockup.py` exits 1 with one fault: a font declaration starts with Cochin. Cochin is the content face by `typography-cochin-and-mono`. The house tokens allow brand fonts in content, and the chrome uses `-apple-system`. This may be a false alarm.
