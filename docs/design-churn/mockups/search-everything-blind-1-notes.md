# Search everything, blind 1: notes

Designer kind: blind. Designer: search-everything-blind-1. Mockup:
`search-everything-blind-1.html` beside this file. Every figure on it is sample data from a seeded
generator (about 3,000 card lines in about 200 orders, 24 invented sellers, invented card names).

Each item: what it is, the gain, the loss, my pick. "Owner grant: yes" marks an item that adds a
control iOS does not ship, or that sets a rule no record holds yet.

## Frame and sources

1. **Devices and sizes.** Duo folded 466 x 678 and Duo open 951 x 669, hinge gap x 455.5 to 495.5,
   from the brief. `layout.py devices` printed `unknown` for this repo, so no written size came from
   it. The large phone has no written size anywhere I may read, so I drew it at the folded size,
   466 x 678, and made the frame resizable by its corner; each layout reads its own box. AX5 is drawn
   on the folded pose only, as the brief asks.
   Gain: no invented size. Loss: the phone frame is not a true phone shape. Pick: as drawn.
2. **Apple pages read 2026-11-21**, each answered 200, text read from the `.json` form:
   typography (Dynamic Type tables, Large and AX5 tabs), buttons (44 x 44 pt hit region),
   accessibility (28 x 28 pt minimum control, 200 percent text, 4.5:1 contrast), layout (size
   classes, safe areas), search-fields (placement: search tab, bottom toolbar, inline; scope bars and
   tokens; search as you type), tab-bars (navigation, not actions), sheets (Cancel leading, Done
   trailing). Lists-and-tables and toolbars were fetched but not read; no number on the page comes
   from them.
3. **Insets.** The status-bar inset (44 px) and the home-indicator inset (24 px) are stand-ins on
   the 4 px step. No page I read gives them. The CSS uses `max(env(safe-area-inset-*), stand-in)`.
4. **Type.** System font only. Each size is a Dynamic Type style at the default size (Large): Large
   Title 34/41, Title 2 22/28, Headline and Body 17/22, Subhead 15/20, Footnote 13/18. The AX5 frame
   swaps in the AX5 column (Body 53/62, Large Title 60/70). The status bar stays 15 px in every frame,
   as the system bar does not follow Dynamic Type. Sizes are in px because they stand for points.
5. **Colour.** My own, by role, light and dark, from no product. Accent is a violet ink; arrived is
   green, not yet is amber. Shape carries the state too: a filled disc with a check for arrived, a
   dashed ring for not yet, so the state reads without colour.
   Gain: one shape per state, so the words "Arrived" and "Not yet" show once per screen (house rule
   ux-label-once) and rows show the shape alone. Loss: a new user learns two shapes. Pick: as drawn.

## Pocket field

6. **One search field, docked at the bottom.** HIG search-fields: "Place search at the bottom if
   there's room", and the house thumb-zone rule. The field holds tokens (a seller or an order day)
   and free text. It matches four things at once: card name, seller, price (`0.42`, `$1`) and day
   (`nov 4`, `11/4`, `tuesday`).
   Gain: one place to type anything the person half-remembers. Loss: a short query such as `1`
   matches many prices; the groups keep that readable. Pick: keep.
7. **Results grouped by what matched**: Sellers, Order days, Cards, Prices. A card group shows the
   card name once with "n of m in", then one row per copy: seller, order day, price, state shape.
   Gain: "did all four arrive" is answered in the group header. Loss: a long group pushes others
   down; groups cap at six cards with "Show n more cards". Pick: keep.
8. **A seller or day row becomes a token** in the field (HIG: tokens filter further terms), and the
   text clears so the person types the card next.
   Gain: "the drake from Gull Street" is two moves. Loss: tokens are a learned move. Pick: keep.
9. **Scope bar under the title: All, Not yet, Arrived**, each with its count. It shows only once
   there is a query, a token or a scope; on the first screen it changes nothing, so it is absent
   (house rule ux-control-earns-place).
10. **First screen**: the total, one row "n card lines not yet in" that opens the Not yet scope,
    and recent searches. Recent searches are a new feature: Owner grant: yes.
11. **Order view.** Folded: a pushed page with a Find back button. Open pose: the right page holds
    it, and the left page keeps the list with the chosen row marked. The answer block names the card,
    its state, seller, order day and price, then lists the whole order, "n of m in".

## States (every concept)

12. **States drawn**: first screen, results, order, no match (a filter emptied the list: filters
    stay, one control clears them), no data (filters and field hidden, one sentence, one control),
    loading (keeps the list's size), failed (one sentence, Try again). Deep links: `#c=<concept>&s=<state>`,
    with `s=error` as an alias of `failed`, and `t=dark` or `t=light`.
13. **No unknown state.** The data holds whether each line arrived; there is no third value, so no
    line can be "unknown". The whole read is either loading, failed or done, and each has its own
    state. If the data gains an "unknown arrival" value, it needs its own shape.
14. **"Add order history" in the no-data state** is an assumption: I do not know how history gets
    in. In the mockup it loads the sample. Owner grant: yes (names a capability).
