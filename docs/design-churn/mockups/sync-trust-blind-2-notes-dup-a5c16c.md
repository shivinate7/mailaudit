# sync-trust-blind-2: notes

Designer kind: blind. Mockup: `sync-trust-blind-2.html`.

Job: "Did my phone and my laptop actually agree?" The parts are a last-synced time, a merge
event with its changed items, a kept older copy, and counts that can be old.

As a blind designer I saw no current screen, spec, tokens or other mockup. Every item name,
figure and time is invented sample data (a household inventory). Each part is marked
"New:" because I cannot know what exists today.

## Deep links

Concepts: `#c=sync-line`, `#c=seam`. States: `#s=agree` (default), `#s=merged`,
`#s=pending`, `#s=stale`, `#s=syncing`, `#s=stopped`, `#s=unknown`, `#s=failed`.
Theme: `t=dark` or `t=light`; no `t` follows the system.
Sync line screens: `v=items|counts|sync|merge:0029|merge:2140`.
Seam: `at=2358|0028|now`, `only=1`, `sheet=<item>` (for example `sheet=aa`).
Also `hide=seam`, `labels=0` (hides the dashed "New:" labels, which show by default). Example:
`#s=merged&v=merge:0029&sheet=bulbs&at=0028&t=dark`.

## Choices

1. **Two concepts as the options.** "Sync line" keeps a familiar shape: tabs, with the answer
   under each title. "Seam" is the bold one: the screen is the two copies side by side. Gain:
   the owner can cull at the root. Loss: two structures to judge. Pick: show both. Each has
   a "Hide this concept" control. Focus ids: `concept-sync-line`, `concept-seam`.
2. **One answer, in words, at the top of the first screen.** Both concepts open with a
   verdict block: "All is well." when nothing is wrong, or one sentence that names the
   problem, with one action beside it. Gain: the job's question is answered before any
   scrolling. Loss: it takes vertical space on every screen. Pick: keep it. In the Duo open
   pose of Sync line, it moves to the Sync page on the right, so it shows once.
3. **Eight states, each with its own shape.** All is well (a joined two-colour disc),
   merged (a fork), change waiting (an up arrow), old numbers (a hatched square), syncing
   (a turning arrow and a Stop button), stopped (a square), can't tell (half a disc and a
   dashed half), failed (a broken disc). Unknown and failed never read as "All is well"
   and never show zero. Gain: no state looks like another, even without colour. Loss:
   eight glyphs to learn. Pick: keep all eight.
4. **Merge detail as a two-column table, "Kept" and "Older copy".** Each label shows once.
   The older copy has a "Use older copy" button, the same name as in Seam's sheet. Its answer shows in the same cell: "In use on
   this phone. Your laptop gets it at the next sync.", with Undo. Gain: the person sees what
   won, what lost and when, and can reverse it in place. It also says that a restore goes
   to the other device. Loss: the table is dense at the largest text size. There it stacks
   into one column. Pick: keep.
5. **An item that both devices changed in different parts loses nothing.** The sample's
   "Spare keys" is checked on the phone and gets a note on the laptop. The row says "Nothing
   lost". Gain: the person learns that not every merge drops data. Loss: none seen.
   Owner grant: yes. The rule "the later change wins, and changes to different parts of an
   item are both kept" is my invention. It must match what the product does
   (ux-statements-are-true).
6. **Counts always carry their time.** "Counts as of 00:31". When the screen shows old
   numbers, each count is hatched with a dashed edge, and the time is the old one. The
   verdict says "Old numbers on screen", with "Update now". Gain: an old number is never
   mistaken for a current one, and the cue survives forced colours. Loss: a time label on
   every count group. Pick: keep.
7. **Sync line moves through a tab bar: Items, Counts, Sync.** A new merge puts a dot on
   the Sync tab. Gain: familiar, and each name is the page title. Loss: Counts is a thin
   tab. Pick: keep. Departs from nothing I know, because I saw no current screen.
8. **Seam has no tab bar. You move in time.** A "Compare at" control in the thumb zone
   holds one stop per sync: 23:58, 00:28 (just before the merge) and Now. At 00:28 the three
   rows that differed are highlighted, and the seam marks split. A past moment shows a
   clock glyph and "Back to now". Gain: the person sees
   exactly where the two devices disagreed and how the merge settled it. Loss: it is
   unfamiliar, and it needs a sheet for the older copy. Pick: keep, as the bold concept.
9. **The seam mark.** Two half-discs, one per device colour. Joined and level means the
   copies agree. Split and offset means they differ. A ring means a merge settled the row.
   A dashed half means the laptop's copy is unknown. In the Duo open pose, each half sits on
   the inner edge of its own screen, so the hinge itself is the seam. No element crosses
   the hinge gap; a headless check confirms this for every state, past moments and the sheet. Gain: the hardware tells
   the story. Loss: a half-disc is small (14 by 28 pt). The whole row is the 44 pt target.
10. **"Only rows that differ" filter (Seam).** When the filter leaves nothing, the list shows
    one sentence and "Show every row" (ux-unknown-is-not-empty). "Review" on a merge turns
    the filter on.
11. **Duo open pose, own layouts.** Sync line: Items on the left, Sync or the merge detail
    on the right. Seam: this phone's copy on the left, the laptop's on the right. The rows
    line up across the hinge and scroll together. The verdict is top left and "Compare at"
    is top right, at the same height.
12. **Largest text (AX5).** Sizes from Apple's AX5 table: Large Title 60/70, Body 53/62,
    Headline 53/62. Rows stack. The verdict sentence hides on the compact verdict, and the
    title and action stay. Seam's "Compare at" moves into the scroll, as a vertical list.
    The tab bar labels stay at the default size, as iOS tab bars do. Owner grant: no.
13. **Colours by role, my own.** Device teal for this phone and violet for the laptop are
    identity colours, used for dots, column heads and the seam halves. Amber is "needs a
    look", red is "failed", and blue is the action. There is a dark set for each. Radius
    is 8 pt and spacing is on the 4 pt step (house tokens). The font is the system font.
14. **Insets.** The top inset is 40 pt and the bottom inset is 24 pt, each with
    `max(..., env(safe-area-inset-*))`. Both values are my own choice: no Apple page I read
    gives a status-bar or home-indicator height.
15. **Large phone size.** The brief, `layout.py devices` and the Apple pages I read give no
    size. The phone frame is fluid: it fills its column and the screen height, and it can
    be resized. Owner grant: yes. A size is needed to draw it exactly.

## Apple pages read (2026-11-21, each answered 200, through the `tutorials/data` JSON)

- design/human-interface-guidelines/layout: safe areas and size classes. The page body held
  no device-size table.
- design/human-interface-guidelines/typography: the Dynamic Type tables, default (Large) and
  AX5.
- design/human-interface-guidelines/accessibility, buttons: 44 by 44 pt targets.
- design/human-interface-guidelines/sheets: Done on the trailing edge.
- design/human-interface-guidelines/tab-bars: the tab bar floats and is for navigation only.
- design/human-interface-guidelines/toolbars, lists-and-tables.
