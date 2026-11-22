# Orders run log (directed 2): design notes

Mockup: `orders-job-directed-2.html` beside this file. Open it from disk. Designer kind: directed. Direction: run-log, a readable history of every run.

Debt: `orders-job-unbuilt`. Plan: `orders-extension`. Earlier pages for the extension: `orders-extension/options.html` and `orders-extension/badge.html`, with their notes.

## Sizes, theme, links

- iPhone Duo, folded: 466 x 678 pt. Open: 951 x 669 pt, fold from x 455.5 to 495.5, kept empty. Both from the brief. `layout.py devices` prints `unknown` for this repo, and `layout.json` gives no Duo size.
- Large iPhone: no size is written in the brief, `layout.json` or the repo. The frame uses 375 x 812, the phone viewport in `test/screens.mjs` (`WIDTHS[0]`, and 812 tall in `freshVisitorCheck`). It is narrower than an 18 Pro.
- AX5, folded: two frames, the top and the log. Sizes are the default size times the AX5 / Large ratio of each text style, from the HIG Dynamic Type table.
- Status bar foot and home indicator: unmeasured. Drawn at the 20 pt floor the UI tests use (`DuoHandUITests.statusBarFloor`), as `duo-hand-gaps.html` does.
- Theme: light only. The native app is held to light (`design-parchment-ledger`, `UIUserInterfaceStyle`). The dark keys in `shared/tokens.json` belong to the extension.
- Deep links: `#s=` one of `ok`, `nothing`, `partial`, `failed`, `quiet`, `never`, `unknown`, `asked`, `running`. Add `&c=daybook|register`, `&gaps=on|off`, `&pull=head|foot`, `&detail=lines|count`, `&v=orders|detail|ledger`, `&sel=<run id>` (such as `r19b`), `&row=<run id>` (Register, one page), `&hide=<key>=<value>,...`. Each deep link draws a fixed state. Only a press starts the timed Pull now sequence.

Checked headless (Chrome through Playwright): no script error in any state; the page does not scroll sideways at 375 px; each option's focus id finds one visible element; paired options draw different pictures; each hide chip removes its option; no id repeats. `label_once.py` on the rendered folded frame, both concepts: no hit.

Apple pages read 2026-11-21 (each answered 200, through the `tutorials/data/...json` path): layout, typography (the Large and AX5 Dynamic Type tables), accessibility (44 x 44 pt default control, 28 x 28 minimum, text to 200 percent), buttons (44 x 44 hit region), lists-and-tables, tab-bars (navigation, not actions), toolbars (large title), sheets, progress-indicators.

## Choices

1. **Concept** (`#c=`, focus `log-folded`). Two ways to write the same runs.
   - **Day book** (`c=daybook`): runs as dated entries in plain sentences, under a head that answers the question. A double rule down the margin sets the time off from the entry, as in a written day book. On the open Duo, the book is the left page and the picked run is the right page: a list beside its detail (HIG layout, size classes).
   - **Register** (`c=register`): runs as ruled lines (when, started by, read, new, a mark), with a double-ruled weekly total under each week. A two-week strip of days sits above it (four weeks on the open Duo). A day's mark shows the rhythm: a filled dot for new lines, a ring for nothing new, a cross for failures only, a dash for no run, a red dot when any run that day failed. A press on a day filters the register to it. A segmented control filters to failures or to runs with new lines.
   Gain of the day book: reads as sentences, failures carry their fix inline. Loss: fewer runs per screen. Gain of the register: a week reads at a glance, and totals answer "how much came in". Loss: the reader decodes marks and columns; the legend is one more line. Pick: day book. The owner's question is a sentence, and the day book answers in sentences.

2. **The head answers first.** One fixed box above the log, in every state: a mark, a short answer, one sentence, and a line for the next pull. Answers: `Came in.`, `Ran. Nothing new.`, `Came in, with gaps.`, `Not coming in.`, `No run since Monday.`, `No run yet.`, `Can't tell right now.`, `Waiting for the computer.`, `Running now.`. Unknown never reads as empty (`ux-unknown-is-not-empty`): the log keeps its last read and says when. The box has one fixed height (184 pt, 128 pt without Pull now) with Pull now pinned to its foot, so no answer moves the button or the log (`no-layout-shift-under-pointer`); checked headless, the button keeps its place from `ok` through `asked`. The Next line reuses `nextPullAt` (`extension/core.mjs`) and the options page's wording.

3. **Silence is written** (`#gaps=`, focus `log-folded`). With `gaps=on`, a stretch of more than 24 hours with no run is a hatched line in the log: `No run for 2 days, 13 hours.` The first one adds why a run happens at all. It never guesses the cause: the extension cannot know if Chrome was closed. With `gaps=off`, only runs show. Gain: "is it broken?" is often "did it run?", and a run log that leaves out silence hides the answer. Loss: more lines. The 24 hour mark is a guess; the 12 h gate (`shouldPull`) means a store page load can start at most two automatic runs a day. Pick: on.

4. **Pull now from the phone.** One Pull now under the head. A press asks the extension to pull. The answer shows where the press was (`ux-answer-at-press`): `Waiting for the computer.` with Cancel ask, then `Running now.` with Stop (`ux-long-run-stops`), then a new entry at the top of the log and `Done. 2 new lines.` in the slot. While a run is busy the button reads `Asked` or `Pulling`, disabled, and the slot holds the reason and the one control. Stop adds an entry, `Stopped. Nothing was added.`, as the extension's Stop merges nothing (`pull` in `extension/background.mjs`).
   Departs from: `orders-extension` plan, Flow: a pull starts only on a store page load or the options page's Pull now (`startPull`, `chrome.tabs.onUpdated` in `extension/background.mjs`). Not blocking. Owner grant: yes.

5. **Where Pull now sits** (`#pull=`, focus `frame-phone`). `pull=head`: in the head, with its answer slot beside it. `pull=foot`: in a card docked above the tab bar, in reach of the thumb (`ux-thumb-zone`). Gain of the foot: the one action sits under the thumb on a phone held in one hand. Loss: the dock covers about 80 pt of log, and the answer sits further from the head that changes. Pick: foot on the phone and the folded Duo. The open Duo keeps it in the head, as each page is half as wide and held in two hands.

6. **A run's page** (`#detail=`, focus `detail-open`). Folded and phone: a press on an entry pushes the run's page (back reads `Orders`). Open Duo: it fills the right page. Register: the row opens in place under itself, on every device; on the open Duo the newest row starts open. The page holds ruled label and value pairs (`partRow`, `sync-particulars-ruled-values`): started by, when, orders read, pages, took, new lines, left out. `detail=lines` also lists the new lines, five then `N more lines`. `detail=count` shows the count only. A failure shows its fix in the manila advisory box. The pushed run page adds Pull now there, as it is the only control that leads on from that screen (`ux-no-dead-end`); where the head's Pull now is on screen, the box holds no second one, and the raw kind in a closed `What the extension recorded` disclosure (`ux-machine-text-hidden`). Gain of the lines: "did my new orders come in" is answered with the cards themselves. Loss: the Worker must keep each run's added keys. Pick: lines.

7. **Words.** "Lines" is the app's word for an item row; `added` counts lines, not orders, so the screen never says "new orders". `orders` is the count read across 120 days, written apart from new lines. Failure copy is the options page's (`options-notes.md`, item 12). Times are the owner's local time, `Fri, Nov 20, 9:14 AM` in full, `9:14 AM` in a dated group. The screen calls the helper "the extension", the repo's term.

8. **The way in** (frame "The way in"). A new Orders row first in the Ledger tab's Data card, above Sync (`ledger-tab-holds-options`; `LedgerRow` in `native/Manifest/LedgerTab.swift`). Its value is one word or figure in accent: `12 new`, `Nothing new`, `Running`, `Asked`, `Never run`; in manilaInk when it needs a fix: `Failed`, `3 days quiet`, `Unknown` (`rowValueAdvisory`). Its sub line gives the time. Pick: first, as it is the question the owner asks most.

9. **A pushed screen.** Orders opens as its own screen in the navigation stack, not as a panel in place. A log of weeks of runs is too long for an in-place panel.
   Departs from: the Ledger tab's in-place panels (`LedgerTab.history(_:first:)`, `syncRow`; `motion-disclosure-panels-arrive`). Not blocking. Owner grant: yes.

10. **Two pages on the open Duo.** The Orders screen spreads over both pages: the log left, the run right. The left page has no bar, so it runs to the bottom (`DuoPages`). The right page stops above the bar at y 593.
    Departs from: `duo-card-in-hand`, round 2 item 24 b (Ledger stays full width). Not blocking. Owner grant: yes.

11. **Type.** Words in Cochin, numbers in Menlo (`typography-cochin-and-mono`), through `Font.cochin` and `Font.mono` with Dynamic Type. Chrome (status bar, nav bar, tab bar) is the system font. New labels are 11 pt, the HIG minimum. The day heading and register micro-labels are uppercase mono, as `ruled-head-masthead-vocabulary` rules.
    `check_ios_mockup.py` exits 1 on this page with one fault, `system-font`, because it reads Cochin. The repo's ruling sets Cochin. `duo-hand-gaps.html` and `duo-hand-post-sender.html` fail it the same way. The other two checks pass.

12. **AX5.** Rows stack at accessibility sizes, as `LedgerTab.versionRow` does at `isAccessibilitySize`: time, outcome and source each take a line. Day headings stop pinning, as a pinned AX5 heading would take a sixth of the screen. The register drops its column head and writes each figure with its word (`41 read`, `12 new`). The calendar keeps seven columns, with one-letter weekday heads. The nav bar and tab bar keep their size (`duo-card-in-hand`, Tab bar text; the system tab bar offers the large content viewer).

13. **Motion.** One: the head's mark pulses while a run is live. Reduced motion leaves it still (`motion-reduced-leaves-it-drawn`). A new entry is written in at the top with no animation; the log moves under the head and stays off the pressed button.

14. **Taps.** Each control is 44 pt tall or more; the calendar day cells are 52 to 56 pt tall and at least 49 pt wide on one page. A selected entry or row carries a 3 pt accent bar, an overlay that moves nothing.

15. **Not drawn: the advisory line.** A failed or quiet extension could also show on the working screens' one advisory line, which leads to the Ledger tab (`ruled-head-one-advisory-entrance`). That line leads to Sync today, so a second cause needs a ruling. Not drawn. Owner grant: yes.

## What the build needs outside this folder

The log needs data no part keeps today. Each is a builder task, not a design task.

- **A run list on the Worker.** `GET /orders/status` returns only `lastSuccessAt` and `lastFailure` (`worker/core.mjs`, the `/orders/status` route and `record`). It keeps no counts, no source, no history and no running state. The extension already keeps the shape the log needs, locally (`run` in `pull`, `extension/background.mjs`: `at`, `ok`, `orders`, `items`, `added`, `unreadable`, `kind`). The Worker could keep a capped list of that same record plus `by` (store, chrome, phone), `pages` and `secs`, under its own key beside `orders-status`. Size and cap are unmeasured.
- **The added lines.** `detail=lines` needs the merge to return which keys it added (`mergeIntoStore` returns `stats.itemsAdded`, a count).
- **A pull asked from the phone, and Stop.** A new request path from the app to the Worker to the extension. Today the extension listens only to store page loads and its options page.
- **A running state.** The phone can show `Running` only if the extension reports a start and its page to the Worker.
- **The Orders row and screen** in `native/Manifest`, with tests.
