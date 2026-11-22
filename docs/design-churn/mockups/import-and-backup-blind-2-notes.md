# Import and safety copies: blind designer 2 notes

Designer kind: blind. Mockup: `import-and-backup-blind-2.html`, in this folder.
I drew from the brief's job, users and data shapes only. I saw no current screen,
spec, token file or other mockup. So every part is marked "New", and no part is
marked "Today". Every figure is sample data.

## How to open a state

Each state has a deep link: `#c=<concept>&s=<state>&t=<light|dark|system>`.
Add `&only=1` to show one concept alone.

- Logbook states: `imports`, `imports-empty`, `checking`, `preview`, `error`, `done`,
  `edit`, `copies`, `copy-made`, `copies-unknown`, `restore`, `restore-exact`, `restored`, `undone`.
- Bench states: `empty`, `first`, `file`, `file-range`, `edit`, `merging`, `merged`,
  `copied`, `error`, `copy`, `copy-exact`, `restored`.

Each concept draws four frames: Duo folded (466 x 678 pt), Duo open (951 x 669 pt,
hinge from x 455.5 to x 495.5), a large phone, and Duo folded at the largest text
size (AX5). Light and dark themes. A theme switch sets `data-theme` on the root;
`prefers-color-scheme` sets the default.

Waiting-page focus: `#concept-logbook` and `#concept-bench`.

The frames are drawn by script. Each concept also holds two static Duo frames (folded, then
open) with a line that asks for JavaScript. `check_ios_mockup.py` reads the static file, so it
passes on those static frames; the frames the script draws carry the same `data-device` values.

## Sources

- Device sizes: from the brief. `layout.py devices` printed `unknown` for this repo.
- The large phone has no size in the brief. I drew it at 402 x 874 pt and label it
  "size assumed" on the page. This number is my own, not from a page I read.
- Status bar and home-indicator heights (24 and 20 pt on the Duo, 54 and 34 pt on the
  phone) are fallback values for `env(safe-area-inset-*)`. They are my own, not from a page I read.
- Apple pages, all read 2026-11-21, each answered 200:
  - Typography: Dynamic Type sizes at Large (default) and AX5. All type sizes come from it.
  - Accessibility: 44 x 44 pt default control size; text larger to at least 200 percent.
  - Buttons: 44 x 44 pt hit region.
  - Sheets: Cancel on the leading edge, Done on the trailing edge; grabber on a resizable sheet.
  - Tab bars: a tab bar is for navigation, not actions; it floats at the bottom.
  - Layout: lay out by size class, respect safe areas.
  - Lists and tables, Toolbars: fetched, not read in detail; nothing taken from them.
- Spacing on the 4 px step and an 8 px radius: house `tokens.md`. Colours are my own,
  named by role, with a light and a dark set.

## Choices

1. **Concept Logbook: two tabs, Imports and Safety copies.**
   What: a list of past imports, each with its stamp, date range and new, changed and
   skipped counts. A second tab lists safety copies by date and size. Import a file opens
   a "Check before import" sheet; nothing changes until Import is pressed.
   Gain: familiar iOS structure; the history answers "what was new" for every past import.
   Loss: import and restore live in two places, and the person must learn both.
   Pick: keep as the safe concept.

2. **Concept Bench (the bold one): no tabs, one comparison bench.**
   What: the first screen is "Now" (orders and check-ins) and an empty bench. A shelf at the
   bottom, in thumb reach, holds "Lay a file" and every safety copy. Laying either one on the
   bench shows Now against After, row by row, with check-ins locked. Merge and restore are
   the same act. On the open Duo, Now is the left page and After is the right page; the
   hinge is the gate between them.
   Gain: one mental model for import and restore; the fear ("will it erase my check-ins")
   is answered by a locked row the person sees before every act. The open pose uses both pages.
   Loss: no list of past imports, so "what did the October import add" needs another place.
   Unfamiliar: no common app works this way.
   Pick: my pick for the job, because it puts the proof before the press every time.

3. **Check-ins are never part of an import.**
   What: both concepts state that an import adds and updates orders and never removes an
   order or a check-in. A changed order shows "Check-in kept".
   Gain: answers the person's fear in their own words, on the first screen.
   Loss: the screen copy is a promise. It must be true in the product.
   Pick: keep. Owner grant: yes (the claim must match the product's import rule).

4. **A safety copy is made before every import and every restore.**
   What: automatic, and listed with why it was made ("Made before import November haul").
   Gain: every act can be undone from the copy made just before it.
   Loss: storage grows; the copy count needs a limit the owner sets.
   Pick: keep. Owner grant: yes (a new automatic act and a storage cost).

5. **Two restore modes: "Bring back what is missing" (default) and "Go back to exactly this copy".**
   What: the default adds back only what the copy has and Now lacks, so nothing current is
   lost. The exact mode replaces Now with the copy, warns in red how many check-ins leave,
   and keeps them in a new safety copy first.
   Gain: restoring is no longer a gamble. Loss: two modes to explain.
   Pick: keep both. Hide control: "Two restore modes". Owner grant: yes (restore semantics).

6. **Undo this import / Undo merge.**
   What: a button on the import's result that restores the copy made just before it.
   Gain: one press out of a bad import. Loss: one more red control on the result.
   Pick: keep. Hide control: "Undo import button" (Logbook).

7. **Stamp and date range are edited before the import, and the counts follow the dates.**
   What: "Stamp" is a name for the batch of orders in a file. "Orders dated" narrows which
   rows of the file come in; counts change live (Bench presets: Whole file, Since last
   import, Pick dates).
   Cancel and Done return to the screen the edit opened from. Cancel also puts back the old
   stamp and dates. Editing never imports.
   Gain: the person sees what is new for exactly the span they care about.
   Loss: "stamp" is my reading of the brief; it may mean something else.
   Pick: keep, pending the meaning of "stamp". Hide control: "Date presets" (Bench).

8. **The three counts are also the switch for the order list.**
   What: tapping "46 new orders" shows those orders; the counts do not repeat in a
   segmented control.
   Gain: each count shows once (house rule ux-label-once). Loss: a tappable figure is less
   obvious than a segmented control, so a caption says "Tap a count to see its orders".
   Pick: keep.

9. **Save a copy to Files.**
   What: a secondary button on a safety copy that saves it outside the app.
   Gain: a copy survives a lost or wiped phone. Loss: one more control on the restore sheet.
   Pick: offer; owner culls. Hide control: "Save copy to Files" (Logbook).

10. **Kept check-ins list on the bench.**
    What: a sample of ticked orders that stay ticked, shown under the comparison.
    Gain: the person sees real rows, not just a number. Loss: more scrolling on the folded pose.
    Pick: offer. Hide control: "Kept check-ins list" (Bench).

11. **States that are not empty.**
    What: reading a file shows progress and a Stop control; a file that cannot be read says
    nothing changed and offers another file, with the raw reason in a closed disclosure; a
    copy list that cannot be read says the copies are not gone and offers Try again.
    Gain: a failed read never looks like lost data, which is the person's fear.
    Loss: three more states to build and test.
    Pick: keep (house rules ux-unknown-is-not-empty, ux-long-run-stops, ux-machine-text-hidden).

12. **Largest text (AX5).**
    What: at AX5 the whole view scrolls, the counts and the comparison stack in one column,
    the sheet title moves under Cancel, and the main action and tab bar stay pinned. Tab bar
    labels stay small, as iOS does at accessibility sizes.
    Gain: nothing is cut off, and the main action stays in thumb reach.
    Loss: the shelf on the Bench scrolls with the content at AX5.
    Pick: keep.

## Critique (impeccable, native method, run inline)

Findings and their fixes:

- AX5 sheet header overlapped the title: fixed (sheet children no longer shrink).
- Lists squashed to zero height inside scroll areas: fixed.
- Counts repeated in a segmented control under the figures: fixed (item 8).
- "Lay a file" showed twice on the empty bench: fixed (the shelf hides its file slot there).
- Cancel or Done on the edit sheet landed on "Imported" without an Import press: fixed (item 7).
- "Save this copy to Files" and "Undo restore" gave no answer at the press: fixed.
- Bench "Undo merge" lays the Nov 12 copy, not the copy made just before the merge: not fixed;
  a sample-data limit. The builder must point Undo at the copy made just before the act.

## Input needed

- What "stamp" means in this product (item 7).
- Owner grant for items 3, 4 and 5.
- The large phone's size in points.
