# Sync trust: Recent as a change feed

Mockup: `sync-trust-directed-2.html`. Designer kind: directed. Direction: change feed, a readable timeline of what each device changed. Debts in scope: `native-merge-notice-unbuilt`, `native-kept-copy-has-no-route`, `native-masthead-stale-after-tabs`.

The person's question: "Did my phone and my laptop actually agree?" Both concepts answer it in the same place first: a fixed slot at the top of Recent that reads the agreement clock (`ruled-head-stale-clock-agreement`). Then they show what each device changed, sync by sync.

## Deep links

- States: `#s=feed`, `#s=lost`, `#s=kept`, `#s=stale`, `#s=frozen`, `#s=uncounted`, `#s=names`, `#s=notice`, `#s=tabs`. No `s` shows all.
- Concept: add `&c=columns` (Facing columns) or `&c=receipts` (Sync receipts).
- Text size: add `&z=default` or `&z=ax5`. AX5 frames sit in `feed` and `notice`.
- Example: `#s=lost&c=receipts`. The Cull buttons hide one option each. "Reset every frame" puts each frame back to its start.
- Every frame is live: rows, rules, receipts, Undo, Check it in again, History, Restore, Share, the slip, the advisory line and the tab bar all respond.

## Sizes and sources

- `layout.py devices` prints `unknown` for this repo. Sizes come from the brief: Duo folded 466 x 678 pt, Duo open 951 x 669 pt with the fold at x 455.5 to 495.5 pt. The folded size differs from the 382 x 644 pt outer-screen reading in `duo-card-in-hand`; the brief's size is drawn.
- Large phone: no size is written anywhere. It is drawn at 400 x 860 pt as a stand-in, not a measurement.
- Status bar foot and home indicator: unmeasured, drawn at the 20 pt floor of `DuoHandUITests.statusBarFloor`. The system tab bar is drawn 50 pt tall, an estimate. The open Duo pill is 64 pt, 24 pt in from the page edges and 12 pt up (`DuoSpine.swift`).
- Type: Cochin sets words, Menlo sets numbers (`typography-cochin-and-mono`); iOS chrome uses the system font. Sizes come from `LedgerTab.swift`, `SyncViews.swift` and the Recent record. AX5 scales each style by its own ratio from the HIG Dynamic Type tables: Body 17 to 53, Footnote 13 to 44, Caption 1 12 to 43, Caption 2 11 to 40, Title 3 20 to 55, Callout 16 to 51.
- Theme: one. The native app is held to light (`design-parchment-ledger`).
- Data shapes: the merge sentence is `mergeSummary` (`src/merge-rules.mjs`), word for word. Stats are its seven counts. Rows are Recent entries (`src/recent-rules.mjs`: kind, key, before, after, at). The kept-copy sentence is `LedgerNotice.damagedLine`. The Sync row and panel copy is `SyncPanel` (ManifestKit).
- Apple pages read 2026-11-21, each answered 200: Layout (safe areas, size classes), Typography (Dynamic Type tables), Accessibility (44 x 44 pt controls, 11 pt minimum text, text to 200 percent), Buttons (44 pt hit region), Sheets, Lists and tables, Tab bars, Toolbars.
- Measured in headless Chrome on this page: 59 frames, 354 scripted taps, no script error. No element crosses the fold. Every button is at least 44 x 44 pt at the default size.

## Items

1. **Concept: Facing columns** (`#s=feed&c=columns`, focus `focus-columns`). This phone writes in the left column, the other device in the right, time runs down. A thick rule marks each sync the server agreed to, with its time, what went out and what came in. On the open Duo the two pages are the two devices, and each rule sits level on both pages; the pages scroll together. Gain: "what each device changed" reads at a glance, and the open Duo makes the metaphor literal. Loss: folded and on the phone, half of each row is an empty lane, so names cut early (about 200 pt per column). At AX5 the columns become one list with a device label per row.

2. **Concept: Sync receipts** (`#s=feed&c=receipts`, focus `focus-receipts`). One receipt per sync, newest first. Solid edge: came in. Dashed edge: went out. The server's sentence leads, then up to three named rows, then "All n changes". Folded and on the phone, a tap pushes the receipt; on the open Duo the list sits on the left page and the receipt on the right. Gain: full width for names, and the merge sentence is the headline the person already reads on the web. Loss: the device split is a label, not a place.
   - Pick: Sync receipts. The folded pose, held in one hand, is the first device, and Facing columns spends half its width there. Facing columns is the stronger open-Duo picture; a hybrid (receipts folded, facing pages open) is possible but is two layouts to build.

3. **Recent is the feed's home.** Both concepts extend Recent, not a new screen (`building-one-home-per-capability`). Rows keep Recent's words, its UNDO cell and its end states (`recent-checks-can-be-undone`). Gain: one list for "what changed" and "undo it". Loss: Recent gains two things it rules out today.
   - Departs from: `recent-checks-can-be-undone`, "A row does not say which device wrote it" and "Not logged: a merge or live apply". The feed shows the device and draws each sync as a rule or a receipt.
   - Owner grant: yes.

4. **Recent opens as a pushed screen** with a back button, not as a panel under its row. Gain: room for a timeline on a 678 pt screen; native navigation. Loss: the Ledger tab no longer holds every option in place.
   - Departs from: `recent-checks-can-be-undone`, "Its panel opens below it in the page flow". Recent's native client is unbuilt (debt `recent-log-unbuilt`), so nothing built moves.
   - Owner grant: yes.

5. **Who wrote a row** (`#s=names`). Options: this device's own record (pick, focus `focus-names-local`): the device keeps a list of the Recent ids it wrote, and any other id is the other device's. Columns read "This phone" and "Other device". Or named in each entry (focus `focus-names-named`): each entry carries the writer's name, so both devices read "Duo" and "Mac". Gain of the pick: the saved ledger does not change. Loss: it cannot name a third device, and a reinstall forgets which rows were its own. Gain of names: true on every device. Loss: a new field in the saved ledger.
   - The pick needs a device-local list, and the receipts need a device-local list of syncs (time, the seven counts, the Recent ids that arrived). Both sit outside the ledger, like `workerSyncedAt`. That is a new native file or store (`native-files-are-frozen`).
   - Named devices change `saved-state-shape`, an invariant.
   - Owner grant: yes, for either.

6. **Counts are whole; rows may not be** (`#s=uncounted`). A sync's counts come from the server's `stats`. Recent may name fewer changes: it keeps 14 days and 200 rows, an older build writes none, and applies and restores write none. The receipt and the rule show the server's counts, and a manila line says how many changes have no row. Gain: the feed never under-reports (`ux-statements-are-true`). Loss: one more line in that case. Owner grant: no.

7. **The agreement slot.** A fixed 44 pt slot at the top of Recent (120 pt at AX5, short words) reads `workerSyncedAt`: "Both devices agreed with the server at 14:32". Stale: manila, "Last agreed with the server Nov 16, 9:12 AM". The slot's height never changes, so a change of words moves no row. "Both devices" is true only when the other device's latest change has come in; the server holds both, so the last agreement after the other device's last POST makes it true. Unmeasured whether the client can tell that; if not, the words become "This phone agreed with the server at 14:32". Owner grant: no.

8. **Frozen at open** (`#s=frozen`). A sync that lands while Recent is open adds no row, as Recent freezes its rows (`no-layout-shift-under-pointer`). The slot changes its words to "Another sync landed at 14:35" and offers Show it, the one act that adds the rows. Gain: nothing slides under the thumb, and the person still learns that the screen is behind. Loss: one tap to see it. Owner grant: no.

9. **Where the merge notice shows** (`#s=notice`). This closes `native-merge-notice-unbuilt`. The words are `SyncClient.mergeNotice`, shown only when a merge added or removed something.
   - Slip above the tab bar (pick, focus `focus-slip`): an overlay docked over the list, with a cross to dismiss and no timeout, as the web notice has none. A tap opens Recent on that sync. The list gains a bottom inset while it shows, so its last row can scroll clear. Gain: no row moves. Loss: it covers the bottom rows until dismissed, and a tap meant for a bottom row right after a sync can land on it (the press gate holds the apply only while a finger is down).
   - Line in the list (focus `focus-line`): the web's place, under the masthead, with Dismiss (`src/app.jsx`, `importMsg` and `Notice`). The web scrolls to keep the row in view (`anchorRef`); the native list has no anchor, so the cards drop by the line's height. It breaks `no-layout-shift-under-pointer` on native.
   - Badge on Ledger (focus `focus-badge`): no sync words on the working screen. The Ledger tab gains a badge, and Recent's row reads "1 sync to read". Gain: calmest, and it keeps `ruled-head-one-advisory-entrance`'s happy path silent. Loss: the person must look for it; the Orphaned tab already uses a badge for a count.
   - Departs from: the web's place, the line in the page. Not blocking.
   - Owner grant: no.

10. **The copy that lost** (`#s=lost`). When a sync removes a change this phone made, its rule or receipt turns red, the lost row is struck, and the detail shows what lost (time, device) and what won (later time). Two ways back: "Check it in again" writes a new, later check-in, which travels like any tap and wins by time (`merge-later-change-wins`, `undo-removes-only-its-delta`). "Open the version before this sync" opens History on the milestone taken before a removing sync (web: `takeVersion("before sync", "milestone")` in `src/app.jsx`; native refuses a removing reply with no milestone, `milestones-taken-before-risk`). Restore keeps its two-tap ask, and a line says a restore replaces the whole ledger. Owner grant: no.

11. **The kept copy** (`#s=kept`). This closes `native-kept-copy-has-no-route`. The mended-load line on Packages (`LedgerNotice.damagedLine`) becomes a button. It opens Recent on a manila "Mended on open" row, whose one act is "Share the kept copy", through the same share sheet Backup uses (`ShareSheet` in `LedgerTab.swift`). The sheet names it "Kept copy of the ledger", never by file name (`ux-machine-text-hidden`). The kept copy and the lost copy never share a control or a colour: manila for kept, red for lost.
    - Departs from: the line is plain text today (`native-ledger-is-raw-json`, Notice line). Not blocking.
    - Owner grant: no.

12. **Stale sync** (`#s=stale`). After 24 hours with no agreement, Packages shows the web's advisory line, "Not backed up since Nov 16 — tap to fix" (`ruled-head-one-advisory-entrance`, case 4). Its tap opens the Ledger tab with Sync open, as ruled, and the Recent row there reads "14 not sent". In Recent, the changes only this phone holds sit above the "Last agreed" rule with an amber edge (Facing columns), or in a "Not sent yet" receipt on top (Sync receipts). Native has no stale case today (`SyncPanel.row` comment). Product code; for a builder. Owner grant: no.

13. **Packages after a Tally check-in** (`#s=tabs`). Today Packages reads old counts until its own next check-in or a restart. Pick: reload Packages on every write that moves a check-in, as the debt says. No badge and no "old figures" stamp: a stamp would be a bandaid for a defect. Product code; for a builder. Owner grant: no.

14. **Recent spreads on the open Duo.** Gain: the list beside its receipt, or the two devices facing each other. Loss: the Ledger tab no longer stays one page.
    - Departs from: `DuoSpread.spreads` (`.ledger` is false) and `duo-card-in-hand`, item 24, "Ledger stays full width".
    - Owner grant: yes.

15. **AX5.** Rows let go of their fixed 72 pt height, and Facing columns becomes one list with a device label on each row. The navigation bar and tab bar keep their size, as iOS bars do, and offer the large content viewer. Gain: nothing is cut at the largest size. Loss: rows differ in height at AX5.
    - Departs from: `recent-checks-can-be-undone`, "Every row has the same fixed height".
    - Owner grant: yes.

16. **End states on a row.** An end state takes the label's place on the row's top line, so the row keeps three lines: "Checked, lost", "Un-checked, won", "Checked in again", "Checked, undone". A row only on this phone keeps its label in amber with an amber edge, and its VoiceOver label says "only on this phone". Owner grant: no.

## Design review applied to this mockup

- Structure: new. Recent gains a pushed screen, the slip is new, and the open Duo spreads the Ledger tab.
- Native or web-like: Sync receipts, native (navigation bar, list, push, system share sheet); its rounded receipt cards lean web-like. Facing columns, native in its chrome; the two-column grid is custom.
- `check_ios_mockup.py`: one fault, `system-font`, because content is set in Cochin. Cochin is the app's ruled content face (`typography-cochin-and-mono`), and the repo's earlier mockup `duo-hand-notice-match.html` gets the same fault. Possible false alarm: the check cannot tell content type from chrome type.
- `label_once.py` on three rendered frames: no hits.

## Critique (impeccable, single context, native: design review only)

Heuristics, 0 to 4: status 4, real-world match 3, control and freedom 3, consistency 3, error prevention 3, recognition 3, efficiency 2, minimalism 3, error recovery 4, help n/a (no help surface). Total 28/36.

- Fixed: the sync rules repeated "Agreed" under the slot's "agreed" on every rule; rules now read "Sync 14:32", and only the stale rule reads "Last agreed".
- Fixed: the amber "only here" label wrapped in a folded column and cut the seller line; the label stays, and the amber edge and VoiceOver label carry the state.
- Fixed: the kept row sat above a later sync; rows now run by time.
- Fixed: the open-Duo pages drifted out of level when a row opened; the facing page now holds a hidden copy of each row and merge.
- Fixed: stamp and envelope rows had no UNDO; Recent undoes them, so they have it.
- Open: Facing columns spends half its width on an empty lane when folded (item 1). Not fixable without losing the concept's point.
- Open: the slip can take a tap meant for a bottom row right after a sync (item 9).

## Input needed

- The Owner grant items: 3, 4, 5, 14, 15.
- The large phone has no written size. Which size should the next pass use?
- Critique questions: Should Recent's top slot say "Both devices" only when the client can prove the other device's last change came in (item 7)? Is the hybrid (receipts folded, facing pages open) worth its two layouts (item 2)?
