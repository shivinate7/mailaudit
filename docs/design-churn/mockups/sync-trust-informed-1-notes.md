# Sync trust: notes (informed designer 1)

Mockup: `docs/design/sync-trust-informed-1.html`. Designer kind: informed. Two options, Slip and Postmark, plus Today for comparison. Every frame is live: tabs, rows, the slip, the postmark, History, Restore and Share all respond to taps. Every figure is sample data.

## The pain

The owner asks: "Did my phone and my laptop actually agree?" Today the native app cannot answer.

- A merge lands with no word. `SyncClient.mergeNotice` holds the sentence, and no screen shows it (debt `native-merge-notice-unbuilt`).
- When the other device's later change wins, this phone takes a `before sync` milestone (`LedgerStore.swift`, the `put(... label: "before sync" ...)` call). Nothing points to it, so the losing copy is hard to find.
- The damaged-load line says "the original is kept on this device", and nothing opens it (debt `native-kept-copy-has-no-route`).
- A Tally check-in leaves Packages on old rows (debt `native-masthead-stale-after-tabs`).
- Native has no 24-hour stale line. `SyncPanel.row` says so: "The web's syncBroken has two more causes the native client does not have yet (a stale clock, unreadable photos)."

## Devices and sources

- Duo folded: 466 x 678 pt, from the brief. Record `duo-card-in-hand` gives a different outer screen (382 x 644 pt of safe content, from one short reading). The brief wins here; re-read the fold in the build.
- Duo open: 951 x 669 pt, fold from x 455.5 to 495.5, from the brief.
- Large phone: neither the brief nor `layout.py devices` gives a size (the repo has no `kind`, so the device list reads `unknown`). It is drawn at 466 x 678 pt, the brief's one phone size. See Input Needed in the report.
- AX5: the folded pose, at the AX5 sizes of Apple's typography table.
- Theme: the native app is held to light (`design-parchment-ledger`, `UIUserInterfaceStyle`). So the app frames have one theme. `t=dark` changes only the page around the frames.
- Apple pages read 2026-11-21, each answered 200, as JSON under `developer.apple.com/tutorials/data/`: layout (safe areas, size classes), typography (Dynamic Type tables: Large default Footnote 13, Body 17, Caption 1 12; AX5 Footnote 44, Body 53, Caption 1 43), accessibility (44 x 44 pt default control, 28 x 28 pt minimum, text to at least 200 percent), buttons, tab-bars (a tab bar floats at the bottom and is for navigation, not actions).
- Status bar foot: drawn at 20 pt, the UI tests' floor, unmeasured on the Duo, as in `duo-hand-post-sender.html`.
- Tab bar: drawn as the 64 pt pill of the open Duo's bar (`DuoSpine.swift`). The system tab bar's real height is not on any page read.

## Choices

1. **Packages reads every write.** Both options reload Packages after a Tally check-in, as the web does (`three-views-share-one-switch`). Nothing is drawn for it: the right outcome is that no screen holds old rows. Gain: the stale-row bug goes, with no new mark on screen. Loss: none to the owner; the builder owes a test per write path (the debt says so). Pick: yes, in both options. Owner grant: no (it closes a debt under a ruling that stands).

2. **The 24-hour stale line comes to native.** The manila advisory line gets the web's case 4: "Not backed up since Nov 19 — tap to fix". A tap opens Ledger with Sync open, as the 401 and 413 lines do (`ruled-head-one-advisory-entrance`, `SyncAdvisoryLine`). The Sync row reads "Not backed up since …" with the value Check. Gain: a phone that quietly stopped agreeing says so. Loss: none; it ports a ruled web case. Pick: yes, in both options. Owner grant: no. The copy is the web's `syncSays` stale copy; the date form follows the web.

3. **Slip: the merge notice is the web's Notice, under the letterhead.** A greenSoft slip with a green hairline, in the bundle's `mergeSummary` words, with Dismiss (✕, 44 pt) (`Notice` in `src/app.jsx`; the web shows `importMsg` above every working view). It shows on Packages, Tally and Orphaned until dismissed. It shows only when the merge changed something, the gate `mergeNotice` already has. Gain: a port with no new words. Loss: the slip enters above the list when a reply applies. The apply already waits for no press (`auto-apply-happens-now`), and the web keeps the row in view still by scroll anchoring; native must do the same, or the list moves under a resting thumb. Pick: yes, as the default. Owner grant: no.

4. **Slip: Changes lists the changed cards.** A Changes control on the slip lays a ruled panel over the list, with paper fill (`head-panels-carry-paper-fill`, `motion-disclosure-panels-arrive`): one row per card, "+1 in" in green or "un-checked" in manilaInk, and a line on why the later change won. On the open Duo the panel takes the right page, so the left list never moves. The control is its own way out (as `sync-line-toggles-its-panel`), with a second Close at the panel foot in thumb reach. Gain: the owner sees which cards moved, not only counts. Loss: `stats` holds counts only, so the device must diff the ledger it held against the one it adopts, at adopt time. That is new client logic, local only, with no Worker change. Departs from: the web, which shows the count sentence only (`mergeSummary`). Pick: yes. Owner grant: yes.

5. **Slip: the copy that lost is the `before sync` milestone, one tap from the panel.** When the merge removed something, the panel ends with "Your copy from just before this merge is saved in History as *before sync*" and Open in History. That opens Ledger, History, with that row open and marked, and Restore this version. Restore keeps the two-tap ask, in the native words: "Tap again to replace N cards" (`VersionNotice.restoreAsk`, `no-native-dialogs`). Gain: the losing copy is found and put back with the controls that already exist. Loss: a restore re-stamps and travels to the other device (`restampRestore`); the owner must want that. Pick: yes. Owner grant: no (a route to an existing control).

6. **Slip: the kept copy gets Share.** The damaged-load line on Packages gains Share it, which opens the system share sheet with the kept file, as Backup does (`LedgerStore.backup`, then `SharedFile` and `ShareSheet` in `LedgerTab.swift`). A Kept copy row under Backup on the Ledger tab keeps the route after the line is gone (`recovery-control-not-state-gated`). The kept copy is never restorable from here: it is the damaged original. Gain: closes `native-kept-copy-has-no-route`. Loss: one more Ledger row while a kept copy exists. Pick: yes. Owner grant: no.

7. **Postmark (bold): the letterhead shows the last agreement.** A round postmark sits right of the seal, in a fixed 60 x 60 pt box: "Agreed 2:02" in accent, with cancel lines. After 24 hours with no agreement it turns manila and reads "Since Nov 19". After a merge that changed something it lands again (`motion-the-stamp-lands` register) and carries a count. A day other than today shows the date, not the time. Gain: the owner's question has an answer on every working view, at a glance, with no tap. Loss: it breaks the ruled quiet path: "On the happy path, no sync vocabulary appears on the working screens" (`ruled-head-one-advisory-entrance`). It also adds a part to the one letterhead (`masthead-is-one-letterhead`), and the stale case shows twice, on the postmark and on the advisory line. Its text keeps the default size at every text size, with the large content viewer on a long press, as the open Duo's bar does (`duo-card-in-hand`). Departs from: `ruled-head-one-advisory-entrance`, `masthead-is-one-letterhead`. Pick: offered, not my pick. Owner grant: yes.

8. **Postmark: the Docket.** A tap on the postmark opens the Docket: a sheet on the folded Duo and the phone (Done on the trailing edge), and the right page on the open Duo. It says when this phone and the server last agreed, then lists the merges kept on this device, newest first, each with its changed cards, who won each clash, and Restore this version for the copy before. Kept copies sit at its foot with Share. Gain: one place answers "what changed, what lost, and can I get it back". Loss: a merge log is new device-local state, kept beside ledger.json, never in the ledger, so `saved-state-shape` holds; it needs a size cap and a test. Pick: offered with choice 7. Owner grant: yes.

9. **Open Duo: Packages takes the left page; a panel takes the right.** Today Packages keeps one layout on the open Duo (default, not owner, `duo-card-in-hand`). Here the list sits on the left page, the third card on the right, and the Changes panel or the Docket replaces the right page when open. Ledger lays its rows on the left and opens Sync or History on the right, so nothing sits across the fold, as the brief asks. Gain: a panel never covers the list under the thumb. Loss: Packages and Ledger change shape on the open Duo. Departs from: `duo-card-in-hand` (Packages does not spread; Ledger stays full width). Pick: yes. Owner grant: yes.

## Self-check (skill `design-review` on this mockup)

- iOS check: `check_ios_mockup.py` reports one fault, `system-font`: Cochin is declared. Cochin is the repo's ruled word font, native included (`typography-cochin-and-mono`, `Font.cochin`). The app chrome (status bar, tab bar, sheet bar, share sheet) is set in `-apple-system`. The repo's own Duo mockups give the same fault. Safe areas and both Duo frames, folded first, pass.
- Native or web-like: native. A system tab bar, a sheet with Done trailing, the system share sheet, 44 pt targets, and the two-tap ask in place of a dialog. One web habit stays on purpose: the underlined mono disclosure value (`disclosure-cells-underline-value`).
- Taps: a headless Chrome run tapped every route in each option on the folded Duo, the open Duo and the phone, and the AX5 slip. All 54 checks passed, with no script error. The page has no horizontal scroll at 375 px.
- Structure: Slip keeps today's tabs and first screen (`same`). Postmark adds a new entrance to the letterhead (`new`).

## Critique (impeccable `critique`, native method, run 2026-11-21)

Fixed in the mockup:
- The armed Restore used made-up words; it now uses `VersionNotice.restoreAsk` ("Tap again to replace 10 cards").
- The postmark's text touched its ring; the ring grew to 58 pt in a 60 pt box.
- The Changes panel ran under the tab bar; its height now stops above the bar.
- The open Duo's Ledger right page was blank; it now says "Sync and History open on this page."
- Buttons lost their padding to a broad selector; fixed.

Left open:
- "Agreed" does not say with what. The Docket says "this phone and the server", but the postmark alone may read as "phone and laptop". Two devices agree only through the server, so it is true in effect, not in words.
- The Slip's Changes and the History route take three taps to reach Restore. A Restore button in the panel itself would take two, at the cost of a second home for Restore (`building-one-home-per-capability`).
- Questions for the owner are under Input Needed in the report.
