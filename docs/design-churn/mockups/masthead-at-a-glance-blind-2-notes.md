# Masthead at a glance: blind designer 2

Designer kind: blind. Mockup: `masthead-at-a-glance-blind-2.html` in this folder.
This designer saw no current screen, spec, token file or other mockup. Every part on the
page is labelled "New:", because a blind designer cannot tell what exists today.

The job: open the tool, glance, and know where you stand. The five facts: cards still out,
cards received today, packages that may be lost, time of the last sync, and whether that sync
agreed.

Deep links (append to the file URL): `#c=sentence|bar|front`, `&s=ok|lost|disagreed|both|never|syncunknown|allin|empty|loading|failed`,
`&d=folded|open|phone|ax5` (all devices when left out), `&t=light|dark` (system when left out),
`&v=out|today|lost|sync` (open one view in every frame). Focus ids: `masthead-sentence`,
`masthead-bar`, `masthead-front` (on the folded Duo frame).

Sources read 2026-11-21: Apple HIG Layout, Typography, Accessibility, Tab bars, Buttons and
Sheets, through `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`
(each answered 200). Type sizes are the iOS Dynamic Type table, Large (default) and AX5 columns.
House rules: `principles.md`, `layout.md`, `tokens.md`.

## Concepts

1. **Sentence.** The top is one typeset sentence: "18 cards still out. 8 came today." Under it a
   status line names only what is wrong, as warning buttons, or says "All is well." Then a quiet
   "Synced 4 min ago" line. The checklist (packages, then cards) sits right under it. A floating
   tab bar moves between Out, Today and Sync. Folded: the list pushes to a package. Open: list on
   the left page, the chosen package's cards on the right.
   Gain: reads like a person talking; the most familiar structure; the checklist is one glance
   below the facts. Loss: the counts are text, so proportion (how much is left) is not seen; the
   masthead takes about a quarter of the folded screen while sticky.
   Pick: yes, as the safe option.
2. **Mail bar (bold).** No title, no tab bar. The top is one bar cut in proportion: came today,
   still out, and a hatched end for cards in packages that may be lost. A postmark seal at its end
   carries the last sync (tick and minutes, "!" when the devices disagreed, dotted when never
   synced or unknown). The bar and the counts under it are the only navigation: press a part and
   the list below shows that part. Open: the bar stands upright on the left page, the list fills
   the right.
   Gain: one look shows proportion as well as counts; nothing else on screen competes; no common
   app of this kind uses its status as its navigation. Loss: the bar's parts sit at the top, out
   of thumb reach on a tall phone (the counts and list rows stay reachable); a today slice is thin
   when much is out; the hatch is lost in forced-colours mode, where borders carry it.
   Pick: yes. This is my first choice for the owner to see.
   Departs from: house `tokens.md`, "On a phone, navigation uses a bottom tab bar". Owner grant: yes.
3. **Front page.** The glance is its own first screen, "Mail day": a docket of rows with problems
   on top (or "All is well."), then still out, came today, and the sync time. "Check in mail" at
   the thumb opens the checklist, which has a segmented control with the counts (Out, Today, May
   be lost). Open: docket on the left page, checklist on the right, no push.
   Gain: the calmest glance; every fact gets a full row and one press; the main action sits in
   the thumb zone. Loss: on the folded Duo and the phone the checklist is one press away, and
   once in it the docket is gone (the segmented counts keep two of the five facts).
   Pick: yes, for a person who opens the tool more to check than to check in.
   Departs from: house `tokens.md`, "On a phone, navigation uses a bottom tab bar" (it pushes
   instead). Owner grant: yes.

## Choices inside the concepts

4. **Status names only what is wrong** (house rule ux-all-is-well). "All is well." stands alone;
   otherwise each problem is a button that leads to its fix: lost packages open the lost list,
   a sync problem opens Sync. Gain: a quiet day reads quiet. Loss: none seen. Pick: keep.
5. **Sync detail.** Sync shows when it ran and whether the devices agreed, with "Sync now". A
   running sync shows "Syncing…" and Stop in the same place (ux-long-run-stops, ux-answer-at-press).
   Gain: one fix for every sync problem. Loss: the data shape gives only agree or disagree, so the
   mockup does not list which cards differ. Pick: keep. Owner grant: no.
6. **Never synced and unknown are their own states**, never "0 min" or "agreed"
   (ux-unknown-is-not-empty). Loading, failed and empty each have their own masthead: a skeleton,
   a plain error with Try again and a closed "What the device said", and one sentence with Import
   orders. Pick: keep.
7. **A checked card stays in place, ticked.** Out lists keep cards received today, so nothing jumps
   under the thumb (ux-order-holds-still). Tap again to undo. "Mark all received" turns into "Undo"
   in the same place until the next press. Gain: safe one-hand check-in. Loss: the Out list grows
   with ticked rows through the day. Pick: keep.
8. **Order.** Packages that may be lost come first, then the oldest order first. Pick: keep.
9. **What "may be lost" means.** Drawn as a flag on a package with no card in many days (the
   sample shows 24 and 27). The rule that sets the flag is not in the brief. Owner grant: yes, if
   the tool has no such rule yet.
10. **Haptics.** A light haptic on each check and on Mark all received (ux-haptics-feel-substantial).
    Not drawable in HTML. Pick: keep.
11. **Colour and type.** Colours are this designer's own (the house file gives no hex): cool paper
    surface, ink blue for received and for presses, a postal red for lost and disagreed, green
    only for "All is well". Type is the system font with Dynamic Type styles. Numbers use tabular
    figures. Pick: keep.
12. **Text sizes in px.** The HTML maps 1 pt to 1 px, so type does not follow the browser's own
    font size (ux-text-zooms is advice for web text). The native build uses Dynamic Type. Pick: keep.

## Devices and sizes

- Duo folded 466 x 678 pt and Duo open 951 x 669 pt with the hinge from x 455.5 to x 495.5, from
  the brief. Nothing crosses the hinge: in the open pose each concept splits into two pages.
- Large phone: the brief and `layout.py devices` give no size, and the HIG Layout page no longer
  lists device sizes. It is drawn at the folded Duo's size, and its frame can be dragged. The
  owner should name a size. Owner grant: no (a fact to supply).
- Largest text: the folded Duo at AX5. In Sentence and Front page the glance fills the first
  screen at AX5 and the list starts below it. The seal turns into a full-width line.
- Spacing sits on the 4 px step. Radii are 8 px, except shapes iOS draws itself or that nest
  inside an 8 px box: the device frame (24), the floating tab bar capsule (28, its items 24), the
  sheet's top corners (16), and the inner parts of the bar, the segmented control and the swatches
  (4 and 2).
- Status bar (44) and home strip (20) heights are placeholders. No page read gives them. The tab
  bar (56) and tap targets (44 and more) follow the 44 x 44 pt floor from the Accessibility page.

## Critique (impeccable, single context)

The run had no sub-agent tool, so it ran in one context. The detector found one advisory:
repeating-gradient stripes. That is the hatch on "may be lost", which carries meaning (a shape,
not only a colour), so it stays. Findings fixed: no undo after "Mark all received" (added Undo in
place); the bar looked pressable but only the counts were (bar parts now press too); the AX5 sync
line overlapped the warnings (fixed); the sentence's full stop wrapped alone at AX5 (fixed); the
docket numbers did not line up (fixed); on the open Duo the sync sheet opened on the page away from
the seal that was pressed (now on the same page, ux-answer-at-press); a few 2, 3 and 5 px gaps
were off the 4 px step (fixed). Open: the Mail bar's navigation sits at the top, out of thumb reach
on a tall phone.
