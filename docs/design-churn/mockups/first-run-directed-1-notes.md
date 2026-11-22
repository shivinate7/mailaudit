# First run, directed designer 1: notes

Designer kind: directed. Direction: one-gesture start: a single action gets data in; teach nothing up front.

Mockup: `first-run-directed-1.html`. Deep links: `#c=blank&s=<state>`, `#c=slot&s=<state>`, `#c=today&s=today`.
States: `empty`, `picker`, `cancelled`, `wrongfile`, `checking`, `arrive` (Mail Slot), `landed`, `ticked`, `envelope`,
`tally`, `ledger`, `again`, `daylater`, `nogrant`. Add `&d=0` to `envelope`, `tally` or `ledger` to show it before any
order is in. Add `&hide=<option ids>` to hide options, and `&drop=blank` or `&drop=slot` to hide a concept. Each
state draws four frames: the Duo folded, the Duo open, a phone, and the Duo folded at AX5. Light only (item 21).

No shift, measured: a headless Chromium run records the box of each line, package, sheet text, slot text,
receipt and slip in all four frames. Between landed and ticked (both concepts), and between empty and
cancelled, wrong file and checking, no box moves more than 0.5 px. A control pair (landed and again) does
show the move, so the measurement can see one. Each text that can change sits in a reserved stack. That
is one grid cell holding every text the slot can show, with only one visible, so the slot keeps the
height of its longest text from the first frame.

Every figure, seller, card and file name in the mockup is sample data.

## Concepts

1. **Blank Page.** The first screen is the letterhead and one ruled sheet. The whole sheet is the control:
   "Open your order file". A press opens the system document picker. A pick imports at once. Focus id:
   `blank-page-start`.
   - Gain: one press and one pick. The screen asks one thing and claims nothing.
   - Loss: the file must already be on the phone. When it is not, the person learns that only after the
     picker (item 6).
   - Departs from: `UploadZone` in `src/app.jsx` (the emoji, "Drop your OrderWand CSV here", the OrderWand
     how-to line and the "Choose file" button). The how-to line and the emoji go. On the web, the whole
     sheet stays a drop target, so drag and drop is kept.
   - Pick: yes, first.
2. **Mail Slot.** The first screen holds a mail slot and one sentence: "Send your OrderWand file to this
   phone. It lands here." The gesture happens outside the app. The person AirDrops or shares the file from
   the computer, and iOS offers "Open with Manifest". The import runs with no tap in the app. One control,
   "Choose it in Files", opens the same picker as Blank Page. Focus id: `mail-slot-start`.
   - Gain: no in-app press when the file arrives by share. It answers "the file is on my computer" head on.
   - Loss: the native app has to declare the CSV file type. The iOS "Open with" sheet is drawn from
     memory and is unverified. A web app on iOS cannot be a share target, so on the web this concept
     shrinks to its Files control.
   - Owner grant: yes (a new native file type, under item 3).
   - Pick: second.

## Choices shared by both concepts

3. **The native app imports a CSV.** Owner grant: yes.
   - Departs from: `csv-import-stays-web`, and the `native-parity-table` row "CSV import and the upload zone:
     web-only".
   - One home is kept. `parseItems` already ships to native in `native/ManifestKit/Sources/ManifestKit/rules.js`
     (`RULES_OUT` in `build.mjs`). The CSV row split (`Papa.parse` in `handleFile`, `src/app.jsx`) is not
     in that bundle. Its home would be a CSV splitter added to the rules bundle, so the web and native call
     one parser and one `mergeItems`.
   - Without the grant: the native app draws state `nogrant`. One sentence says the phone has no sync key
     and so cannot load its orders. It never says there are no orders (`nothing-recovers-without-the-key`).
     One control, "Open the web app", leads on.
   - That fallback is a dead end for a new person. The key reaches a phone only through
     `scripts/send-key.mjs` (`native-key-via-url-scheme`), and no screen links a phone. So the fallback is
     evidence for the grant, not an alternative to it.
   - Gain: the first minute works on the phone the person holds. Loss: one more reader of the parser rule.
4. **First launch opens on Packages.**
   - Departs from: `RootView.startTab` in `native/Manifest/RootView.swift`, which opens on Ledger. The web
     already opens on Packages (`useState("packages")` in `src/app.jsx`).
   - Gain: the control and then the first package sit where the work happens.
   - Loss: none known. Reset and Re-import stay one tap away on Ledger (`recovery-control-not-state-gated`).
   - Pick: yes.
5. **The receipt.** After the import, a receipt takes the sheet's place, at the press
   (`ux-answer-at-press`). It reads "412 cards came in, in 63 packages from 41 sellers. Nothing here was
   removed. Tick each card as it arrives." A second import of the same file keeps today's copy: "No new
   lines — everything in that file was already being tracked." (`handleFile`).
   - Owner grant: yes. This changes the copy that the `csv-import-shows-a-summary` "Holds while" line
     names ("Imported N lines across your orders.").
   - The receipt has no dismiss. It stays for the session, so no row ever moves under the thumb
     (`no-layout-shift-under-pointer`). Departs from: today's dismissable import `Notice` (`importMsg`,
     `src/app.jsx`).
   - Loss: about 110 pt of the folded screen for the first session. At AX5 the receipt fills the first
     screen, and the person scrolls to the first package.
   - Pick: yes.
6. **The picker-cancel tip (Blank Page).** When the picker closes with no file, one line appears in the
   sheet's reserved slot: "Is the file still on your computer? Send it to this phone by AirDrop, mail or
   iCloud Drive, then open it here." Teaching shows only on a miss. The slot is a reserved stack, so
   nothing moves (measured, see the top of this file).
   - Pick: yes.
7. **Wrong file.** A CSV that is not an export keeps today's error copy (`handleFile`, "No card rows
   found…"). It shows at the press, and the sheet stays the control (`ux-no-dead-end`). The column names in
   it are machine text (`ux-machine-text-hidden`, which is guidance). They are kept, because a port keeps
   behaviour.
8. **The picker takes a CSV or a .json backup, as today** (`handleFile`). On an empty ledger a backup
   replaces nothing, so the first minute erases nothing. Reset stays on the Ledger tab and arms in two taps
   (`armed-reset-takes-the-row`). The web takes a milestone first (`takeVersion("before reset")`). Risk: what
   a Reset does to the Worker's copy is unmeasured (debt `reset-vs-worker-copy-unmeasured`). That matters on
   a device with a key. The `ledger` state draws today's rows, and Reset arms in place. In the mockup a
   second tap clears the device and returns to the first screen. So "nothing erases in the first minute"
   holds only in the sense that a saved version can bring the ledger back.
9. **Checking (native, key saved, first pull in flight).** The sheet reads "Looking for your ledger…". It
   is not pressable, and its second line says why. This state is neither empty nor loaded
   (`ux-unknown-is-not-empty`). The first reply after a key merges and does not replace
   (`sync-revamp-cloudflare`, `auto-apply-happens-now`), so an import made before it is kept.

## Teaching: in place, never up front

10. **Named in place (Blank Page; option `inplace`).** In the first session, the first package's micro line
    reads "Package · one order, one seller" instead of its order id and date. The first card's second line
    reads "Card — tap the box when it's in your hand". After the tick, the same line reads "Ticked. Tap the
    box again to undo." Both texts sit in one reserved stack, so the row keeps its height at every text
    size (measured at AX5 too). The labels leave at the next launch.
    - "First session" is kept in memory only: the session in which the ledger went from empty to filled.
      So no storage key and no saved-state field is added (`storage-keys-are-frozen`, `saved-state-shape`).
    - Gain: each noun is taught at the thing it names, as the HIG onboarding page advises (item 23).
    - Loss: the first package hides its order id and the first card hides its set until the next launch.
    - Pick: yes.
11. **The envelope line (Blank Page; option `envline`).** The receipt adds: "Mail with no seller you can
    name is an envelope. Record it in Orphaned." A "Record an envelope" control goes to Orphaned. The brief
    asks that the person meets "envelope" within the minute, and this line meets it.
    - Loss: one more line in the receipt.
    - Pick: yes.
12. **The manifest slip (Mail Slot; option `slip`).** In place of a receipt, a slip lists three counts by
    their nouns: packages ("each is one order from one seller"), cards ("tick each one as it arrives") and
    envelopes ("mail you can't trace to a seller"). A "Record an envelope" control goes with it. With the
    option hidden, a plain receipt shows.
    - For the first session, the slip takes the place of the masthead tally row, and its figures are live
      (a tick reads 1/412). So no label shows twice (`ux-label-once`). The tally row is back at the next
      launch.
    - Gain: all three nouns at once, each with a number.
    - Loss: about 150 pt for the first session, and a legend that reads like a lesson. The value tally is
      gone for that session.
    - Pick: second to item 10.
13. **Tabs before data.** Before any order is in, Orphaned and Tally show one sentence and one control
    each (`ux-unknown-is-not-empty`). Tally's control opens the order file. The masthead shows no tallies.
    Ledger shows today's rows.
14. **Orphaned on the first look.** One sentence: "No envelopes waiting. An envelope is mail you can't
    trace to a seller; record one here." One control: "Record an envelope".
    - Finding: `OrphanedNotice.emptyLine` (`native/ManifestKit/Sources/ManifestKit/Orphaned.swift`) says
      "record a package here", which is the wrong noun (`ux-one-plain-name`). `OrphanedView.swift` shows no
      control under it (`ux-unknown-is-not-empty`). The web's empty Orphaned copy was not read, so it is
      unknown.

## Duo open pose

15. **Before data, the left page is a title page.** It holds the letterhead. The control sits on the right
    page, beside the tab bar, under the thumb. Nothing crosses x 455.5 to 495.5 (a probe in the
    screenshot run found no element crossing).
    - Loss: half the screen holds no action.
16. **After data, the list sits beside the open package (option `spread`).** The left page holds the
    package list, with the open one marked. The right page holds the receipt and the open package.
    - Departs from: `duo-card-in-hand`, Defaults, "Packages does not spread on the open Duo" (default, not
      owner). Owner grant: yes. Not blocking. With the option hidden, the left page keeps the receipt and
      the right page keeps today's one list.
    - Pick: yes.

## Today, as drawn (`#c=today`)

17. Native opens on Ledger with no tallies (`RootView.startTab`; `LedgerTab.swift`). Rows are sketched, and
    most values are left out. The phone frame shows the web: Packages, the letterhead and `UploadZone`.
18. Finding: native Packages on an empty ledger draws the masthead and an empty list. It has no sentence and
    no control (`PackagesView` in `native/Manifest/PackagesView.swift`, which has no empty branch). This fails
    `ux-unknown-is-not-empty`.

## Sizes, text and theme

19. **Sizes.**
    - The folded Duo is drawn at the brief's 466 x 678 pt. The records `duo-card-in-hand` and
      `duo-fold-and-keyboard` give 382 x 644 pt of safe content for the outer screen. The two disagree.
    - The open Duo is drawn at 951 x 669 pt, with the hinge at 455.5 to 495.5 pt (the brief).
    - The phone is drawn at 375 x 812, the viewport `test/screens.mjs` used before the three forms. No large-phone size is written
      anywhere. The HIG layout page, read 2026-11-21, gives no device sizes.
    - The status bar and the home indicator are drawn at 20 pt each, unmeasured. The tab bar is drawn at
      the web bar's 64 pt (`phone-nav-is-bottom-bar`). The native system bar is unmeasured.
20. **AX5.** Body text is 53 pt (HIG typography, AX5 table). Content text scales by 53/17. The masthead
    title and tallies are capped in the drawing because the native masthead clips at accessibility sizes
    (debt `native-masthead-axl-clips`). Tab labels stop at the default size (`duo-card-in-hand`, "Tab bar
    text"). System sheets are drawn at the default size.
21. **Light only.** The app and the native client ship light (`design-parchment-ledger`; native is held to
    light). The page has no `t=dark` link.
22. **Motion.** The Mail Slot file drop is 520 ms. It is unmeasured, and it is drawn only with no
    reduced-motion preference (`motion-reduced-leaves-it-drawn`). Per `motion-method-side-by-side-proof`,
    the timing is chosen by looking at it, not by reading.

## Sources

23. Apple pages read 2026-11-21, each at its `tutorials/data` JSON (HTTP 200):
    - `layout`: safe areas and size classes. It gives no device sizes.
    - `typography`: the "Large (default)" table (Body 17 pt) and the AX5 table (Body 53 pt).
    - `accessibility`: the 44x44 pt default control and enlarging text to 200 percent.
    - `buttons`: the 44x44 pt hit region.
    - `sheets`: Cancel dismisses with no change.
    - `tab-bars`: navigation, not actions.
    - `onboarding`: "Consider providing a collection of context-specific tips instead of a single
      onboarding flow."

## Check faults

24. `check_ios_mockup.py` prints `system-font: a font declaration starts with cochin`. The repo rules that
    Cochin sets words (`typography-cochin-and-mono`; native `Font.cochin`). The same check flags
    `duo-hand-post-sender.html` and `duo-hand-held-box.html`. It may be a false alarm for this repo's content
    font. The chrome of the page and of each frame uses the system font.
