# Import and backup, directed designer 2: notes

Designer kind: directed. Direction: undo-everything: every import is a reversible step in a visible timeline.

Mockup: `import-and-backup-directed-2.html`. Deep links: `#c=<concept>&s=<state>`, with `&u=<undo look>` on
the Undone state of the journal concept and `&tags=0` to hide the Today and New labels. Concepts: `journal`,
`ribbon`. States: `empty`, `log`, `imported`, `detail`, `armed`, `undone`, `stamp`, `stamped`, `range`,
`backup`, `restore`, `restored`, `error`. Every figure, seller, order, file name and size is a sample.

Frames, in order: Duo folded 466 x 678, Duo open 951 x 669 with the hinge at x 455.5 to 495.5, large phone, and
Duo folded at the largest text size. Each pose is its own layout. One theme: the app ships light only
(`design-parchment-ledger`), so the page has no theme switch.

## Choices

1. **Concept: Journal or Ribbon.** Journal lists each step and takes one step out, keeping everything made
   after it. Ribbon goes back to a page in time; "now" stays a page you can return to.
   Gain, Journal: a later check-in or stamp survives the undo of an earlier import. Gain, Ribbon: it is
   mostly today's machinery, a saved-version restore plus the `before restore` milestone
   (`history-restores-a-saved-version`, `a-restore-is-not-local`). Loss, Journal: a new delta undo for imports,
   like `undoAssign` for envelopes (`undo-removes-only-its-delta`). Loss, Ribbon: going back sets aside work
   made after the page, until the person returns to now.
   Pick: Journal. Focus ids: `choice-journal` (`#c=journal&s=imported`), `choice-ribbon`
   (`#c=ribbon&s=undone`). Each concept has a Hide control on the page. Owner grant: yes.
2. **Taking lines off needs a line tombstone.** In both concepts an undo removes lines. `mergeLedger` in
   `src/merge-rules.mjs` unions lines and has no line tombstone (stamps and envelopes have one), and the
   Worker's `POST /ledger` never drops an item (`imports-merge-never-replace`). So the next sync reply would
   add the lines back. A build needs a line tombstone that travels, which changes `saved-state-shape` and the
   wording of `imports-merge-never-replace`. Unmeasured: whether today's restore of an older version gets its
   removed lines back the same way. Owner grant: yes.
3. **Newest entry at the bottom, by the thumb.** A ledger journal posts downward, and the step most likely
   to be undone sits nearest the thumb. Gain: one-hand reach (house rule `ux-thumb-zone`). Loss: a reader
   used to newest-first scans up. Departs from: History lists newest first (`history-restores-a-saved-version`,
   `src/app.jsx` `versionList`). Pick: newest at the bottom.
4. **Entries named by the act.** "Imported orders-2026-11-20.csv", not "before import". Gain: the person sees
   what happened, not a state name. Loss: the milestone must store the file name and the counts. Today:
   `takeVersion("before import", "milestone")` in `src/app.jsx` `handleFile`. Pick: name by act.
5. **Before and after table.** Lines, Check-ins, Stamps, Envelopes, with the check-in row in green "same".
   Gain: the fear "will it erase my check-ins" gets a figure, not a promise. Loss: four rows of height on a
   folded screen. Today: the sentence "Check-ins untouched." from `setImportMsg` in `src/app.jsx`. Pick: the
   table.
6. **Counts in orders and skipped rows.** The brief asks for new, changed and skipped orders. `mergeItems`
   returns `added`, `refreshed` and `renamed` lines only, and nothing counts the rows `parseItems` drops.
   New: count new orders, changed lines and skipped rows (already here, and not a card purchase). This changes
   the summary that `csv-import-shows-a-summary` names. Owner grant: yes.
7. **Undo look: reversing entry or mark in place.** Reversing entry posts a red entry on top and strikes the
   import's figures; mark in place strikes the import and adds "Undone at 00:52" with Put it back.
   Gain, reversing entry: the journal stays append-only, and the undo has its own time, as a sync write does.
   Gain, mark in place: one row fewer. Pick: reversing entry. Focus ids: `choice-undo-reverse`
   (`#c=journal&s=undone&u=reverse`), `choice-undo-mark-entry` (`#c=journal&s=undone&u=mark`). Each has a
   Hide control.
8. **The undo arms in place.** One tap arms "Tap again to take off 142 lines"; Cancel takes first focus; the
   arm lapses after 4 s. "See what came in" leaves the row while armed, so the arm takes the row. Today:
   `arm` and `disarm` in `src/app.jsx`, `setTimeout(disarm, 4000)`, `no-native-dialogs`,
   `armed-reset-takes-the-row`. Only the selected entry shows an Undo, so one control is ever armed.
9. **Check-ins on lines an undo takes off.** The arm says the 512 check-ins stay, and that check-ins made on
   the taken-off lines come back if the file is imported again. This holds only if nothing prunes a
   `received` key with no line. Unverified: `parseLedger` and `salvageLedger` in `src/app.jsx` and
   `src/view-rules.mjs`. Owner grant: yes.
10. **The import applies at once.** No preview gate before an import: the undo replaces a confirm. Keeps
    today's behaviour (`handleFile` merges as soon as the file parses).
11. **Upload zone copy on touch.** "Choose your OrderWand CSV" with a Choose a file button. Departs from:
    "Drop your OrderWand CSV here" (`src/app.jsx`, the upload zone). The Duo and the phone are touch only, so
    nothing drops there. The zone still opens on an empty ledger (`upload-zone-opens-when-empty`).
12. **One picker for both files.** A `.csv` imports and a `.json` restores, as today (`handleFile`, the
    `/\.json$/i` test). The dock's button reads "Import a file". Departs from: the cell name "Re-import CSV"
    (`ledger-tab-holds-options`).
13. **Restore preview before a file restore.** A backup file opens a sheet that compares now with the backup,
    envelopes included, then arms "Tap again to replace 1,204 cards". Departs from: a `.json` file restores at
    once (`handleFile` calls `applyBackup`). The arm counts cards, as History's does today; whether it should
    count envelopes stays open in `history-restores-a-saved-version`, so the table shows them beside it.
    Owner grant: yes.
14. **A restore is a step.** Undo restore applies the `before restore` milestone, which exists today
    (`milestones-taken-before-risk`). The page names no fixed number of days: milestones keep 30 days, capped
    at the newest 60 (`RETENTION` in `src/version-rules.mjs`, `retention-tiers-are-unioned`).
15. **"This device".** Saved versions live in this device's IndexedDB (`versions-get-their-own-database`),
    and a change reaches the Worker in about 3 s (`a-restore-is-not-local`, `SYNC_POST_MS`). The title reads
    "Journal of this device", and the undo arm says sync gets the change in a few seconds.
16. **Backup entry with name and size.** The entry shows the file name and its size. New: size; the app shows
    none today. The copy says the browser keeps the file, because the page cannot see it after the download.
    Finding: the name takes the UTC date (`toISOString` in the backup function in `src/app.jsx`), so an
    evening backup in CST is named for the next day.
17. **Check-in rows as context.** "Checked in 42 cards" rows show that check-ins sit between imports, and carry
    no Undo: a card is unticked in Packages (house rule `ux-control-earns-place`). New: nothing groups
    check-ins today. Gain: the timeline shows the work an import must not touch. Loss: one more grouping rule.
    Pick: keep them.
18. **Stamp editor from What came in.** A package row in What came in opens the stamp editor as a sheet, and
    Save posts an entry with Undo stamp. Keeps the six `STAMP_KINDS`, the 12 px chip row gap and the 16 px note
    field (`stamp-band-opens-the-editor`). Departs from: the editor opens inline under the package header.
    Undo stamp writes the earlier stamp or a tombstone (`stamp-removal-writes-a-tombstone`).
19. **Orders from.** "Show these orders in Packages" opens the picker with the file's months chosen: the seven
    `RANGES` four to a row, By month, and Exact dates (`ruled-head-range-picked`). A view setting changes no
    data, so it posts no entry, and the sheet says so.
20. **Dock above the bar.** Import a file and Back up sit pinned above the bar, in thumb reach. Departs from:
    both are rows in the Data group (`ledger-tab-holds-options`). The View group, Sync and Reset are left out of
    this mockup and keep their place.
21. **Open Duo.** The journal on the left page, the chosen step on the right, the bar under the right page.
    Departs from: the web bar is centred and capped at 480 px (`phone-nav-is-bottom-bar`), which would cross the
    hinge. Follows the Duo tab bar ruling in `duo-card-in-hand`.
22. **Largest text.** Drawn from the HIG AX5 sizes: Large Title 60/70, Body 53/62, Caption 1 43/51. The web app
    sets Cochin in fixed px, which does not follow Dynamic Type. A build needs a size source that does, such as
    `font: -apple-system-body` with Cochin set after it. The AX5 frame is drawn four screens tall, starting at
    the step in view. The bar keeps fixed labels, as `duo-card-in-hand` rules for the Duo bar. Owner grant: yes.
23. **Text sizes.** The frames use HIG text-style sizes in Cochin (body 17). The web app uses 14 to 16 px.
    Words in Cochin, numbers in mono (`typography-cochin-and-mono`).
24. **Ribbon strip.** On one screen, a row of page tabs above the bar, newest at the right; on the open Duo, a
    column on the right page. The ribbon marks the page in view. Going back arms in place, as in 8.
25. **Empty and wrong-file states.** An empty ledger shows one sentence and the upload zone. A wrong file keeps
    today's error copy, says "Nothing changed", and offers Choose another file.
26. **Native.** CSV import stays on the web (`csv-import-stays-web`). The journal could show on native, but
    versions are per device, so a phone's journal would not list a web import.

## Sizes

- Duo folded and open: the brief's sizes. `layout.py devices` gives no Duo size.
- Large phone: no size is written anywhere in the repo or the device list. Drawn 375 pt wide, the repo's own
  screens-check width; the height repeats the folded Duo's 678.
- Status bar and home indicator: unmeasured; drawn at a 20 pt floor, as `duo-hand-post-sender.html` does.

## Apple pages read 2026-11-21 (each answered 200)

- https://developer.apple.com/design/human-interface-guidelines/layout: safe areas.
- https://developer.apple.com/design/human-interface-guidelines/typography: Dynamic Type tables; default Body
  17/22, Large Title 34/41, Caption 1 12/16; AX5 as in item 22.
- https://developer.apple.com/design/human-interface-guidelines/accessibility: iOS default control 44x44 pt.
- https://developer.apple.com/design/human-interface-guidelines/buttons: hit region at least 44x44 pt.
- https://developer.apple.com/design/human-interface-guidelines/sheets: Cancel on the leading edge; pair Done
  with Cancel.
- https://developer.apple.com/design/human-interface-guidelines/lists-and-tables and
  https://developer.apple.com/design/human-interface-guidelines/toolbars: read, no number used.

## Checks

- `check_ios_mockup.py`: the `system-font` fault stays. Content is set in Cochin by `typography-cochin-and-mono`;
  the page chrome uses the system font. `duo-hand-post-sender.html` faults the same way.
