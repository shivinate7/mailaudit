# Sync trust: blind designer 2

Designer kind: blind. Mockup: `sync-trust-blind-2.html` (this folder). It opens from disk.
The brief gave the job, the devices and the house rules. I read no screen, spec, token file or
mockup of this repo. As a blind designer I cannot know what exists today, so each drawn part is
marked with a dashed "New:" label and none with "Today:". The Hide New marks control turns them off.

Deep links: `#c=<concept>&s=<state>&t=<theme>`, with `c` = `line` or `seam`;
`s` = `agree`, `merged`, `stale`, `offline`, `failed`, `syncing` or `empty`; `t` = `light` or `dark`.
Optional: `v=sync`, `v=merge:m939`, `v=item:cable:merge:m939` (Sync line screens),
`x=<item>` (an open Seam row), `f=diff` (Seam's Differences filter).
Focus ids for the page: `opt-sync-line` (Sync line) and `opt-seam` (Seam), each in the folded frame.

Sources read 2026-11-21, each answered 200, through the `.json` path under
`developer.apple.com/tutorials/data/design/human-interface-guidelines/`:
layout, typography, accessibility, buttons, sheets, tab-bars, toolbars, lists-and-tables.
Type sizes are the iOS Dynamic Type rows of the typography page: Large (default) for every frame,
and AX5 for the largest-text frame. Targets are 44 x 44 pt (accessibility and buttons pages).

## Items

1. **Two concepts, each its own first screen.** Sync line opens on the list with one status line
   above it, and a Sync tab holds the detail. Seam opens on both devices side by side, row by row.
   Gain: the owner can choose between a quiet add-on and a new structure. Loss: twice the build
   to compare. Pick: show both and let the owner cull; each has a Hide control.

2. **Sync line: one line answers the question.** A tappable line under the title says, in words,
   whether the devices agree: "All is well." when nothing is off, else only what is off (merged,
   old numbers, no connection, failed, syncing). Gain: the answer sits where the eye lands; no
   new screen to learn. Loss: one line cannot show which items changed; that takes a tap.
   Pick: keep.

3. **Sync line: a Sync tab with a merge history.** The tab holds the summary, both devices with
   their last-synced times joined by a bracket (solid when they agree, dashed when unknown), and
   a list of merges. A merge opens a list of changed items; a clash opens the item's two copies.
   Gain: every merge stays findable later. Loss: three levels deep to reach an older copy from
   the tab. The list row of a clashed item also opens it in one tap. Pick: keep.

4. **Seam (the bold concept): the device is the diagram.** On the open Duo the left page is this
   phone and the right page is the laptop; the hinge is the seam between them. Each row stands at
   the same height on both pages, and the pages scroll together. A mark at each inner edge, never
   across the hinge, shows the row's state: stitches (same), coloured stitches (changed by the
   merge), a knot (clash), a solid bar (different now), dots (unknown since the last sync).
   Folded, the two copies sit in two columns with the seam between. Gain: "did they agree?" is
   answered for every row at a glance, and the hardware means something. Loss: every row shows
   twice, so the list is longer; the seam marks need learning, so the status card states the
   mark in use ("A dotted seam means unknown since then"). Pick: keep, as the bold option.
   **Owner grant: yes** (a new structure for the list screen).

5. **Seam has no tab bar.** It moves by a floating bar (Everything / Differences, Sync now) and
   by opening a row in place. Departs from: house tokens, "On a phone, navigation uses a bottom
   tab bar". Gain: one screen holds the whole answer. Loss: no home for other sections; a real
   app with more sections would add the tab bar back. Pick: keep for the comparison.
   **Owner grant: yes.**

6. **Old numbers carry a hatch, and the words show once.** When counts may be old, the counts
   (and, in Seam, the laptop's column) get a diagonal hatch. The words "yesterday at 18:20" show
   once, in the status line or card (house rule ux-label-once). Unknown never shows as agree or
   zero (ux-unknown-is-not-empty). Gain: a glance tells fresh from old. Loss: a hatch alone is
   not read by a screen reader. In Sync line each hatched count has an "Old number" label; in
   Seam the hatched cells have none yet, so a build must add one. Pick: keep.

7. **The older copy is a yellow carbon slip.** A clash keeps the losing copy and shows it on a
   carbon-copy yellow surface: a sheet under the kept copy (Sync line) or a slip under the row on
   the losing device's side (Seam). Gain: one look means "kept, not in use" everywhere. Loss: a
   new colour role to maintain. Pick: keep.

8. **"Use older copy" is a new act, with Undo.** It swaps the copy in use. The answer shows at
   the button ("Now using the older copy." and Undo). After the swap the other copy is the newer
   one, so the button reads "Use newer copy". Gain: nothing is lost by a merge rule the person
   disagrees with. Loss: the app must keep both copies of a clashed item. **Owner grant: yes**
   (a capability, not only a view).

9. **Which copy wins is drawn as "the later change was kept".** I do not know the real merge rule;
   the sample shows the later change kept, and each clash sentence says so. If the rule differs,
   only the sentence changes. Pick: the owner or the code states the real rule.

10. **States drawn.** Agree, merged with a clash, old numbers, no connection, sync failed, syncing
    and one device only. Failed shows a plain sentence, a closed "What the server said"
    disclosure and Try again. Syncing shows the system activity indicator and Stop. One device
    only shows one sentence and Add a device. Sync now, Stop, Try again and Add a device keep one
    name in both concepts, and each answers at the control.

11. **Seam at the largest text.** At AX5 the two copies stack (this phone above the laptop) and
    the seam turns sideways; a small device glyph marks each copy. The floating bar moves into
    the page, because at AX5 it would cover half the screen. Gain: nothing clips. Loss: the
    side-by-side reading is gone at AX5. Pick: keep.

12. **Colour.** My own palette by role, light and dark: carbon blue for agree and actions, a
    stamp red for merges, carbon-copy yellow for older copies, graphite for old numbers, red for
    failure. No colour of any repo or product.

## Sizes and gaps

- Device sizes come from the brief. `layout.py devices` printed `unknown` for this repo.
- The large phone has no written size. It is drawn at the folded size (466 x 678) and the
  frame can be resized by hand. Input needed: the phone's size.
- The status-bar zone is 48 px tall, a house space step: no Apple page I read gives a height.
  Frames also pad with `env(safe-area-inset-*)`.
- The tab bar's label size stays at Caption 2 in the AX5 frame, on the guess that iOS shows a
  large-content view there rather than growing the label. No page I read states this; unverified.
- Type is set in px equal to iOS points, to draw the iOS sizes; a web build would use rem
  (house rule ux-text-zooms).
