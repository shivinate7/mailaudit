# Record an envelope with one thumb: notes

Designer kind: directed. Direction: one-handed thumb zone: every action sits in thumb reach, header always visible.

Mockup: `docs/design/record-envelope-directed-1.html`. Sample figures only. Every frame is live: type on the drawn keys, tap a match, step a count, drag the list to hide the keys, arm and confirm a throw-away, then record again.

The screen: the Orphaned composer (`ComposerView` in `native/Manifest/OrphanedView.swift`, `EnvelopeComposer` in `src/app.jsx`) and the saved envelope's Discard (`EnvelopeCard` in both). The job: "I keep losing the envelope I'm in." The four debts behind it: `composer-keys-cover-tab-bar`, `native-discard-panel-covers-head`, `discard-keeps-draft` and `orphaned-composer-contrast`.

## Deep links

Hash keys: `s` state, `d` device, `h` hand, `t` theme, `c` concepts shown, `tags=0` hides the Today/New tags.

- States: `#s=empty`, `#s=typing`, `#s=ready`, `#s=armed`, `#s=thrown`, `#s=keysdown`, `#s=edit`, `#s=saved`, `#s=discard`.
- Devices: `d=folded`, `d=ax` (folded, AX5), `d=open`, `d=phone`.
- Other: `h=left`, `t=dark`, `c=dock`, `c=pinned`, `c=dock.pinned`.
- Example: `record-envelope-directed-1.html#s=armed&d=ax&c=dock`.
- Focus ids: `dock-choice` (Thumb dock, folded frame) and `pinned-choice` (Pinned head and shelf, folded frame).

A deep link to an armed state stays armed. A press arms with the 4 s lapse.

## Choices

1. **Thumb dock (concept).** The composer becomes its own page. The envelope head is pinned at the top. The card-name field docks at the bottom, the matches stack upward from it, and Throw away, Cancel and Save sit in one strip on the keys. On the open Duo, the envelope (head and lines) takes one page and the field, matches and strip take the thumb's page.
   Gain: the head is a separate region that nothing scrolls, so no state can hide it; every press is within the bottom band. Loss: the largest change; the composer leaves the list, so the pile is out of sight while recording.
   Departs from: the composer drawn inline in the Orphaned list (`OrphanedView.list`, `ComposerView`; `src/app.jsx`, the `view === "mystery"` block).
   Pick: yes, this concept. Owner grant: yes.

2. **Pinned head and shelf (concept).** The composer stays in the list. While it is open, its head takes over the running head and stays pinned. Matches become a sideways shelf of chips over the keys, beside one glass bar: count, Cancel, Throw away, Save. With the keys hidden, the band rests above the tab bar, as the web's `.mdl-pill` rests above `.mdl-bar` (`src/app.jsx`).
   Gain: closest to today; the field stays at the top, where you read what you type. Loss: the field itself is out of thumb reach (the keys cover typing, so only a re-focus needs a reach); chips show fewer matches and truncate long names.
   Departs from: the dropdown under the field (`EnvelopeComposer` matches block; `ComposerView` `found` list) and the footer row at the end of the card.
   Pick: second. Owner grant: yes.

3. **Head content.** Thumb dock: a kicker ("Recording" or "Editing"), the title ("New envelope" or "Envelope of <date>"), and the card count. Pinned: title and kicker; at AX sizes the count joins the head.
   Gain: the head says which envelope this is, and the count shows once on the screen. Loss: the count moves away from Save.
   Departs from: the count in the footer beside Cancel and Save (`ComposerView` footer; `EnvelopeComposer` footer `span`).
   The count gets an id in the mockup (`composer-count`). Debt `orphaned-composer-contrast` says a named skip needs that id first. This is not a colour fix: its colours already clear.
   Pick: Thumb dock's head.

4. **Matches overlay, never push.** Thumb dock: matches overlay the lines inside the middle band, so even at AX5 they stop under the head. Pinned: the shelf has a fixed height.
   Gain: no line moves when the matches open (`motion-disclosure-panels-arrive`, `no-layout-shift-under-pointer`). Loss: the overlay hides the newest lines while you type.
   Pick: yes, both.

5. **Matches hold after a tap.** The tapped match is bold with an accent bar; the list keeps its rows until the next key. The field still clears and keeps focus.
   Gain: a second tap on the same row adds a second copy, and no row slides under the thumb. Loss: the list shows the last query's matches after the field has cleared.
   Departs from: `addName` in `src/app.jsx` (`setDraft("")` empties the list). Precedent: the Card in Hand hold (`duo-card-in-hand`, item 48).
   Pick: yes.

6. **Throw away on the composer.** A Throw away control on a new draft and on an edit. On a new draft it ends the draft. On an edit it ends the edits, and the saved envelope stays.
   Gain: the person can drop a draft without saving it. Today Cancel keeps the draft, so the only way out of a new draft is Save. Loss: one more control in the strip.
   Departs from: `orphan-entry-takes-one-input` ("Discard sits on each saved envelope"); the composer has Cancel and Save only.
   Pick: yes. Owner grant: yes.

7. **Where the throw-away ask arms.** Thumb dock: the ask rises from the strip, over the field and matches, with one red confirm "Throw away N cards". Pinned: the ask arms inside the bar. The pressed spot turns to Keep, the confirm takes the count and Cancel's place, and Save waits.
   Gain: neither ask can reach the head, at any text size. Loss: the dock's ask hides the field for up to 4 s.
   Departs from: "The ask hangs below the row" (`orphan-entry-takes-one-input`, section Discard). The saved envelope's Discard keeps that rule.
   Pick: the rising ask. Owner grant: yes.

8. **Arming safety.** In both concepts, a second tap on the spot of the first press keeps the draft, and first focus goes to Keep. The ask lapses after 4 s, as `EnvelopeCard` (`.task(id: armed)`) and the web arm timer do.
   Save while armed: Thumb dock leaves Save live (a save ends the ask and keeps the cards); Pinned holds Save until Keep or the lapse. Pick: live, because a save never loses cards.

9. **A thrown draft is gone.** Confirm empties the draft, closes the composer, and shows "Draft thrown away: N cards. Nothing kept." where the composer was. There is no undo. Record again opens an empty composer. A saved envelope's Discard also ends that envelope's edit draft.
   Gain: closes debt `discard-keeps-draft` on the web (`discardEnvelope` in `src/app.jsx` never clears `composerDraft`). Native behaviour of `model.discard` is unread: unknown.
   Pick: yes.

10. **Cancel stays and keeps the draft.** Cancel closes the composer and keeps its draft (`ux-keep-what-was-made`). Thumb dock adds "Draft kept · N cards" to the Record control.
    Departs from: a Record button that does not show a kept draft (`OrphanedView.list`, `orphaned-record`).
    Pick: yes.

11. **Keys.** A drag on the list hides the keys in both concepts (owner, page item 86 a). The tab bar stays under the keys while they are open (`duo-card-in-hand`, 15:34 a). With the keys hidden, the strip or band sits above the tab bar, and a tap on the field brings the keys back.
    Pick: yes. Ruled already.

12. **Record from the thumb.** Thumb dock moves "+ Record an envelope" to the bottom of the Orphaned list, above the tab bar.
    Departs from: the button at the top of the list (`OrphanedView.list`; `src/app.jsx`).
    Pick: yes, with item 1.

13. **Hand setting.** A Right thumb or Left thumb setting. It mirrors the dock strip, and on the open Duo it puts the thumb's page on that side.
    Gain: Save sits under a left thumb too. Loss: one more option; its home would be the Ledger tab's options (`ledger-tab-holds-options`).
    Pick: yes, default right. Owner grant: yes.

14. **Largest text (AX5).** The lines, matches and fields grow to AX5. The head, strip and bar stop at xxxLarge, and show the large content viewer on a long press, as the Post bar does (`duo-card-in-hand`, item 104 a). In Pinned, the count moves into the head and Save takes its own row.
    Departs from: today's composer, which grows every part and stacks the footer at AX sizes (`ComposerView` footer `AnyLayout`).
    Pick: yes.

15. **Kept as today.** The Note field, Photo of the label (web), "Add … as typed", the − and + steppers, "Save changes" on an edit, and the saved envelope's Edit and Discard.

16. **Platform departures.** HIG Sheets puts a sheet's Cancel and Done in the top toolbar (skill `ios-apps` table, read 2026-10-28; today's read confirms Done pairs with Cancel). Thumb dock puts them at the bottom, on the keys, for the thumb. HIG Virtual keyboards allows custom controls above the keys with the keyboard layout guide; both bands use it.

## Devices and figures

- iPhone Duo folded: 466 × 678 pt, tab bar from y 595, 83 pt tall; keys 250 to 289 pt tall, drawn at 289 (measurement `duo-fold-and-keyboard`).
- iPhone Duo open: 951 × 669 pt; fold strip x 455.5 to 495.5; keys drawn from y 405 (same record). No app control crosses the fold; the system keys span it (`duo-card-in-hand`, item 22, provisional). The tab bar height on the open pose is drawn from the folded reading.
- Large phone: no size is written in `layout.py devices`, the brief or the repo. The frame is a stand-in shape, and its keys reuse the folded Duo's 289 pt. Unmeasured.
- Status bar foot: drawn at the 20 pt UI-test floor. Unmeasured.
- Theme: light is the native app's only theme (`design-parchment-ledger`). The dark set is the web's.

## Apple pages read 2026-11-21

Each answered 200, through the `tutorials/data` JSON:
- Layout: safe areas, size classes.
- Typography: Large (default) body 17/22, caption 2 11; AX5 body 53/62, caption 1 43, caption 2 40; xxxLarge body 23.
- Accessibility: control size 44 × 44 pt by default, 28 × 28 pt at least; text larger to at least 200 percent.
- Buttons, Toolbars, Tab bars.
- Virtual keyboards: keyboard layout guide; controls above the keyboard.
- Sheets: Done pairs with Cancel.

## Critique (impeccable, single context)

Method: degraded, single context, because no sub-agent tool was exposed to this designer. PRODUCT.md and DESIGN.md do not exist in this repo. Detector: `impeccable detect` exit 0, no findings. Browser overlay: not run (no browser with page injection); headless Chrome screenshots stood in.

Scores (Nielsen, 0 to 4): status 3, real world 3, control and freedom 4, consistency 3, error prevention 3, recognition 3, efficiency 3, minimalist 3, recovery 3, help n/a (a working tool with no help surface). Total 28/36.

Findings and fixes:
1. P2, fixed: a drawn envelope glyph in the Thumb dock head read as an empty box. Removed.
2. P2, fixed: the ready count turned green. Green means received in this app (`orphaned-colours-by-meaning`), so the ready count now takes an ink edge.
3. P2, fixed: the open Duo's input page said "nearest your thumb", which is the designer's voice. It now names what fills it.
4. P2, open: in Pinned head and shelf at AX5, only the head and the field show above the band while the keys are up; the lines need a drag. Thumb dock keeps one line in view. This counts for Thumb dock.
5. P3, open: in Thumb dock, Throw away sits beside Cancel. The two-step ask guards it, and the mirror setting keeps Save under the thumb.
6. P1, fixed (advisor read): arming changed the arm control's box, so a second tap on part of the first press could land elsewhere (`no-layout-shift-under-pointer`). Both concepts now hold both labels in one box, and the Pinned confirm overlays the count and Cancel without moving a track. A headless check proves it on all four frames of each concept: the centre and four corners of the pressed box hit Keep, and Cancel and Save keep their boxes.

Questions to consider (for the owner):
- Should Throw away exist on the composer at all, or should Cancel offer it as a second step?
- Is a pile out of sight while recording (Thumb dock) a real cost, or does the head's count say enough?
- Would one fixed hand (right) serve, so the Hand setting can go?

## Design review self-check (skill `design-review`)

The two blind reviewers and the design reviewer were not run: a designer cannot spawn agents. These are the designer's own lines, not the review.

- Mockup set check, structure: Thumb dock `new` (the composer leaves the list for its own page; Record moves to the bottom). Pinned head and shelf `same` (same list, same view, same first screen; layout changes only).
- Thumb dock: `web-like` risk. The head is the app's own letterhead style, not a navigation bar with a title. The strip now takes the toolbar's glass, and its buttons are the app's own `MiniLabel` pills. A builder should build the strip as a toolbar on the keyboard layout guide.
- Pinned head and shelf: `native`. The running head pins as today, and the shelf and bar sit above the keys as an input accessory (HIG Virtual keyboards).

## Checks

- `check_ios_mockup.py`: one fault, `system-font`: a declaration starts with Cochin. The app's words are Cochin by decision `typography-cochin-and-mono`; the chrome is `-apple-system`. `duo-hand-post-sender.html` and `duo-hand-tap-shift.html` in this folder have the same fault. Possible false alarm; reported, not routed around.
- A headless click-through passed: type, pick, step, Cancel keeps, reopen restores, arm, second tap keeps, confirm, reopen is empty, save, edit, discard a saved one.
