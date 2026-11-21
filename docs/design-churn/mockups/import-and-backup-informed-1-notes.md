# Import and Backup: informed designer 1

Mockup: `docs/design/import-and-backup-informed-1.html`. Designer kind: informed. Light theme only: the web app and the native client are held to light (`design-parchment-ledger`).

Deep links: `#c=receipt` or `#c=proof`; `s=zone`, `receipt`, `proof`, `posted`, `newlines`, `stamp`, `range`, `backup`, `restore`, `error`; `a=1` arms the undo or the restore; `d=all`, `folded`, `open`, `ax5`, `phone`; `hide=receipt,proof,sizes,months,jsonsplit`. Example: `#c=receipt&s=receipt&a=1&d=folded`.

Owner focus ids: `receipt-card` (Receipt at the row), `proof-sheet` (Proof before posting).

## The pain

"I'm scared to import in case it erases my check-ins." The code gives the fear a real cause. `handleFile` in `src/app.jsx` takes a `.csv` and a `.json` through one upload zone. A `.csv` merges at once (`mergeItems`, invariant `imports-merge-never-replace`). A `.json` restores at once with a full replace, and nothing asks a second time. The zone's own help line says "a .json backup restores everything". The answer after a CSV is one sentence ("Added 59 lines. ... Check-ins untouched."), and it gives no figure for the check-ins.

## Sources read

- `src/app.jsx`: `UploadZone`, `handleFile`, `applyBackup`, `takeVersion`, `backup`, `RANGES`, the stamp editor in `PackageCard`, the History list, `LedgerRow`, the `.mdl-*` styles.
- Records: `imports-merge-never-replace`, `csv-import-shows-a-summary`, `csv-import-stays-web`, `upload-zone-opens-when-empty`, `backup-files-restore-two-ways`, `every-restore-passes-applybackup`, `a-restore-is-not-local`, `history-restores-a-saved-version`, `milestones-taken-before-risk`, `recovery-control-not-state-gated`, `no-native-dialogs`, `no-layout-shift-under-pointer`, `ledger-tab-holds-options`, `phone-nav-is-bottom-bar`, `one-stamp-per-package`, `stamp-band-opens-the-editor`, `ruled-head-range-picked`, `date-filter-spans-ledger-views`, `duo-card-in-hand`, `typography-cochin-and-mono`, `spacing-on-4px-grid`, `design-parchment-ledger`, measurements `duo-fold-and-keyboard`, `cloud-csv-import`, `ledger-and-seed-sizes`.
- Apple pages, read 2026-11-21, each answered 200: Layout, Typography (the Dynamic Type table), Accessibility, Buttons.

## Devices

- `layout.py devices` gives `unknown` for this repo. The Duo sizes come from the brief and match `duo-fold-and-keyboard`: folded 466 x 678 pt, open 951 x 669 pt, fold 455.5 to 495.5.
- Large phone: neither the brief nor the repo writes a size, and the Layout page no longer has a size table. Drawn as a stand-in at a slider width (default 430 pt). Unmeasured.
- The status bar and the home indicator are drawn at a 20 pt floor, as `DuoHandUITests.statusBarFloor` draws the top. The bottom inset is unmeasured.
- AX5: the HIG table gives Title 3 55, Body 53, Subhead 49, Footnote 44, Caption 2 40 at the largest size. The web app sets text in px, so today it does not grow with Dynamic Type at all. The AX5 frame draws the intended growth. See item 9.

## Platform

CSV import and file restore are web-only (`csv-import-stays-web`, `native-parity-table`). So every frame draws the web app as the home-screen app on the device, with the web's glass bar. Native rules for sheets and navigation stacks do not apply. Words stay in Cochin and numbers in Menlo (`typography-cochin-and-mono`). The mockup check faults Cochin (see Input needed).

## Choices

1. **Concept: Receipt at the row.** The file goes in at once, as today. The answer lands where the press was: a ruled receipt in place of the upload zone. It leads with a Before and After table for check-ins, stamps and envelopes, then the counts: new, shipping status updated, renamed, already here, skipped. Then "Show the 59 new lines" and a two-tap "Undo this import".
   - Gain: the fear gets a figure ("806 before, 806 after") at the place the person looks. No extra tap.
   - Loss: the file is already in when the person reads it. Undo leans on the `before import` milestone.
   - Pick: keep both concepts on the page; let the owner cull. Owner grant: yes (a new summary layout; `csv-import-shows-a-summary` holds one sentence today).
   - Departs from: `handleFile` `setImportMsg`, a one-sentence notice.

2. **Concept: Proof before posting (bold).** The file is read and merged in memory (`mergeItems` is pure) and shown beside the ledger. Nothing changes until "Post 59 new lines". On the open Duo the left page is Now and the right page is After, row for row at the same height across the fold, like a ledger spread. Kept rows carry a green double rule. Folded, the same spread is one table: Now, File, After.
   - Gain: the person sees the outcome before anything changes. "Nothing has changed yet." is the headline. The fold carries the meaning, not decoration.
   - Loss: one more tap on every import. Re-import of the same file still needs the press.
   - Pick: recommend this one. Owner grant: yes.
   - Departs from: `handleFile`, which applies the merge in the `Papa.parse` `complete` callback. The `before import` milestone moves to the Post press.

3. **Undo this import (Receipt).** Two-tap, Cancel after it, as `armed-reset-takes-the-row`. Armed: "Tap again to go back to 1,201 lines", with "Check-ins made since 09:14 go back too." It restores the `before import` version through `applyBackup`, as History does.
   - Gain: a one-place way back. Loss: it repeats what History already offers. Pick: keep. Owner grant: yes (a new armable control; `no-native-dialogs` lists Reset and Restore as the main component's two).

4. **Restore asks twice and shows the copy first.** Both concepts. A `.json` no longer replaces at once. The person sees the copy's date, size, and a Now / Copy / Change table (lines, check-ins, envelopes), then "Restore this copy", armed as "Tap again to replace 2,940 cards" (the History arm's words).
   - Gain: the one silent wipe in the app gets the same two taps every other restore has.
   - Loss: one more tap on a deliberate restore. Pick: yes. Owner grant: yes.
   - Departs from: `handleFile` calls `applyBackup(reader.result, "file")` on the drop.

5. **Restore apart from import (Proof only; hide key `jsonsplit`).** The upload zone takes `.csv` only. A new "Restore a backup file" row in the Data group takes `.json`. The zone's help line drops "a .json backup restores everything".
   - Gain: the import zone can no longer wipe. Loss: one more row in the Ledger tab; the picker's `accept` narrows. Pick: yes. Owner grant: yes.
   - Departs from: `UploadZone` `accept=".csv,.json,..."` and `backup-files-restore-two-ways` ("The file picker restores either form").

6. **The promise in the zone.** Two lines under the zone: "A CSV import only adds and updates lines. Your 806 check-ins, 14 stamps and 6 envelopes stay as they are." and where the safety copy goes. The statement is true now (`mergeItems` keeps `received`).
   - Gain: the fear is answered before the press. Loss: two lines of height. Pick: yes. Owner grant: no (copy only).

7. **Sizes on Backup and History (hide key `sizes`).** Backup rows show the file size (`238 kB`, `41 MB`); each History version shows its size. The size comes from `snapshot()` and the version's stored `bytes`, so no new storage key.
   - Gain: a safety copy has a date and a size, as the brief asks. Loss: computing the photos size means reading every photo blob; the figure may need a "measuring" state. Pick: yes. Owner grant: no.

8. **New-line filter row and month counts (hide key `months`).** "Show the 59 new lines" opens Packages with a removable "59 new from the 09:14 import" row, in the place the stamped filter row uses. The month list in Orders from tags months that hold new lines ("41 new"). The seven `RANGES` stay as they are (`ruled-head-range-picked`).
   - Gain: checking what was added is one tap, and stamping happens there. Loss: a filter that lasts only until cleared or the next load; the month tag adds text to a ruled panel. Pick: the filter row yes; the month tags optional. Owner grant: yes (a new filter on the pipeline, beside `stamped-filter-on-the-pipeline`).

9. **Largest text.** The AX5 frame stacks each label and value, turns the reconcile table into labelled lines, and keeps the tab bar labels at 10 pt (`duo-card-in-hand`, tab bar text). The web app today sets px sizes, so none of this happens on the phone until the type moves to text-style sizes.
   - Pick: report as a gap, not a choice here. Owner grant: yes, if the web type should follow Dynamic Type.

10. **Open Duo.** Two pages. The bar sits under the right page, as the native Duo bar does (`duo-card-in-hand`, item 23 a). In Receipt, the left page keeps the receipt beside Packages while the person stamps. In Proof, the spread stays on the left.
    - Loss: the web has no fold reading. Safari's support for the viewport segments API is unread, so the web may not know where the fold is. Owner grant: yes.
    - Departs from: `duo-card-in-hand` default "Packages does not spread on the open Duo" (default, not owner).

11. **Stamp editor and date range: kept as built.** The six kinds, the 16 px note, Cancel with first focus, Save; the seven ranges four to a row, the month list, Exact dates. Drawn as Today parts so the owner sees them in the flow.

## Critique (impeccable, run on this mockup)

- Method: single context, no sub-agent tool in this session (degraded run). Detector run twice.
- Fixed: green text on paper and on greenSoft read 4.3:1 and 4.1:1. The kept box, the legend and the mark labels now sit on the card token (4.8:1).
- Fixed: "Nothing changed" sat under the promise, away from the error. It is now the error's last line, where the press was.
- Fixed: the zone promise said "An import only adds"; a `.json` through the same zone replaces everything. Now "A CSV import only adds".
- Fixed: the spread's right page showed a bare "0"; it says "no change".
- Fixed: the restore arm said "lines"; it says "cards", as the History arm does.
- False alarm: "cream palette". The parchment palette is ruled (`design-parchment-ledger`).
- Open: on the folded Proof, the Post strip and the bar take about a quarter of the screen. Open: the armed restore sits one box above Reset, two red controls near each other; `no-native-dialogs` lets only one arm at a time.

## Input needed

- Items 1, 2, 3, 4, 5, 8, 9 and 10 carry Owner grant: yes.
- The large phone's size: none is written. Name it and the frame is redrawn.
- `check_ios_mockup.py` faults Cochin. The repo rules Cochin for words (`typography-cochin-and-mono`), and the earlier repo mockups fault the same way. Possible false alarm in the check.
- Critique questions: should a re-import of a file with no new lines skip the proof and say so at once? Should Undo this import stay once History shows the same version one tap away?
