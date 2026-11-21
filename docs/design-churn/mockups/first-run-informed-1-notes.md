# First run, informed designer 1: notes

Designer kind: informed. Mockup: `first-run-informed-1.html`. Deep links: `#c=steps&s=<state>` and
`#c=practice&s=<state>`. Every figure, seller, order and key on the page is sample data.

## The pain

A new person opens MANIFEST and says "I don't know what this wants from me." Today the native app
opens on the Ledger tab (`native/Manifest/RootView.swift`, `startTab` defaults to `.ledger`). The tab
shows options, not a task. Its only lead is the Sync row: "This device has no sync key" and "Set up"
(`ManifestKit/SyncPanel.swift`, `SyncPanel.row`). Packages shows nothing, Tally says "Nothing to show."
(`TallyView.swift`, `empty`), and Orphaned says its one empty line (`Orphaned.swift`,
`OrphanedNotice.emptyLine`). No screen says where orders come from, or what a package, a card or an
envelope is. The phone cannot read the CSV (`csv-import-stays-web`), so the person must find out that
the file goes in on a computer.

## Concepts

1. **Ruled steps** (`choice-steps`). Three ruled rows at the top of the Ledger tab: Bring your orders
   in, Open your packages, Tick a card you hold. The three words sit under them. Orders arrive through
   the sync link the app already reads (`native-key-via-url-scheme`): the Camera scans a code the web
   app shows.
   - Gain: keeps the opening tab and every ruling but one (item 4). Uses the ruled-head vocabulary
     (`ruled-head-masthead-vocabulary`): hairline rows, Cochin titles, underlined values.
   - Loss: the person still walks to a computer first. Nothing is ticked until orders arrive.
   - Pick: yes, as the safe default.
2. **Practice package** (`choice-practice`), the bold one. The app opens on Packages with a practice
   package that is never saved. The person ticks three sample cards in the first ten seconds. Each
   tick fills one reserved slot with one word's meaning. Then the phone opens the CSV itself and goes
   straight to the mail in hand.
   - Gain: teaches by doing (HIG Onboarding, "Teach through interactivity"). The first tick happens
     before any data exists. No computer step when the CSV is already on the phone.
   - Loss: departs from two rulings (items 5 and 6). A practice package must never reach the ledger.
   - Pick: yes, if the owner grants item 5. Without item 5 it still works, with the link path only.

## Choices

1. **Steps live on the Ledger tab, not a new screen.** Gain: no new navigation; the tab that opens
   today gets a task. Loss: the steps push the Data rows down while they show. Pick: yes (Ruled steps).
2. **The three words: package, card, envelope.** Package: "What one seller sends for one order"
   (`packages-group-by-order-seller`). Card: one line in a package, the item line in code. Envelope:
   the mail you open, as Mail day uses it (`HandScreen.swift`, "This envelope", "New envelope"); one
   with no sender goes to Orphaned (`orphan-entry-takes-one-input`). Gain: one plain name each
   (ux-one-plain-name). Loss: "card" is not the code's word. Pick: yes, both concepts.
3. **Reset is absent while the ledger is empty.** On an empty ledger it changes nothing
   (ux-control-earns-place). Gain: no destructive row in the first minute. Loss: none found. Reset
   still arms in place once data exists (`armed-reset-takes-the-row`). Pick: yes.
   Departs from: `src/app.jsx` and `LedgerTab.swift` show Reset at all times.
4. **The web app shows a phone code.** A "Show phone code" control on the web draws a QR of
   `manifestledger://sync#k=<key>`, as `scripts/send-key.mjs --native` does today from a terminal.
   Gain: a new person needs no terminal. Loss: the device key shows on a screen as a code.
   `the-token-is-a-credential` keeps the key out of React state, so the web control must read it from
   storage and draw it outside React. Pick: yes. **Owner grant: yes.**
   Departs from: `scripts/send-key.mjs` is the only code maker; the web has no such control.
5. **The phone opens the CSV file** through the system file picker. The native rules bundle already
   holds `parseItems` (`native/ManifestKit/Sources/ManifestKit/rules.js`, the same build the web runs).
   So the parser keeps one home. `mergeItems` would join the bundle. Gain: orders in within a minute
   with no computer step. Loss: a second import entrance to prove under `imports-merge-never-replace`.
   Pick: yes. **Owner grant: yes.**
   Departs from: `csv-import-stays-web` ("The native client has no CSV import and no upload zone").
   Its stated reason, "A Swift port of the importer would give it a second home", may be stale: no
   Swift port is needed. Unmeasured: whether JavaScriptCore parses a large export fast enough.
6. **The app opens on Packages while the ledger is empty** (Practice package only). Gain: the first
   screen holds a task. Loss: changes the opening tab. Pick: only with Practice package.
   **Owner grant: yes.** Departs from: `RootView.swift` `startTab`, Ledger first.
7. **The practice package is never saved.** It lives in view state only, carries the band "Practice ·
   not saved", and leaves when real orders arrive. Gain: `saved-state-shape` and
   `imports-merge-never-replace` hold untouched. Loss: a person who leaves mid-practice starts again.
   After the first import it moves to Ledger › Help (HIG Onboarding: findable later). Pick: yes.
8. **Reserved slots for every first-day hint.** The hint, the practice slot and the RECEIVED stamp
   change text in a box of fixed size; the stamp lands in the pill's slot. Gain: a tick moves nothing
   (`no-layout-shift-under-pointer`, `card-the-action-row-is-reserved`). Loss: the slot holds three
   lines of space when it says one. Pick: yes.
9. **Answers at the press.** The import summary, the wrong-file error and the reading line replace the
   bring-in block in place (ux-answer-at-press). The summary keeps today's web text, "Imported N lines
   across your orders." (`csv-import-shows-a-summary`), and adds "Nothing was removed." Pick: yes.
10. **A wrong file says what it is and changes nothing.** "budget.csv is not an OrderWand CSV.
    Nothing was added or changed." The column list sits behind "What the file held"
    (ux-machine-text-hidden), and "Choose another file" leads on (ux-no-dead-end). Pick: yes.
11. **A refused key reads as "needs your key", never as lost** (`nothing-recovers-without-the-key`).
    The row keeps today's text, "This device's sync key was refused", and leads to a fresh scan.
12. **A long read has Stop** (ux-long-run-stops), on "Bringing your orders in" and on "Reading".
13. **Folded Mail day.** Mail day is two pages only today (`HandScreen.swift`, `twoPages`). On the
    folded Duo and the phone, "Start with the mail in hand" opens Packages with the Find field and
    shows only the typed card (`search-filters-inside-package`). The open Duo shows Mail day with its
    Post offer. Pick: yes; no new screen.
14. **Step labels reuse "Set up".** Step 1 and the Sync row both say "Set up" and open one sheet, so
    one act has one name (ux-one-plain-name). Loss: ux-label-once counts the word twice. Pick: keep.

## Devices and sources

- `python3 ~/.claude/lint/layout.py devices <repo>` prints `unknown`. The Duo sizes come from the
  brief: folded 466 × 678 pt, open 951 × 669 pt, fold 455.5 to 495.5. The large phone has no written
  size, so it is drawn at 466 × 678 pt and resizes by its corner.
- Status bar foot: unmeasured; drawn at the 20 pt floor that `duo-hand-held-box` uses.
- Tab bar: the open Duo uses the app's bar under the right page, 64 pt pill, 12 pt lift, 24 pt inset
  (`DuoSpine.swift`, `DuoBarMetrics`, `DuoBar`). Folded and phone draw the system bar at that size,
  unmeasured. Bar labels stay at the default size, as `DuoBar` caps them.
- One theme: the native app is light only (`native/Manifest/Info.plist`, `UIUserInterfaceStyle`).
- Apple pages read 2026-11-21, each answered 200: HIG Onboarding, Typography (AX5 sizes: Body 53,
  Headline 53, Title 2 56, Subhead 49, Footnote 44, Caption 1 43; default Body 17), Accessibility
  (44 × 44 pt controls), Buttons, Sheets (Cancel on the leading edge), Tab bars, Layout.

## Checks

- `check_ios_mockup.py`: one fault, `system-font`, because content is set in Cochin. The repo rules
  Cochin for words (`typography-cochin-and-mono`), and the app sets it (`.cochin(...)` in every view).
  `duo-hand-held-box.html` and `duo-hand-gaps.html` on main fail the same way. Possible false alarm:
  the check reads app content type as chrome type. Chrome (status bar, sheets, file picker) uses
  `-apple-system`.

## Input needed

- Item 4, web phone code: Owner grant: yes.
- Item 5, phone opens the CSV: Owner grant: yes.
- Item 6, open on Packages while empty: Owner grant: yes.
- How a new person, not the owner, gets a device key at all. No in-app flow issues one today
  (`nothing-recovers-without-the-key`). Both concepts assume the key already sits on the computer.
