# MANIFEST on the iPhone Duo

Ideation only. Nothing here is built, and no Swift changes. Open `index.html` to see every mockup side by side. Each mockup has a notes file with one item per choice.

Regenerate the pages with `node docs/design/duo/draw.mjs`. One data set and one set of components feed every option, so options differ only in what they test.

## Sizes

| Pose | Size (pt) | Source |
|---|---|---|
| Open, flat | 951×669, two pages of 469 | Measured on the device: degen `WindowSupport.swift`. |
| Fold | 13 wide at x 469 | Degen test fixture (`DuoSpreadTests`). Unmeasured. |
| Closed, outer screen | 466×678 | Measured on the device: degen `WindowSupport.swift`. |
| Held tall, laptop | 669×951, fold across | The open size turned. Degen's tests use 626×890 instead; neither is measured. |

A page is 469 pt wide, close to the closed screen's 466. So each page can hold today's phone layout unchanged.

## What degen does, and why

- **Book spine.** The left page shows where you are. The right page shows what you look at. A tap on the left changes only the right page.
- **Two pages only on a fold.** The app reads the hinge status and the fold region (`reservedRegions(kind: .division)`, iOS 27.1). With no hinge, or a closed hinge, it shows one page.
- **Custom tab bar under the left page.** The system bar spans 29–71% of the width, measured on the simulator, so it crosses the fold.
- **Poses.** Held tall or in the laptop pose, the pages stack, top and bottom. Tent is not built.
- **Close keeps the right page.** The outer screen shows what you looked at.
- **Grid pinned, not a sliding book.** Pages from the right page open over it, as on a phone. The owner picks a sliding book later, after real use.
- **Method.** A blind first-principles mockup came first. The owner then picked, and Apple's wide side bar was ruled out.

These mockups follow the same method. Degen's answers are a reference, not a template: its screens are a media feed, and MANIFEST's are a checklist.

## Questions for the owner

Each question shows the options and a pick. Until the owner rules, nothing is built.

1. **Tab bar on two pages** (`chrome.html`). A: custom bar under the left page. B: system bar across the fold. C: two half bars. **Pick A.** It changes the native bar in `phone-nav-is-bottom-bar`.
2. **Packages split** (`packages.html`). A: index left, package right. B: two card columns. C: masthead left, list right. **Pick A.** The package you check never scrolls away.
3. **Tally split** (`tally.html`). A: rows left, copies right. B: Tally left, package right. C: masthead left. **Pick A.** B changes where an order id tap goes.
4. **Orphaned split** (`orphaned.html`). A: pile and composer. B: envelope and candidates. C: Orphaned and Packages. **Pick B.** Assigning is the decision, and candidates need room.
5. **Ledger split** (`ledger.html`). A: Ledger and working view. B: groups and panel. C: View and Data. **Pick B.** Panels stop pushing the list.
6. **What closing keeps** (`closed.html`). A: the right page. B: the left page. **Pick A.** You keep the card you were checking.
7. **Find on two pages** (`chrome.html` D, E). D: over the page with the list. E: top of the right page. **Pick D.** It stays in thumb reach.
8. **Tall and laptop** (`poses.html`). A: masthead top. B: index top, package bottom. C: laptop, package on the stand. **Pick B** now; C after real use.
9. **A link on the right page.** Open over the right page, as degen's grid pinned. Or slide the book one page left. **Pick: open over it.** It builds the least.

## Unmeasured

- The fold's width and position on the device.
- The keyboard's span and height on the open Duo. Orphaned A depends on it.
- The open Duo's status row height. Degen saw taps swallowed down to about 80 pt.
- The tall-pose window size: 669×951 or 626×890.

## Waits on restyle steps not yet built

- `native-masthead-packages-only`, the native masthead on Packages only. Every option draws it on all four tabs.
- `native-ledger-tab-unbuilt`, the native Ledger tab lacks the View and Sync groups. Ledger B needs both.
- `native-filters-tally-only`, native Find and filters exist on Tally only. Find on Packages needs them.
- `panels-overlay-unbuilt` and `panel-paper-fill-unbuilt`, panels still push the list. Ledger A and C need the overlay; B does not.
- `native-orphaned-colours-unbuilt`, native Orphaned uses system colours. Every Orphaned option draws the parchment palette.
- `native-order-id-link-unbuilt`, the native order id link. The index rows and Tally B need it.
- `native-tally-copy-no-stepper`, native Tally copies have a toggle only. Tally A draws the web's controls.
- `native-envelope-has-no-photos` and `native-photo-screens-unwired`, no native photos. No option draws them.

## Not drawn

- Dark theme: the repo ships one palette (`shared/tokens.json`).
- Tent pose: MANIFEST has no use for a screen that faces away.
- The advisory sync line: it is held out of every frame, so it cannot skew a comparison.
