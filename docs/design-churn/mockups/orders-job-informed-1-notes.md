# Orders status, informed designer 1: notes

Mockup: `orders-job-informed-1.html` beside this file. Open it from disk. Designer kind: informed.

**The pain.** "Did my new orders come in, or is it broken?" Today the answer lives only on the computer: the extension's badge and options page (`orders-extension/badge-notes.md`, `orders-extension/options-notes.md`). The phone, where the mail is checked, shows nothing. The Worker already keeps `GET /orders/status` (`worker/core.mjs`), and no app screen reads it (debt `orders-job-unbuilt`).

**Two concepts.** Ledger row (quiet): an Orders row in the Ledger tab that opens in place, as Sync does. Postmark (bold): the same row opens an Orders page whose head is a postal cancellation in the state's ink, with a one-sentence verdict under it.

## Deep links

`#c=row|postmark`, `&s=` one of `ok`, `zero`, `unreadable`, `asked`, `running`, `stopped`, `noanswer`, `signedout`, `failed`, `stale`, `never`, `unknown`, `loading`. Options: `&start=ask|none`, `&line=on|off`, `&open=pages|full`, `&page=orders` (Postmark, page open), `&panel=closed` (Ledger row), `&disc=open`, `&tab=packages`, `&labels=off`, `&hide=c:row,og:start,...`. Example: `#c=postmark&s=signedout&page=orders&start=ask`.

Frames: iPhone Duo folded, Duo open, large iPhone, Duo folded at AX5. One theme, light: the native app is held to light (`design-parchment-ledger`); the `dark*` tokens belong to the extension.

## Choices

1. **Where it lives: an Orders row in the Data group, after Sync.** Both concepts enter here. Its sub line and value answer the question without a tap: `12 new`, `Failed`, `Signed out`, `Thu`. It copies `LedgerRow` and the Sync row's open-in-place panel (`native/Manifest/LedgerTab.swift`, `syncRow`, `syncPanel`, `partRow`). Gain: no new navigation; the owner already goes to Ledger for Sync. Loss: from a working tab it takes two taps, unless item 3's line fires. Pick: this row.
   Departs from: `ledger-tab-holds-options`, whose Data group lists Sync, History, Re-import CSV and Backup. Not blocking. Owner grant: yes.

2. **Postmark page (bold concept).** The row pushes a page, large title `Orders` (SwiftUI `NavigationStack`). Its head is a hand cancellation: a double ring with `MANIFEST ORDERS` and `TCGPLAYER`, the date and time in the centre, and wavy bars. The ink carries the state, using the badge's meanings (`badge-notes.md`, item 2): accent for new lines, inkSoft for nothing new, stale or stopped, amber for what waits on the owner (signed out, no answer, lines left out), red for a failure. A boxed overstamp names a failure (`FAILED`, `SIGN IN`, `3 LEFT OUT`). Under it, one sentence answers the question: `12 new lines came in.`, `TCGplayer signed you out.`, `No pull since Thursday.` Then the fix, the lines the pull found, and the last pulls. Gain: the answer reads at arm's length, in the app's stationery voice, not as a settings row. Loss: a new page and a drawn graphic (SwiftUI `Canvas` or `Path`), and the register needs Worker history (item 6). Pick: owner's choice between the concepts.
   Owner grant: yes.

3. **The advisory line can speak for orders** (option `line`, focus id `fold-advline`). With `on`, a failure, a sign-out, an unanswered ask or 2 days with no pull raises the one manila line on Orphaned, Tally and Packages, such as `Orders stopped: TCGplayer signed you out — tap to fix`. A tap opens Ledger with Orders open, as the Sync line opens Sync. The sync cases keep priority; orders come last in `syncBroken`'s order. With `off`, the line stays sync-only. Gain: "is it broken" is answered where the mail is checked, and only when it is broken (`ux-all-is-well`). Loss: a second subject for the one line. The 2-day limit is a guess: pulls run only when the owner opens TCGplayer, and the 12 h gate allows two a day. Pick: on.
   Departs from: `ruled-head-one-advisory-entrance`, which holds sync cases only. Not blocking. Owner grant: yes.

4. **Start from the phone** (option `start`, focus id `fold-ask-ctl`). With `ask`: `Ask my computer to pull`. The phone posts an ask to the Worker. The extension checks for one each minute (`chrome.alarms`). It pulls in an open store tab, or opens one in the background. An ask expires after 30 minutes; after 10 minutes with no pickup the state reads `No answer`, which says Chrome may be closed or the computer asleep. With `none`: no control, and one help line says how pulls start. Gain of `ask`: the owner starts a pull without walking to the computer. Loss: a new Worker route, an alarm and a background tab in the extension. It still needs the computer on with Chrome open. Unmeasured: whether a tab the extension opens carries the sign-in revalidation (debt `orders-job-unbuilt`). Pick: ask.
   Departs from: `orders-extension` plan, Flow step 2 (pulls start on a store page load or from the options page). Not blocking. Owner grant: yes.

5. **Pulling and Stop.** While asked or pulling, the start control is disabled and keeps its box. Its reason shows in the answer row, beside `Cancel` (asked) or `Stop` (pulling) (`ux-long-run-stops`, `ux-answer-at-press`). Measured in headless Chrome: the start control has the same box in all 13 states, in both concepts, and after a press, Stop and the flow. A stop sends nothing and merges nothing, as on the options page (`options-notes.md`, item 9). Loss: the extension sees a stop on its next check, so a real stop can lag by up to a minute; the mockup stops at once. The pulling state needs the extension to post its start and page number. Owner grant: yes (part of item 4).

6. **Data the screen needs. Builder must follow; outside this folder.** `GET /orders/status` gives only `lastSuccessAt` and `lastFailure`. Both concepts need more from the Worker: `lastRun: { at, orders, added, unreadable }` (the counts `POST /orders` already returns), the ask `{ at, state }` and a run `{ startedAt, page }` (item 4). The Postmark concept also needs the last 5 runs, and the lines the last pull added: either the Worker keeps their package keys, or the app compares the item keys before and after the synced ledger arrives. The second needs no Worker change, but it misses lines that arrived before this phone's previous sync. Each is a change to `worker/core.mjs` and `extension/`. Owner grant: yes.

7. **States are distinct** (`ux-unknown-is-not-empty`). `unknown` (the server did not answer) is never drawn as none or zero; it has `Check again`. `loading` keeps the loaded box. `never` names what starts the first pull. `stale` says nothing failed. `unreadable` reads as a success with a warning, as on the options page.

8. **Words.** `lines` is the app's word for an item row; `added` counts lines, not cards (`options-notes.md`, item 11). `pull` is the extension's word (`Pull now`, `Pulled.`), so the act has one name on both screens (`ux-one-plain-name`). Risk: the web guard `guardWords66` (test group 66) fails on `pull`, `pulled` and `pulling` in the Ledger tab's rendered text with Sync open. The native app has no such guard. A web port of this row needs that guard scoped to the Sync panel, or another word. Owner grant: yes.

9. **One act, one control.** The fix block shows no second start button (no `Ask again`); the start control is on the same screen. Only `Check again` (a re-read, a different act) sits in the block. In Postmark the verdict is the heading, so the fix block drops its own (`ux-label-once`). Machine text (the failure kind) sits behind `What the extension recorded` (`ux-machine-text-hidden`).

10. **Signed out has no fix on the phone.** Sign-in happens on the computer (hCaptcha; the plan). With `start=ask`, the start control is the way on after the owner signs in. With `start=none`, the block has no control: a dead end (`ux-no-dead-end`), which is that option's cost.

11. **Open Duo: two pages** (option `open`). Ledger row: the Ledger list on the left page, the picked row's detail on the right (`pickedMark`, `Theme.swift`). Postmark: stamp, verdict, fix and start control on the left; found lines and last pulls on the right. The tab bar sits under the right page. `full` draws today's full-width Ledger and tints the fold to show the crossing (`docs/debts/notes.md`, 2026-10-28 line). Gain: nothing sits on the fold, as the brief asks. Loss: Ledger spreads, unlike today. Pick: two pages.
    Departs from: `duo-card-in-hand`, round 2 item 24 (Ledger stays full width). Not blocking. Owner grant: yes.

12. **Motion.** The postmark lands when a new result arrives, as the RECEIVED stamp does (`motion-the-stamp-lands`, guarded by `useJustBecame`). Reduced motion draws it at its final frame (`motion-reduced-leaves-it-drawn`). Nothing else moves.

13. **Haptics.** None. No control changes a value (`ux-haptics-feel-substantial`). A success haptic when a pull lands is possible, but the phone is often face down while the computer pulls.

14. **AX5.** Rows and label/value pairs stack (`ViewThatFits`, as `versionRow` stacks). The start control and Stop wrap. Tab bar labels stay at the default size (`duo-card-in-hand`, Tab bar text). The postmark stays a fixed-size image; its accessibility label carries its words, and the verdict under it grows.

15. **Type and chrome.** Content: Cochin for words, Menlo for numbers (`typography-cochin-and-mono`, `Font.cochin`, `Font.mono`). Chrome: system font for the back button, large title and tab bar. `check_ios_mockup.py` faults the Cochin declarations, because it cannot tell content from chrome. The repo's ruling wins here, as in `options-notes.md`, item 1.

16. **Sizes.** `layout.py devices` prints `unknown` for this repo. Duo sizes are the brief's: folded 466 by 678 pt, open 951 by 669 pt, fold at x 455.5 to 495.5. Record `duo-card-in-hand` holds an older reading of 382 by 644 pt for the outer screen's safe content, which does not agree. No size is written for the large iPhone; it is drawn at 402 by 874 pt, the designer's pick, and the column is fluid. Safe-area insets (20 pt on the Duo, 54 and 34 pt on the phone) and the 64 pt tab bar are drawing values, unmeasured.

17. **Labels.** Dashed `Today:` marks what exists (masthead, Sync, History, Backup, Reset, the working tabs). Dashed `New:` marks the Orders row, the start control, the postmark, the register and the orders case of the line. The `Today and New labels` chip hides them. Each concept and each option group has a × that hides it.

## Apple pages read 2026-11-21

Read as JSON under `developer.apple.com/tutorials/data/`; each answered 200.

- Typography: the iOS Dynamic Type tables. Default (Large): Large Title 34, Title 1 28, Title 3 20, Body 17, Callout 16, Subhead 15, Footnote 13, Caption 1 12, Caption 2 11. AX5: 60, 58, 55, 53, 51, 49, 44, 43, 40. The AX5 frame scales each app size by its style's ratio.
- Accessibility: iOS default control 44 by 44 pt, minimum 28 by 28 pt; text to at least 200 percent.
- Buttons: a hit region of at least 44 by 44 pt.
- Layout, tab bars, toolbars, lists and tables: fetched; no number taken from them.
