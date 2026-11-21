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

## Fill-in sentence

15. **The search is one sentence with five blanks**: "Find [any card] from [any seller], ordered
    [any day], at [any price], [arrived or not]." It sits at the bottom of the screen (thumb), and
    the answers scroll above it. Tap a blank to fill it; the card blank becomes a text field, the
    others open a picker just above the sentence (a list of sellers, chips of order days, price
    bands, arrival). Each picker shows only values that still give answers, with counts.
    Gain: the person sees every way to narrow at once, in plain words, and never meets an empty
    picker. Loss: more taps than one field for a person who only knows the name. Pick: keep as an
    option.
16. **Answers are sentences.** A summary ("126 copies of 15 cards. 107 arrived, 19 not yet in.")
    then one group per card, one sentence per copy: "From Gull Street Cards, ordered Thu 19 Nov,
    $1.68." Tap a copy for its order sheet.
    Gain: reads like an answer to the person's question. Loss: longer rows than Pocket field.
    Pick: keep.
17. **The order sheet leads back into the sentence**: "Find more from <seller>" and "Find more from
    <day>" fill that blank and clear the card. Sheet: Close on the leading edge (HIG sheets).
18. **Price bands, not exact prices** (under 25¢, 25¢ to 50¢, 50¢ to $1, $1 to $3, $3 or more).
    The band edges are my guess for low-cost cards. Gain: one tap. Loss: an exact price is not
    searchable here; Pocket field and Sieve do take one. Owner grant: yes (band edges).
19. **Open pose**: left page holds the title, the picker and the sentence; right page holds the
    answers and the order sheet, inside that page. AX5: the sentence panel takes at most 58 percent
    of the screen and scrolls, so answers stay in view.

## Sieve (the bold concept)

20. **Every card line is a dot** on a canvas under the count: about 3,000 dots, green for arrived,
    amber for not yet, in order-day order. Typing fades the dots that do not match.
    Folded: a dense field. Open pose: the left page turns the dots into a day chart (one column per
    order day, 1 Oct to 19 Nov), so the person sees which order day a match sits in.
    Gain: the whole collection and "what is still out" are visible at a glance, and a match shows
    where it sits in time. Loss: a canvas is not native UI; the design reviewer may grade it
    web-like. The canvas has a name and a text equivalent (the count and the list), and each act on
    it also works from the list. Tap a dot to open its order. Owner grant: yes.
21. **A letter pad that knows the data replaces the keyboard.** A to Z in order, space, delete,
    123 for prices and days, Clear. Each key shows how many lines are left if it is pressed. A key
    that leads to no line goes dark and does nothing; its spoken label says why. The pad keeps its
    size at AX5, as the system keyboard does.
    Gain: a half-remembered name can be found by letters that are known to lead somewhere; a typo is
    impossible. Loss: not the system keyboard (no dictation, no QWERTY, no autocorrect); iOS ships
    no such control. Owner grant: yes.
22. **Matches any part** of the card name, the seller, the price (`$0.4`) or the day (`11/4`),
    from any letter in the middle, not only the start. Results list the newest first, capped at 40
    with "n more. Press another letter to narrow."
23. **Order**: folded, a sheet with Close leading; open pose, the right page above the pad.
24. **Physical keys** type into the pad when focus is in a Sieve frame (a hardware keyboard on the
    Duo). Dead letters are ignored.

## Search placement

25. **Where search sits in the app.** HIG search-fields gives three places: a search tab (standard,
    or the button appearance that opens the keyboard at once), a bottom toolbar, or inline. I do not
    know the app's other screens, so each concept is drawn as a whole screen with no tab bar.
    Pocket field fits the search tab with the button appearance; Fill-in sentence and Sieve fit a
    standard search tab with their own landing page. Owner grant: yes (where search lives).

## Critique (impeccable, run on this mockup)

Method: design review only, the native-platform path, run in this designer's own context. No
detector, no snapshot. Score: 27 of 40.

26. **Fixed:** one act, three names. "Clear search", "Clear the blanks" and "Clear" now all read
    "Clear search" (house rule ux-one-plain-name).
27. **Fixed:** in the open pose, Fill-in sentence said "the sentence below" on the right page while
    the sentence sits on the left page. It now says "on the left page", and the duplicate hint on
    the left page is gone.
28. **Fixed:** list rows shrank to slivers in long scroll areas, and AX5 answer text stayed at body
    size. Both are fixed.
29. **Open, AX5:** in Sieve the fixed-size pad and the dot field leave about one row for results,
    and in Fill-in sentence the sentence panel takes 58 percent of the screen. Both scroll, so
    nothing is lost, but the answer is small. Choosing between hiding the dot field at AX5 and
    collapsing the sentence to the blank being edited is an owner choice.
30. **Open:** the large phone is still a stand-in drawn at the folded size.

Input needed (the critique's closing questions):
- Is Sieve's dot field worth its height on the folded pose, or should it shrink to a strip once
  results show?
- Should Fill-in sentence also take an exact price, as the other two concepts do?
- Which one concept, or which part of each, goes forward?
