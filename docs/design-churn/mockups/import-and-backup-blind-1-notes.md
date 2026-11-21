# Import and backup: blind designer 1, notes

Designer kind: blind. Mockup: `import-and-backup-blind-1.html` (same folder). I read only the brief, the
house rules and Apple's pages. I saw no current screen, spec, token file or other mockup, so every part
is drawn as "New". Each figure on the page is sample data.

Deep links: `#s=<state>` with `home`, `copied`, `empty`, `reading`, `error`, `review`, `edit`, `done`,
`restore`, `restored`, `unknown`. Add `&t=dark` or `&t=light`. `&hide=checkpoints` or `&hide=tracing`
hides a concept. `&c=checkpoints` or `&c=tracing` focuses a concept (ids `choice-checkpoints` and
`choice-tracing`).

## Concepts

1. **Checkpoints.** First screen: a check-in count, then one history of imports and safety copies,
   newest first. Movement: a navigation stack; an import is checked in a sheet; a copy opens a restore
   sheet. Open pose: history on the left page, the chosen entry or the sheet on the right.
   Gain: familiar, short, and the proof ("931 before, 931 after") sits on each import. Loss: the person
   reads numbers about orders, not the orders. Pick: keep as the safe choice.
2. **Tracing paper (the bold one).** First screen: the ledger itself. A file is laid over it as a
   sheet: new orders inked in, changes noted, unchanged rows faint, check-ins drawn on top of the sheet.
   Safety copies are a stack of sheet edges under the ledger; restoring lays a copy over the same way
   and strikes what it would take back. Open pose: ledger left, sheet right, row for row, scrolling
   together. Gain: the person sees their own rows and ticks untouched, which answers the fear directly.
   One interaction serves import and restore. Loss: more to build (row matching, synced scroll); the
   overlay is a custom control, not a stock iOS one. Pick: this one, if the build cost is acceptable.

## Choices in both concepts

3. **Check-in proof.** Each check shows "931 check-ins now, 931 after". Gain: the fear is answered with
   the person's own number. Loss: one more block above the counts. Pick: keep. Owner grant: yes (it
   states a product promise: an import never clears a check-in; I could not read whether the spec
   says so).
4. **Check before change.** Choosing a file reads it and shows what it would do; nothing changes until
   Import. Gain: no surprise. Loss: one extra press per import. Pick: keep. Owner grant: yes.
5. **Counts.** New, Changed and Skipped, each opening its orders (Checkpoints) or filtering the sheet
   (Tracing paper). Skipped splits into "already here and the same" and "outside your dates". A
   changed order says its check-ins stay. Pick: keep.
6. **The Import button names its effect:** "Import: add 37, update 5". With nothing to add it reads
   "Nothing to import", is disabled, and says why on hover and focus. Pick: keep.
7. **Stamp.** I read "stamp" as a label put on each order this import adds (sample "Nov 21 import"),
   shown on those rows in the ledger. The brief does not define it. Gain: the person can find what one
   import brought. Loss: if "stamp" means something else, this item is wrong. Pick: keep, and confirm
   the meaning. Owner grant: yes.
8. **Date range.** Two month pickers, From and To; the counts change as the person picks; orders outside
   the dates are skipped, never removed. Loss: month steps, not days. Alternative: a day picker (iOS
   date picker), more precise, slower. Pick: months.
9. **Safety copy made first.** A copy is made before each import and before each restore, and the
   person can make one at any time. Each copy shows date, reason and size. Gain: every act can be
   reversed. Loss: storage grows. Retention is not drawn. Owner grant: yes.
10. **Undo at the answer.** After an import or restore, the answer appears with "Undo import" or "Undo
    restore" beside it (house rule ux-answer-at-press). Undo shows once, on that answer only. Owner
    grant: yes (Undo is new behaviour).
11. **Restore shows what it takes back.** Orders added since and check-ins made since, as counts
    (Checkpoints) or as struck rows and dashed tick rings (Tracing paper). The "Restore this copy"
    button is the plain primary colour, not red: a copy of now is made first, so the act can be undone,
    and red would feed the fear the job names. The losses carry the red. Pick: keep.
12. **States.** Reading (with Stop), not an order file (with "Choose another file" and the machine text
    behind "What the file said"), empty ledger, and copies that could not be read. The last is drawn as
    unknown, never as "no copies" (house rule ux-unknown-is-not-empty). Pick: keep.
13. **Names.** One name per act: "Import a file", "Import", "Make a safety copy", "Restore this copy",
    "Undo import", "Undo restore". "Safety copy" is the term from the brief. Copies are titled by date,
    so no status word repeats down the list (house rule ux-label-once).
14. **Colour by role, plus shape.** New: indigo with a left rule and "+". Changed: ochre with a left rule
    and a note. Skipped: grey, faint. Kept: green. Loss: red, with strike or dashed ring. No meaning
    is colour alone. The palette is my own (light and dark sets).

## Choices in Tracing paper only

15. **Peek under** is a toggle, not press-and-hold. Gain: it is found and works with VoiceOver. Loss:
    a second press to lay the sheet back. Pick: toggle.
16. **Open pose filters dim, not hide,** so the rows stay lined up across the hinge. Pick: keep.
17. **Stamp and dates edit in a panel over the sheet,** so the counts below change in view. Pick: keep.

## Devices, type and sources

18. Duo folded 466 x 678 and open 951 x 669 (hinge x 455.5 to 495.5), from the brief; nothing sits
    across the hinge. Both Duo poses have their own layout.
19. **Large phone: no size is written** in the brief or the repo's device list, and the Apple layout
    page read today no longer lists device sizes. It is drawn at 466 wide and 900 tall, resizable;
    the layout is the same compact one as the folded Duo. Owner: please give the size.
20. **AX5.** Drawn on the folded Duo. Text uses the AX5 sizes; the content scrolls. Bar titles and the
    bottom bar buttons stop at AX1 Body (28 pt) so both actions stay on screen. That cap is my choice;
    it needs a check on the device. The sheet turns solid at AX5 so no row shows through.
21. No tab bar and no Back to a parent are drawn: I do not know the app's other sections. In
    Checkpoints, tapping an import in the folded pose pushes its detail with a Back; open, the detail
    shows on the right page. In Tracing paper the screen is the ledger. Status bar and home indicator
    heights are drawn placeholders, not Apple figures.
22. Apple pages fetched 2026-11-21, each answered 200: layout, typography, accessibility, buttons,
    sheets, lists-and-tables, tab-bars, toolbars (developer.apple.com/design/human-interface-guidelines/).
    Used: Dynamic Type sizes at Large (default) and AX5 from typography; 44 x 44 pt targets and 200
    percent text from accessibility; "the Cancel button belongs on the leading edge of the top toolbar"
    from sheets; "use a tab bar to support navigation, not to provide actions" from tab-bars. The layout
    page gave no device sizes.
23. **Open-pose gap rows** on the ledger page are shape only (a dashed slot). The page header says once
    what a dashed slot means (house rule ux-label-once).
