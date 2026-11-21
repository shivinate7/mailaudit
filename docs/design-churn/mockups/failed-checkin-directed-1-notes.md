# Failed check-in: the failure stays on the row

Mockup: `failed-checkin-directed-1.html`. Designer kind: directed. Direction: inline: the failure lives on the row that failed, with a retry on that row.
Debts this answers: `checkin-error-bar-is-sans`, `duo-checkin-error-under-bar`, `stamped-toggle-clears-error`, `hand-stale-checkin-error`, and the 2026-10-29 note in `docs/debts/notes.md` (the Card in Hand banner covers the first rows). Invariant: `no-layout-shift-under-pointer`. Decisions: `duo-card-in-hand`, `typography-cochin-and-mono`, `design-parchment-ledger`, `ux-house-rules-govern`.

Deep links: `#s=today`, `#s=failed`, `#s=retried`, `#s=offscreen`, `#s=ride`, `#s=ax5`, `#s=bulk`, `#s=tally`. No hash shows all. Six buttons hide one option each. Every frame is live: "Next tick fails" makes the next save fail, "Run a fast mail day" ticks five rows at 350 ms with the third failing, "Signal" (Pencil until sent only) sends the saved ticks.

Focus ids for the waiting page: `focus-box`, `focus-pill`, `focus-ink` (the failed row in each concept's folded frame), `focus-pointer` (the pointer), `focus-ride` (the riding line), `focus-haptic` (the haptic note).

## Today, read from the code

- A tap writes through `PackagesModel.toggle` then `checkIn` (`native/ManifestKit/Sources/ManifestKit/Packages.swift`). `LedgerStore.commitReceived` saves on the phone and, on a failure, puts the ledger back as it was. So a failed tap leaves the row looking untouched.
- The model keeps one string, `checkInError`, with no card key. Any good save clears it (`checkIn`, `checkInError = nil`), and so does a good stamped-filter read (`toggleStamped`). At speed, the next tick wipes the only sign.
- Three screens draw it three ways: Packages, a footnote sans line on `.regularMaterial` at the bottom (`PackagesView.swift`, `checkin-error`); Tally, Cochin on the card surface (`TallyView.errorBar`); Card in Hand, Cochin red on paper over the top of the answer page (`HandScreen.swift`, `hand-checkin-error`).
- The masthead save slot reads "couldn't save" and flips to "saved ✓" on the next good tick (`Masthead.finished`, `SaveIndicator`).
- A tick with no signal still saves on the phone. The sync client sends later (`SyncClient.armPost`, `lastSyncAt`). Today no row shows whether its tick has reached the sync server.
- The ledger keeps a count and a time per card (`received`, `receivedAt` in `LedgerStore.setReceived`). It keeps no "who ticked". The brief's "who" has no field to draw from.

## Sizes and sources

- `layout.py devices` gives `unknown` for this repo, and `~/.claude/lint/layout.json` gives every device `size: null`. The Duo is drawn at the brief's sizes: folded 466 x 678 pt; open 951 x 669 pt, fold 455.5 to 495.5 pt. Record `duo-card-in-hand` holds an older reading of the outer screen (382 x 644 pt of safe content) that does not agree with the brief. I drew the brief's size.
- Large phone: no size is written in the brief, the layout file or the repo (CI names the iPhone 18 Pro, with no size). It is drawn at 466 x 678 pt, the brief's only portrait size, and the frame can be resized by dragging its corner. Each row holds its height at every width.
- Keys top 405 pt and status bar 20 pt: as in `duo-hand-post-sender.html` and `duo-fold-and-keyboard`; both unmeasured on a device.
- Tab bar: drawn as a 64 pt pill, height unmeasured (a `DuoShellUITests` comment caps the Duo bar at 76 pt).
- Row: `ItemLine.swift`. 4 pt lead, 45 pt check-in frame, 30 pt box with radius 8, 12 pt above and below the text, title Cochin 14 semibold, price Menlo 12, detail Cochin 11.5. The drawing measures every row at 62.6 pt, failed or not, in every concept (headless Chrome, 2026-11-21).
- AX5: Body goes from 17 to 53 pt, so each size is scaled by 53/17 (title 43.6, detail 35.9, price 37.4). Caps at xxxLarge: Body 23 pt, so the Retry label (Cochin 14) is drawn at 19 pt.
- Apple pages read 2026-11-21, each answered 200: Accessibility (44 x 44 pt default control size, 28 x 28 pt minimum; text to at least 200 percent; "Convey information with more than color alone"), Buttons (44 x 44 pt hit region), Layout (respect safe areas), Typography (the iOS Dynamic Type tables: Large default, xxxLarge, AX5).
- Theme: one. The native app is held to light (`native/Manifest/Info.plist`, `UIUserInterfaceStyle` Light; `InterfaceStyleTests`).
- Open Packages is not drawn: today it keeps one page across the fold (`DuoSpread.spreads`, `.packages: false`), and nothing may sit across the hinge. The open pose shows Card in Hand and the Tally spread, the two open screens with line check-ins.

## Items

1. **The failure is keyed to its row.** The model keeps a failed set (card key to the count the tap meant) in place of one string. A row leaves the set only on its own good save. Other rows' saves, a Post and the stamped toggle leave it alone.
   Gain: the sign cannot be wiped by the next tick, which is the silent loss the owner describes. It also closes `stamped-toggle-clears-error` and `hand-stale-checkin-error` by design.
   Loss: a model change in `PackagesModel` and `TallyModel`; a failed row stays marked until the person acts.
   Pick: yes, under every concept. Departs from: `PackagesModel.checkIn` and `TallyModel` clearing `checkInError` on any good save. Owner grant: yes.

2. **The three bars go.** Packages' `checkin-error`, Tally's `errorBar` and Card in Hand's `hand-checkin-error` are removed. The row, the save slot and (as an option) the edge pointer carry the failure.
   Gain: one look on three screens, all in Cochin on the row's own fill. Nothing lies over the sender head or under the Duo bar, which closes `checkin-error-bar-is-sans` and `duo-checkin-error-under-bar`.
   Loss: the raw reason (`error.localizedDescription`) is no longer on screen. It moves to the row's VoiceOver hint (`ux-machine-text-hidden`). See Input Needed.
   Pick: yes. Departs from: the three overlays named above. Owner grant: yes.

3. **Concept: Struck box.** The failed row turns red-soft (`redSoft`) with a 3 pt red bar inside the 4 pt lead. The box gets a dashed red edge and a turn arrow. The detail line reads "Not saved. Tap the box again." ("Not taken back. Tap the box again." for a failed un-tick). The box is the retry: a failed save stored nothing, so the same toggle writes the same count. Red is never alone: the dashed edge, the arrow and the words carry it too (HIG Accessibility).
   Gain: no new control, and no new place to look. The thumb is already on the box. The fastest fix of the three.
   Loss: the box no longer shows the stored state while it is failed (an un-ticked row and a failed un-tick look alike apart from the words).
   Pick: this one, as the default concept.

4. **Concept: Retry at the row's end.** The box keeps the stored state. The price slot gives way to a red Retry button (72 x 44 pt hit frame) at the row's trailing edge. The detail line reads "Not saved at 9:41". Retry writes the count the tap meant; a tap on the box still toggles as usual. At AX sizes, Retry drops to the end of the "Not saved" line so the card name keeps the full width.
   Gain: an explicit named action, and the box never lies. The time ties the failure to the moment.
   Loss: the price is hidden while the row is failed (default size). A second control on the row means a second target to learn.
   Pick: second.

5. **Concept: Pencil until sent.** Every tick shows where it is saved. A dashed green box: saved on this phone, not yet sent. Solid green: the sync server has it (receivedAt is older than `SyncClient.lastSyncAt`). A failed save is the Struck box. The save slot says the count once ("3 not sent"); the rows say it by shape (`ux-label-once`). The dashed edge sets solid in 300 ms when a send lands, the tick's own duration (`motion-the-check-tick-is-written`).
   Gain: it answers "did it actually take" for every tick, not just the rare failed save. No signal at the mailbox is the common case, and today it shows nothing.
   Loss: the most build: the view reads `lastSyncAt` and compares it per card. Sync is ledger-wide, so a row turns solid only after a whole send. A long offline spell leaves many dashed rows.
   Pick: third, or as a later layer on Struck box. Builder must confirm that `lastSyncAt` means the server holds every change saved before it. Owner grant: yes (a new visible state).

6. **Save slot holds the count.** The reserved masthead slot (`masthead-save-slot-reserved`) reads "1 not saved" in red while any row is failed, instead of flipping to "saved ✓" on the next good tick.
   Gain: a fixed place that sums the failures; it costs no space.
   Loss: none beyond a text change; the slot's reserved width must fit "12 not saved" (unmeasured).
   Pick: yes, under every concept. Departs from: `MastheadModel.finished`. Owner grant: yes.

7. **Add-on: Edge pointer.** When the failed row is out of view, a red pointer floats at the list's edge on the side where the row went: "1 not saved ↑". A tap scrolls the row back to the middle. It is an overlay: nothing moves.
   Gain: a failure is found again after the person has ticked on down the list.
   Loss: one more overlay over the list; it can cover part of a row while shown.
   Pick: yes, with any concept.

8. **Add-on: Rides along (Card in Hand).** When the next typed card changes the envelope, the failed line moves with the person: it sits above the new envelope's lines under "From Gamma Cards", with its retry, until it saves or its envelope comes back. It is placed while the answer page is redrawn for the new card, when the finger is on the keys.
   Gain: a failed line on Card in Hand cannot vanish with its envelope.
   Loss: the answer page shows a line from another envelope, which may surprise. A builder must keep it out of Post's count.
   Pick: yes. Owner grant: yes (a line from another envelope on the answer page).

9. **Add-on: Error haptic.** A failed save plays the system error haptic as the box turns red. A good save stays silent.
   Gain: the person ticks without looking; the hand learns of the failure before the eye. Answers `ux-haptics-feel-substantial` for this control.
   Loss: none seen; the app has no haptic today, so this is the first.
   Pick: yes. Owner grant: yes (first haptic in the app).

10. **Writes with no row.** Mark all received and Clear check-ins mark their own bulk row ("Not saved. Tap Mark all again."), which is their retry. A failed stamped-filter read stays at the filter cell, which already reads the old filter (`toggleStamped`). The bulk row is drawn at the card's foot; its real place, under the stamp slot (`native-bulk-check-in`), is unchanged.
   Pick: yes.

11. **Tally spread.** The failed copy is marked on the right page; the name row on the left page gets the red bar and a small dashed box.
   Pick: yes.

12. **AX5.** The failure line drops to "Not saved" at accessibility sizes, so it never needs more lines than the detail it covers; the box stays 30 pt. Precedent: item 106 a (the receipt shows the count alone at the largest sizes).
   Pick: yes.

## Check

- `python3 ~/.claude/lint/check_ios_mockup.py` faults this page, and `duo-hand-post-sender.html` the same way: "a font declaration starts with cochin". The repo rules that Cochin sets words (`typography-cochin-and-mono`), and the house tokens file allows a brand font in content. The safe-area and Duo-frame parts pass. See Input Needed in the report: this is a possible false alarm in the check.
- Design review on my own page: `native` for the frames (system tab bar, keyboard, 44 pt targets, no hover or web footer). Each control on a row has a 44 pt hit frame.
