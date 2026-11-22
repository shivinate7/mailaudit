# Import and backup, preview first: notes

Designer kind: directed. Direction: preview-first: nothing changes until you confirm a clear before/after.

Mockup: `docs/design/import-and-backup-directed-1.html`. Deep links take `#c=<concept>&s=<state>&d=<device>`.
Concepts: `carbon` (Carbon copy), `tray` (Held tray). Devices: `folded`, `open`, `phone`, `ax5`, `all`.
States: `ledger`, `pick`, `import-preview`, `import-none`, `import-error`, `import-done`, `restore-preview`,
`restore-armed`, `restore-done`, `backup`, `backup-done`, `packages`, `stamp`, `stamp-done`, `range`.
Focus ids for the owner's pick: `carbon-proof` (Carbon copy) and `tray-strip` (Held tray), both in the folded frame.

Sources read: `imports-merge-never-replace`, `csv-import-shows-a-summary`, `upload-zone-opens-when-empty`,
`backup-files-restore-two-ways`, `every-restore-passes-applybackup`, `a-restore-is-not-local`,
`history-restores-a-saved-version`, `milestones-taken-before-risk`, `stamp-band-opens-the-editor`,
`one-stamp-per-package`, `ruled-head-range-picked`, `ledger-tab-holds-options`, `phone-nav-is-bottom-bar`,
`no-native-dialogs`, `no-layout-shift-under-pointer`, `typography-cochin-and-mono`, `design-parchment-ledger`,
debt `web-armed-restore-moves`, and `src/app.jsx` (`handleFile`, `UploadZone`, `applyBackup`, `RANGES`).

Apple pages read 2026-11-21, each answered 200, through the `tutorials/data` JSON:
human-interface-guidelines/layout, typography (Dynamic Type tables: Large (default) and AX5), accessibility,
buttons and sheets. Figures used: 44 x 44 pt targets; Body 17, Headline 17, Footnote 13, Caption 1 12,
Title 2 22 at the default size; Body 53, Headline 53, Footnote 44, Caption 1 43, Title 2 56 at AX5;
Cancel on the leading edge of a sheet.

Sizes: Duo folded 466 x 678 and open 951 x 669 (hinge x 455.5 to 495.5) come from the brief.
`layout.py devices` prints `unknown` for this repo, and no size is written for any device.
The brief gives no size for the large phone. It is drawn 375 pt wide (the `check:screens` phone width before the three forms, that
`phone-nav-is-bottom-bar` names) and 678 pt tall (borrowed from the folded Duo). The real size is unmeasured.
Status bar: 20 pt, as `duo-hand-held-box` draws it. Bottom safe area: unmeasured; drawn as 0 plus the bar's 12 pt.
Theme: light only. The web app and the native client ship light (`design-parchment-ledger`), so there is no
dark set and no theme switch.

## Choices

1. **Every bulk change is checked before it lands.** Import, restore, a stamp and the Orders from range all
   show what will change, and nothing is written until one confirm press.
   Gain: answers "I'm scared to import" with a page that proves the check-ins stay before anything moves.
   Loss: one more press per import and per restore.
   Departs from: `handleFile` in `src/app.jsx` merges at once and then shows the summary notice.
   Pick: preview first. Owner grant: yes.

2. **Carbon copy: the change is a separate proof.** A sheet titled "Check before adding" shows the promise
   ("Adds 23 lines. Removes nothing. Your 371 check-ins stay."), filter counts, the changed rows, and a
   Now / After table. On the open Duo the hinge splits the two: the left page is Now, the right page is
   After, row for row, and the two pages scroll together. Rows that do not exist yet are hatched slots.
   Gain: the clearest before/after; the Duo's two screens become the comparison itself.
   Loss: the person leaves the screen they know to read a proof.
   Pick: Carbon copy for import and restore. Hide control: "Hide Carbon copy".

3. **Held tray: the change is held inside the real screens.** After a file is read, the app shows Packages
   with the held packages in place (dashed manila, "Held: new" or "Held: change"), and a manila tray above
   the bar: counts, the promise, "Put back" and "Add 23 lines". A restore marks what goes in red: struck
   packages and dashed, struck ticks. On the open Duo the left page is the tray, the right page the list.
   Gain: the person sees the change where they will work with it.
   Loss: the held state is a new mode of the working view; a reply from sync or a tap in the list while the
   tray is up needs rules that do not exist yet.
   Pick: second. Hide control: "Hide Held tray".

4. **Four counts for an import: New, Changed, Already here, Left out.** Each count is a chip that filters
   the rows. "Changed" covers the shipping refresh (with tracking, canceled) and the rename, the two
   refreshes `imports-merge-never-replace` allows. "Left out" counts the rows `parseItems` drops.
   Gain: "skipped" in the brief has two meanings (unchanged and not a card purchase); these names keep them apart.
   Loss: "Left out" needs the raw row count, which `handleFile` reads (`results.data`) but does not keep.
   Pick: four chips.

5. **The file decides the flow, and the preview names it.** One picker takes a `.csv` or a `.json`, as today.
   A `.json` opens "Check before replacing", which says first: "This is a backup, not an order list."
   Gain: today a `.json` dropped on Re-import CSV replaces everything at once. The preview stops that mistake.
   Loss: none found.
   Departs from: `handleFile` sends a `.json` straight to `applyBackup`.
   Pick: keep one picker; the preview names the file kind.

6. **Restore shows what you lose.** The restore proof lists what goes: lines ordered after the backup,
   check-ins made after it, envelopes and stamps. It states that the server copy follows a few seconds
   later (`a-restore-is-not-local`) and that a "before restore" version goes to History first
   (`milestones-taken-before-risk`).
   Gain: a restore without fear; the person sees the loss before the press.
   Loss: the diff needs `applyBackup` to compute the delta before it writes.
   Pick: show it.

7. **The armed Restore keeps Cancel's slot all the time.** "Replace with this backup" arms in place to
   "Tap again to replace 448 cards"; Cancel appears in a slot that was reserved, so nothing moves.
   In the tray, "Put back" keeps a fixed width for the same reason.
   Gain: closes debt `web-armed-restore-moves` in the new design (`no-layout-shift-under-pointer`).
   Loss: an empty 112 pt slot beside the button at rest.
   Pick: reserve the slot.

8. **The arm counts cards in the ledger only (448).** `history-restores-a-saved-version` holds this count
   open: envelopes are replaced too and are not counted. The preview lists envelopes apart.
   Gain: the arm copy stays as built (`Tap again to replace N cards`). Loss: the count leaves envelope cards out.
   Pick: keep the count as built. Owner grant: yes, if the count should include envelope cards.

9. **The import receipt sits at the Re-import CSV row.** After "Add 23 lines" the receipt says what was
   added, that check-ins were untouched, and "Saved before import" with an "Open History" link.
   Gain: the answer is where the press started (`ux-answer-at-press`), and the way back is one tap away.
   Loss: none found. Copy follows the strings in `handleFile`.
   Pick: receipt at the row.

10. **Nothing new is its own state.** "Nothing new in this file. Every one of its 431 lines is already
    here, unchanged." with one control, Done (`ux-unknown-is-not-empty`). A wrong file keeps today's error
    text, adds "Nothing changed." and keeps the picker open.
    Gain: an empty import is not mistaken for a failed one. Loss: none found. Pick: both states as drawn.

11. **Backup shows its size and what it holds before the download.** The Backup row shows the last backup
    date and size; the panel lists lines, check-ins, envelopes and stamps, the size with and without photos,
    and "Last backup: Nov 2, 19 days ago".
    Gain: a dated, sized safety copy the person can trust.
    Loss: the last backup date must be stored on the device; no key holds it today, and the saved-state
    shape is fixed (`saved-state-shape`), so it needs its own home. Owner grant: yes.
    Pick: show size and date.

12. **The stamp editor shows the stamp before Save.** Carbon copy: a "Now / After Save" pair with the band
    as it will land, dated today. Held tray: the band shows on the card itself, dashed, "Held until Save".
    Both state the effect: a Refunded or Partial refund stamp takes the package out of every count
    (`a-refund-leaves-every-count`), with Outstanding before and after.
    Gain: the refund's effect on the totals is seen before it happens.
    Loss: two more lines in the editor.
    Pick: Carbon copy's pair.

13. **Orders from: two ways.** Carbon copy stages the pick (dashed cell) and applies it with
    "Show 14 packages"; Held tray puts a package count on each cell and applies on tap, as today.
    Gain (stage): the count before the view changes. Loss (stage): an extra press on a filter that loses
    nothing. Departs from: `RANGES` cells apply on tap in `src/app.jsx`.
    Pick: the count on each cell, applied on tap (Held tray's way); a filter hides nothing from the ledger,
    so it needs no confirm. The months list shows only when "By month" is picked, as the month picker does.

14. **On the open Duo, a list sits beside its detail.** The Ledger tab stays on the left page; the panel a row
    opens (upload zone, Backup, Orders from) takes the right page. The bar sits on the left page only.
    Departs from: the web bar centres at up to 480 px wide (`phone-nav-is-bottom-bar`), which would sit across
    the hinge on the open Duo.
    Gain: nothing sits across the hinge, and a panel opens beside its row. Loss: the bar no longer centres
    on the open Duo. Pick: bar on the left page. Owner grant: yes.

15. **At AX5 the actions join the page.** A floating dock or tray would cover half the folded screen, so at
    AX5 the Carbon copy confirm ends the proof and the Held tray leads the page. Table rows stack.
    Gain: the proof stays readable at AX5. Loss: the confirm leaves the thumb zone at AX5.
    Pick: in flow at AX5 only. Note: the web app sets text in px today, so it does not follow Dynamic Type
    (`ux-text-zooms`); this frame shows the target, not today's behaviour.

16. **Type stays Cochin and Menlo.** App words in Cochin, numbers in Menlo (`typography-cochin-and-mono`);
    only the sheet title and Cancel use the system font. `check_ios_mockup.py` faults the Cochin declarations
    (`system-font`), as it does on `duo-hand-held-box`.
    Gain: the screens look like MANIFEST. Loss: the mockup check stays red on `system-font`.
    Pick: the repo ruling. Owner grant: yes, if the house check should win.

17. **Which client each screen belongs to.** Import, the upload zone, the import summary and the Orders from
    picker are web only (`csv-import-stays-web`, `ruled-head-range-picked`). The stamp editor and Backup exist
    in both clients (`stamp-band-opens-the-editor`, `MastheadBackupUITests`). On a Duo the person may run the
    native app, which has no import at all. The mockup draws every screen in the web app's vocabulary
    (bottom glass capsule, ruled cells, Cochin), with a native sheet toolbar (Cancel leading) on the proofs.
    The stamp note field is two lines, as the native ruling sets it (page item 39 a, `stamp-note-two-lines`).
    Gain: one consistent set for the owner to judge. Loss: the native stamp editor and Backup row would need
    the same preview drawn in native controls before a native build. Ambiguity, not resolved: which client the
    preview-first stamp and Backup changes should reach first.
    Pick: web first, since import exists only there.

## Self-check (skill design-review, the parts one agent can run)

- Mockup set check, structure: Carbon copy `new` (a proof sheet sits between the file and the ledger; on the
  open Duo the hinge splits Now and After). Held tray `new` (a held mode inside Packages, with a tray above the bar).
  Both keep today's four tabs and today's first screen.
- `native` or `web-like`: both `web-like`. They draw the web app (glass capsule bar, ruled cells, web
  buttons), as the import is web only. A native build of stamp and Backup needs a native drawing.
- `label_once.py` on five rendered states: hits are data (card names, "without tracking" values, "Ordered"
  per card, "lines" counts), and "envelopes" in the restore table and its loss list.
- Not run: the two blind reviewers and the compare step. They need spawned agents, which a designer has not.

## Critique (impeccable, degraded: single context, no sub-agent tool)

Fixed: the folded import proof put the rows under the fold (rows now lead, the table follows); at AX5 the
dock and tray covered half the screen (they join the page); the Held tray showed 3 of 6 held packages (all
6 show); the disabled "Show packages" looked live (dimmed); the months showed under every range pick.
Detector: "cream background" is the repo's paper token (kept, the ruling pins it); "repeating stripes" are
the hatched slots that mark rows not yet in the ledger (kept, they carry meaning).
Craft floor: six added eyebrow labels became plain Cochin leads; the receipt's 3 pt coloured left border
became a soft fill; the text check glyph in check boxes became the drawn tick. The diff marks (+, ~, −, =)
stay as text: they are proofreader marks that carry the kind, each with a spoken label.
Open: the Today/New mark labels overlap text where marks sit close; the toggle hides them.

## Input Needed

- Which concept to build: Carbon copy or Held tray (items 2 and 3).
- Orders from: stage and apply, or count on each cell and apply on tap (item 13).
- Item 1, 11, 14 and 16 grants, and item 8's count.
- Item 17: which client gets the preview-first stamp and Backup first.
- The large phone's size, and the Duo bottom safe area.
