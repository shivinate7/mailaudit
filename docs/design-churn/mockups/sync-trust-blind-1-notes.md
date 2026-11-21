# sync-trust-blind-1 notes

Designer kind: blind. Mockup: `sync-trust-blind-1.html` in this folder. Every figure, name and time on it is sample data.

The job: one person, two devices. "Did my phone and my laptop actually agree?" The parts: a last-synced time, a merge with a list of changed items, a kept older copy, and counts that can be old.

As a blind designer I saw no current screen. So nothing on the mockup is labelled "Today:". Each new part has a dashed "New:" label, and the "New: labels" control hides them.

## Sources

- Apple HIG typography, read 2026-11-21 (answered 200). Default sizes: Large Title 34/41, Title 3 20/25, Headline 17/22, Body 17/22, Subhead 15/20, Footnote 13/18, Caption 1 12/16. Largest accessibility size (AX5): Large Title 60, Title 3 55, Headline 53, Body 53/62, Subhead 49, Footnote 44, Caption 1 43.
- Apple HIG layout, accessibility, buttons, sheets, lists and tables, tab bars, toolbars, all read 2026-11-21 (each answered 200). Used for: safe areas, 44 x 44 pt targets, the floating tab bar, large titles, and text in lists.
- The HIG layout page no longer lists device sizes. No number on the mockup comes from it.
- House rules: `principles.md`, `layout.md`, `tokens.md` in `~/.claude/docs/design/`.

## Devices

- Duo folded: 466 x 678 pt, from the brief. Drawn first.
- Duo open: 951 x 669 pt, from the brief. Two pages of 455.5 pt with a 40 pt hinge gap. No element crosses the gap: each page has its own status bar part, title and rows. A rung ends at the page edge with a dot, and its other half starts at the other page's edge.
- Large phone: 430 x 932 pt, tagged `data-device="iphone-regular"` (the layout.json key for the non-Duo iPhone). **The brief, `layout.py devices` and the HIG give no size. I chose this size. It is not measured.**
- Duo folded at AX5: the same frame at the largest accessibility text size. It changes shape: the counts stack, each kept/set-aside pair stacks, and the summary puts its mark above its text.
- The status bar (44 pt) and the home indicator area (28 pt) are my choice, not measured. The CSS also reads `env(safe-area-inset-*)`.

## Deep links

Hash keys: `c` concept (`tab`, `ladder`), `s` state (`agree`, `merged`, `stale`, `syncing`, `failed`, `never`), `t` theme (`light`, `dark`; no key follows the system), `d` frame (`folded`, `open`, `phone`, `ax`), `v` view (`list`, `item`, `sync`, `merge`, `ladder`), `m` merge, `i` item, `o` open rungs, `stale=fade`, `a=0` hides the New: labels, `h` hidden concepts.

Examples: `#c=tab&s=merged&v=merge&m=m3`, `#c=ladder&s=stale&v=ladder&t=dark`, `#c=ladder&s=merged&v=ladder&d=open&o=m3`, `#c=tab&s=failed&v=sync`, `#c=ladder&s=never&v=ladder&d=ax`.

## Choices

1. **Concept "Sync tab".** The checklist opens first. A trust summary sits under the title, then the counts, then the items. A second tab, Sync, holds both devices' last-synced times, the sync action and every merge. A merge opens to its changed items. Open pose: list on the left page, detail (the latest merge or the tapped item) on the right page.
   Gain: familiar; the checklist stays the home screen; trust is one glance under the title. Loss: the merge history is one tap away and reads as a log, so "did they agree" is a sentence, not a picture.
   Pick: keep as the safe option. Hide control: "Hide" beside "Sync tab". Focus id: `choice-sync-tab`.

2. **Concept "Ladder" (the bold one).** The app opens on a time ladder. Two vertical rails, one per device (this phone left, Laptop right). Each sync is a rung across both rails. Newest is at the top. A rung that merged a clash is thick and opens in place to show each clash: this phone's copy under its rail, Laptop's copy under its rail. Changes made between syncs show as ticks on the rail of the device that made them. When the other device has not been heard from, its rail turns dotted from that time to now. The counts sit at the time they were taken, so old counts sit visibly below newer, unknown time. Open pose: each page is one device. The hinge is the line between the two devices, and each rung meets itself across it.
   Gain: answers "did they agree" by shape: two rails joined by a rung means agreed at that time; a dotted rail means unknown. No common app of this kind uses it. Loss: new to learn; takes more height than a list; the agree state shows mostly history.
   Pick: recommend for the owner to look at first. Hide control: "Hide" beside "Ladder". Focus id: `choice-ladder`.

3. **Trust summary: one home for both concepts.** One line plus one quiet sentence. With nothing wrong it reads exactly "All is well." and nothing else (house rule ux-all-is-well). The last-synced time lives in the device rows (Sync tab) or the rail heads (Ladder), as a fact, not a status.
   Gain: meets the house rule; the word for each state shows once. Loss: in the agree state the time is one tap away in "Sync tab". Pick: as drawn.

4. **The agreement mark.** Two rings, this phone's colour and Laptop's colour. Overlapping = agree. Overlap filled = just merged. Pulled apart with a dotted ring = not heard from. A cross on the second ring = failed. One ring and a dashed grey ring = no second device. Shape carries the state, so no status word repeats (house rule ux-label-once).
   Gain: works without colour; reads in forced colours (strokes, not fills). Loss: abstract; needs the sentence beside it the first few times. Pick: as drawn.

5. **Kept and set-aside copies.** Each clash shows both copies side by side, each with its device and time. Kept: solid edge in its device colour and a tick. Set aside: dashed grey edge, hatch, struck-through value, and "Use this copy". A legend shows once per screen. Pressing "Use this copy" swaps them, and the answer shows at the press: "Now using Laptop's copy." with Undo. The counts update at once.
   Gain: the copy that lost is always one tap from coming back, and the person sees what each device had. Loss: a long note squeezes in a half-width box. Pick: as drawn; AX5 stacks the two copies.

6. **Old counts.** When this phone is offline or a sync failed, the counts get a dashed amber edge, a hatch and "As of 9:42" above them. Option: "Stale counts faded" greys them instead of hatching. Each option has its own control ("Stale counts hatched", "Stale counts faded").
   Gain: an old number never looks like a current one (house rule ux-unknown-is-not-empty); the dashed edge survives forced colours. Loss: the hatch is busy; the fade is quieter but reads less like a warning. Pick: hatched.

7. **Six states, each its own picture.** Agree, Just merged, Offline with old counts, Syncing (with Stop), Sync failed (with Try again and a closed "What the server said" disclosure), One device only (one sentence and "Link a device"). None of the unknown states shows zero or "done".
   Pick: as drawn.

8. **Sync action.** "Sync now" sits above the tab bar in thumb reach. It is a quiet button when all is well or just merged, and a filled button when counts are old, a sync failed, or no device is linked. While syncing it becomes progress plus Stop, in the same place. With no second device it reads "Link a device", in the same place. Both concepts keep this one slot in every state.
   Gain: the loudest thing on screen is the thing to do. Loss: the floating button covers the bottom of the list until the person scrolls. Pick: as drawn.

9. **Items that changed on both devices.** In the checklist, a small two-dot mark sits beside each such item. In "Sync tab" every row opens the item. In "Ladder" only marked rows are buttons; each opens its rung on the ladder.
   Pick: as drawn.

10. **Colours.** My own, by role: this device (indigo), the other device (teal), warning (amber), failure (red), set aside (grey). A light set and a dark set. No repo or product colour. System font only. Space on the house 4 pt step; radius 8 pt.

## Sample assumptions (not confirmed)

11. **The later change wins a clash.** The mockup says "The later change was kept." I do not know the product's merge rule. Owner grant: yes.
12. **The set-aside copy stays until the person acts on it.** The mockup never removes it. I do not know how long a set-aside copy is kept. Owner grant: yes.
13. **The phone can tell when the other device was last heard from.** The Ladder's dotted rail and "Last seen 9:42" need that time. Owner grant: yes.
14. **A sync reports progress ("4 of 16 changes") and can be stopped.** Owner grant: yes.

## Not drawn

- A third concept, "In place": no sync screen at all; every count carries its own age and every changed item carries its own clash. Not drawn because two full concepts across four frames used the time; it is a subset of what "Sync tab" shows in its item view.
- Three or more devices. The rails and the two-ring mark assume two.

## Critique (impeccable, run on this mockup)

Run single-context (no sub-agent tool), so it is a degraded run. Detector: one advisory, "repeating-gradient stripes". That is a false alarm here: the hatch means "set aside" or "old", it is not decoration.

Fixed: the floating "Sync now" was the loudest element even when all was well (now quiet then); rungs did not meet the rails; ladder checklist rows that led nowhere were buttons; "Only this phone so far" and "Syncing" showed twice on one screen; open-pose ladder rows did not line up across the hinge; duplicate element ids across frames.

Also fixed after a second look: the Ladder's sync progress jumped to the top of the ladder (now it stays in the bottom slot); the Ladder's open pose with the checklist showed half a ladder on the right page (now the whole ladder); the one-device right page pointed at a merge list that was not there.

Presses tested in headless Chrome: Use this copy and Undo, counts follow a swap, Sync now, Stop, a sync that ends in "All is well.", a checklist row that jumps to its rung, a rung knot, rows lining up across the hinge, unique ids. All passed.

Open: the floating action covers the last row until scroll; the agreement mark is abstract on first sight; the Ladder's agree state is mostly history.
