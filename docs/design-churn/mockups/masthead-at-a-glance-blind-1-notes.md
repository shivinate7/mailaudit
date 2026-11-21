# Masthead at a glance: blind designer 1, notes

Designer kind: blind. Mockup: `masthead-at-a-glance-blind-1.html`. Every figure, seller, card name and
time in it is sample data.

The job: the top of the tool tells you, in one look and with no press, the cards still out, the cards
checked in today, the packages that may be lost, the time of the last sync with another device, and
whether that sync agreed. All three concepts show all five facts on the first screen, with no press,
on the folded Duo, the open Duo and the large phone.

## Deep links

Append a hash to the file URL. Keys combine with `&`.

- Concept: `#c=count-strip`, `#c=plain-sentence`, `#c=fill-line`. Waiting-page focus ids, one per
  concept, on the folded Duo frame: `count-strip-mast`, `plain-sentence-mast`, `fill-line-mast`.
- State: `#s=normal` (default), `calm`, `disagree`, `stale`, `sync-unknown`, `never`, `done`,
  `loading`, `failed`, `empty`.
- Theme: `#t=light`, `#t=dark`. With no `t`, `prefers-color-scheme` sets it. The switch sets
  `data-theme` on the root.
- Device: `#d=folded`, `open`, `phone`, `ax5`. Large phone width: `#w=360` to `480`.
- Hidden concepts: `#h=fill-line,count-strip`. Today and New labels off: `#tags=0`.

## Items

1. **Count strip.** Two counts sit side by side in one strip ("cards out", "checked in today"). Below
   them is a list of only what is not normal, or "All is well.", and below that the sync line. A
   floating tab bar has three tabs: Check in, May be lost, Sync. On the open Duo the tab bar goes:
   the left page holds the counts and the check-off list, and the right page holds the late packages
   and the sync record.
   Gain: the familiar iOS shape, so there is nothing to learn. The counts are the largest type on the
   screen, so they read first.
   Loss: three of the five facts sit in a second row, so the glance reads two lines and a strip. The
   tab bar costs about 70 pt of the folded screen.
   Pick: keep as the safe option.

2. **Plain sentence.** The top reads as short sentences in Title 1: "214 cards are still out. 37 came
   in today. 3 packages may be lost. Synced with iPad 4 min ago, in step." Each bold phrase is a
   button. Press it, and the list under the sentences shows those packages. The pressed phrase gets a
   solid underline. No tab bar. On the open Duo, the sentences fill the left page and the list fills
   the right page.
   Gain: it reads in one pass, the way the person said it ("I glance and know where I stand"). A state
   that is not normal adds a sentence, so a calm day is visibly shorter. It reflows well at AX5.
   Loss: the way to move is less familiar than tabs, so a one-line hint sits under the sentences. The
   numbers are smaller than in Count strip. At AX5 the sync sentence falls below the fold.
   Pick: my recommendation. It answers the job most directly.
   Owner grant: yes. It has no bottom tab bar, against house `tokens.md`, "On a phone, navigation uses
   a bottom tab bar".

3. **Fill line (the bold one).** Every package is one segment of a single line, oldest first, as wide
   as its card count: filled blue for today, filled grey for earlier, hollow for out, and hatched red
   for may be lost. The out count is the big number. A key beside it gives the today and earlier
   counts, and the sync line sits above. The line is the only way to move. Drag along it and the list
   (all packages, in the same order) follows. Scroll the list and a frame on the line follows. A
   press on "3 packages may be lost" jumps to the first late one. On the open Duo the line stands
   upright at the hinge edge of the left page, and the list fills the right page.
   Gain: the whole order history shows as one shape, and a late package is visible as a hatch at the
   left end, with no count to read. No common checklist app uses a minimap as its navigation.
   Loss: the owner buys hundreds of cards from many sellers, so at hundreds of packages the segments
   become hairlines and the line reads by colour mass only. The line sits at the top, out of one-hand
   thumb reach on the folded Duo (`ux-thumb-zone` is met for Got it, not for the line). The list
   holds received packages too, so it is longer to scroll.
   Pick: show it, so the owner can cull it. It is worth a look for the late-package hatch alone.
   Owner grant: yes. It has no bottom tab bar, against house `tokens.md`.

4. **Got it and Undo stay in place.** A press on Got it turns the button into Undo, in the same box,
   and the row stays in its slot until you change tab or phrase. The counts change at once.
   Gain: no row moves under the thumb, and a wrong press undoes where it was made.
   Loss: a checked row stays in the "out" list until you leave it. Pick: keep, in all three concepts.

5. **"All is well." stands in only when all is well.** It shows only when no package is late, the
   last sync agreed, and that sync is less than a day old (house `ux-all-is-well`). These each show as
   their own state, never as a zero or "All is well.": never synced, sync record unreadable, sync in
   progress, a failed read of your check-ins, loading, and no orders imported. Pick: keep.

6. **Sync disagreement is fixed in the sync record.** The record lists each package that differs,
   with "Use iPad's" and "Keep this phone's". Gain: a fix is on the same screen as the warning. Loss:
   it is a guess at the data shape. I do not know how the real sync compares records. Pick: keep, and
   check it with the builder.

7. **Words.** "Check-in" for the act, "may be lost" for a package a week or more past the day it
   should have come, "in step" for an agreed sync. The seven-day line is my choice: the brief gives
   none. Pick: keep. Change the line to match the real rule.

8. **Colour and type.** Colour is by role (surface, text, accent for today, warn for may be lost, ok
   for in step, caution for stale or unknown), in a light set and a dark set, and these are my own
   values, as house `tokens.md` gives none. The type is the system font. Each size comes from the
   Dynamic Type table at the default size (Large) and, in the AX5 frame, at AX5. The tab bar and the
   status bar keep their default size at AX5, as iOS shows the large content viewer instead. Spacing
   is on the 4 pt step, with an 8 pt radius. Pick: keep.

## Devices and sizes

- Duo folded at 466 x 678 pt and Duo open at 951 x 669 pt, with the hinge at x 455.5 to 495.5, as the
  brief gives. `layout.py devices` printed `unknown` for this repo. No sheet, row or control crosses
  the hinge: each sheet opens inside its own page.
- Large phone: neither the brief nor `layout.json` (size `null`) gives a size, and the Apple layout
  page I read lists none. It is drawn at a width set by a slider (default 400 pt) and 870 pt tall.
  Both numbers are unsourced. It uses the folded (compact width) layout.
- Status bar (40 pt) and home indicator (20 pt) are drawing allowances, not measured insets. Each
  frame also pads with `env(safe-area-inset-*)`.
- AX5 on the folded Duo, above the fold:
  - Count strip: both counts and the late-package row. The sync line is below the fold.
  - Plain sentence: the out, today and late sentences.
  - Fill line: the sync line, the out count and the key. Its line scrolls with the list here.

## Apple pages read, 2026-11-21 (each answered 200, through `/tutorials/data/...json`)

- design/human-interface-guidelines/typography: the Dynamic Type sizes, Large and AX5 tables.
- design/human-interface-guidelines/accessibility: the 44x44 pt default control size, and text
  that can grow to 200 percent.
- design/human-interface-guidelines/layout: safe areas, and layout by size class.
- design/human-interface-guidelines/tab-bars: a tab bar floats at the bottom and is for navigation,
  not actions.
- design/human-interface-guidelines/sheets and buttons: Done on the trailing edge, and a 44 pt hit
  region.
- design/human-interface-guidelines/toolbars: the large title.

## Labels

The dashed "New: masthead" marks what each concept adds. The dashed "Today: check-off list" is
assumed: as a blind designer I have not seen the current screen. The page button "Today and New
labels" hides both kinds of label. Each concept has its own Hide button.
