# Orders lamp, directed designer 1: design notes

Mockup: `orders-job-directed-1.html` beside this file. Open it from disk. Designer kind: directed. Direction: status-light: a glanceable state and one button.

Screen: the orders status screen, unbuilt (debt `orders-job-unbuilt`). Data: `GET /orders/status` in `worker/core.mjs` (the status route), today `{ lastSuccessAt, lastFailure: { kind, at, count? } }`. Plan: `orders-extension` (Flow, Failures, Worker contract). Badge and options page: `orders-extension/badge-notes.md`, `orders-extension/options-notes.md`.

Deep links: `#s=` one of `good`, `unreadable`, `quiet`, `signedout`, `fetch`, `timeout`, `empty`, `noitems`, `asked`, `running`, `noanswer`, `unknown`, `never`, `nosync`. Add `&btn=pull|check`, `&d=folded|open|phone|ax`, `&hide=row,signal,letter,button,opt-pull,opt-check`, `&labels=off`. Example: `#s=fetch&btn=pull&d=folded`. Focus ids for a pick: `row-lamp`, `signal-lamp`, `letter-lamp` (concepts), `btn-pull`, `btn-check` (the one button).

Sizes: Duo folded 466 x 678 pt, tab bar region y 595 to 678 (measurement `duo-fold-and-keyboard`). Duo open 951 x 669 pt, fold x 455.5 to 495.5 (brief). `layout.py devices` prints `unknown` for this repo. The large phone has no written size, in the repo, the brief or Apple's layout page: it is drawn at 466 x 678 pt. The status bar foot is drawn at 20 pt, unmeasured. The open pose's bar height is drawn at the folded 83 pt, unmeasured. Measured in headless Chrome, all 14 states: no element crosses the fold, every button and disclosure is 44 pt or more, no script error, no sideways scroll at a 390 px window.

Theme: light only. The app and the native client ship one palette (`design-parchment-ledger`; the native app is held to light).

Apple pages, read 2026-11-21 through `tutorials/data/.../*.json` (each answered 200): layout, typography, accessibility, buttons, sheets, tab-bars, toolbars. Used: Dynamic Type sizes, Large (default) and AX5 (typography); 44 x 44 pt control size (accessibility, buttons); Done on the trailing edge of a sheet (sheets); the tab bar floats at the bottom (tab-bars). The layout page holds no device size table now.

## Choices

1. **Concept: Ledger row** (`#s=good&hide=signal,letter`, focus `row-lamp`). An Orders row first in the Ledger tab's Data group, its value the lamp and one word. A press opens the panel in place, as Sync opens (`LedgerTab.syncRow`, native `LedgerTab.swift`). Gain: today's pattern, least to build, no new screen. Loss: seen only on the Ledger tab, one tap away from the working views. Folded and phone: the panel opens under the row. Open: the row is the list item and the panel is the right page.

2. **Concept: Signal screen** (`hide=row,letter`, focus `signal-lamp`). The Orders row pushes a screen: a 120 pt lamp in a gold ring, one Cochin sentence, one mono figure, the particulars, and the one button pinned above the tab bar. Gain: the strongest read of the direction, the button in the thumb's reach (`ux-thumb-zone`). Loss: two taps from a working view; a screen of its own for five facts.

3. **Concept: Letterhead lamp** (`hide=row,signal`, focus `letter-lamp`). A 22 pt lamp in a 44 pt slot at the right of the masthead's seal row, on every working screen. A press opens a sheet (Done trailing) with the signal and the button. The slot is absolute, so the masthead does not change height. Gain: the answer shows while you check in mail, with no tap. Loss: it changes the ruled letterhead; 22 pt reads by colour and a small glyph.
   Departs from: `masthead-is-one-letterhead` (seal, rules, title, house line, tallies; no status mark). Not blocking. Owner grant: yes.
   Pick: Letterhead lamp, with Signal screen's layout inside its sheet. Fallback if the masthead stays as ruled: Signal screen.

4. **The one button** (section The one button, focus `btn-pull` and `btn-check`). Pull from phone: `Pull now` asks the computer to pull. The Worker holds the ask; the extension checks for it on a `chrome.alarms` period while Chrome runs, pulls in a store tab (opens one in the background when none is open), and reports `asked`, `running` with a page count, then the result. `Stop` takes the ask back in the same box. Check only: `Check again` reads the status again and starts nothing. Gain of pull: it answers "start it by hand" from the phone. Loss: a Worker route, an extension poll (one Worker read per alarm period while Chrome is open, unmeasured), and a pull with no tab the owner opened.
   Departs from: the plan's Flow (a pull runs only when a store tab loads past the 12 h gate, or from the options page). Not blocking. Owner grant: yes.
   Pick: Pull from phone. Check only is drawn whole, so it can ship first on today's Worker.

5. **Lamp states.** Colour by meaning, with a shape for each, so colour is never the only cue. The meanings follow the badge (`badge-notes` item 2).

   | lamp | fill | glyph | states |
   |---|---|---|---|
   | pulled | `green` | tick | good, unreadable |
   | needs you at the computer | `amber` | clock, or `in` | quiet, no answer; signed out |
   | failed | `red` | `!` | fetch, timeout, empty, no-items |
   | running | `accent` | three dots, written in turn | asked, running |
   | unknown | `silver`, dashed `inkSoft` edge | `?` | unknown, no sync key |
   | never run | `card`, `inkSoft` ring | none | never |

   The hero lamps (64 pt and up) carry a 1.5 pt `gold` ring, ornament only (`palette-gold-is-ornament-only`).

6. **Unknown is not empty** (`ux-unknown-is-not-empty`). Can't reach the server, no sync key, and never run are three states, and none shows as zero or done. Their particulars read `Unknown` or `Never`, never `0`.

7. **Quiet after 48 h.** No success in 48 h and no failure reads amber, `No pull in 4 days.` The extension pulls only when a store page loads, so a quiet week can be normal. Options: 24 h, 48 h, 7 days. Gain of 48 h: a missed evening still reads green. Loss: a lost day reads green. Pick: 48 h.

8. **The status must keep the counts.** `New lines` and `Orders read` need the status to hold `added` and `orders` from the last success. Today the POST reply carries them (`added`, `orders`) and the status keeps neither (`worker/core.mjs`, the status write). Builder task outside this folder. Without it, the row drops both lines and the sentence ends at the time.
   Departs from: the plan's `GET /orders/status` shape. Not blocking. Owner grant: yes.

9. **Failures the phone cannot see.** A 400, 401, 413 or a network failure never writes the status (plan, Worker contract), so the phone sees only an ageing last success, which turns amber at 48 h. Fix outside this folder: the extension posts these as failure kinds once it can reach the Worker. Not drawn. Owner grant: yes.

10. **Copy.** One sentence and one figure per state, the act named Pull as on the options page.

    | state | sentence | figure |
    |---|---|---|
    | good | Pulled 2 hours ago. | 12 new lines from 41 orders. |
    | unreadable | Pulled 2 hours ago. | same, plus a manila line: 3 lines could not be read and were left out. Nothing was guessed. |
    | quiet | No pull in 4 days. | Chrome pulls when you open a TCGplayer page on your computer. |
    | signed out | Signed out of TCGplayer. | Sign in to TCGplayer in Chrome on your computer. The next store page you open pulls. |
    | fetch, timeout, empty | The last pull failed 46 minutes ago. | per kind, as the options page table, ending "Nothing was added." |
    | no-items | The last pull found no card orders. | No TCGplayer card orders in the last 120 days. Nothing was added. |
    | asked | Asked your computer to pull. | Waiting for Chrome on your computer to pick it up. |
    | running | Pulling on your computer. | Order page 3 read. |
    | no answer | Your computer did not pick up the pull. | Asked 15 minutes ago. Chrome may be closed, or the computer asleep. |
    | unknown | Can't reach the ledger server. | This phone could not read the orders status. Nothing is known about the last pull. |
    | never | No pull has run yet. | The first pull runs when you open a TCGplayer page in Chrome on your computer. |
    | no sync key | This phone has no sync key. | The orders status comes through Sync. Set up Sync to see it. |

    The status word shows once: the row's value (`Pulled`) and the sentence (`Pulled 2 hours ago.`) is a word in a sentence (`ux-label-once`).

11. **One box, one place.** The button keeps its box and its place in every state: `Pull now`, `Stop`, `Check again`, `Open Sync` (no sync key). Its answer slot under it is always 20 pt, so an answer moves nothing (`no-layout-shift-under-pointer`, `ux-answer-at-press`). `Stop` is the long run's stop (`ux-long-run-stops`). For 0.8 s after `Pull now`, the button takes no press, so the second tap of a double tap cannot stop the pull it asked for.

12. **Signed out keeps Pull now live.** The fix is on the computer, so no control on the phone fixes it; the sentence says where. Option: disable the button with that sentence as its reason. Pick: live; a pull asked now runs once the owner signs in.

13. **Machine text hidden.** The status JSON sits in a closed `What the server said` disclosure (`ux-machine-text-hidden`). It never holds the key.

14. **Duo open spreads the Ledger tab.** Ledger row and Signal screen use two pages: list or signal left, detail right. Today the Ledger tab draws one page (`DuoSpread.spreads`, `.ledger: false`, in `ManifestKit/DuoSpread.swift`). Letterhead lamp opens its sheet on the right page only; the left page keeps Packages.
    Departs from: `DuoSpread.spreads` for `.ledger`. Not blocking. Owner grant: yes.

15. **AX5.** Rows wrap, the particulars stack label over value, and Signal screen's button joins the flow under the sentence instead of pinning, so the reading area is not cut to a strip. Nav bar and sheet titles stay at 17 pt, as UIKit draws them. The AX5 frames start scrolled past the masthead, which clips at accessibility sizes today (debt `native-masthead-axl-clips`).

16. **Type.** Cochin sets words and Menlo sets numbers (`typography-cochin-and-mono`); each size scales from its Dynamic Type style, as `LedgerTab.swift` does with `relativeTo:`. System font for iOS chrome: status bar, nav bar, sheet header, tab bar. `check_ios_mockup.py` flags Cochin as a non-system font: the repo's ruling wins here, and `duo-hand-post-sender.html` gets the same flag.

17. **Motion.** Busy writes its three dots in turn; the lamp's fill eases between states in 0.25 s. No spinner (`motion-stationery-not-software`). Reduced motion leaves both still (`motion-reduced-leaves-it-drawn`). Haptics: the button changes no value, so none is drawn (`ux-haptics-feel-substantial`).

18. **Labels.** Dashed `Today:` on the masthead and the Data group, dashed `New:` on each added part. The Today / New labels chip hides them.

19. **Not drawn.** A pull-to-refresh on the status (SwiftUI `refreshable`), as a second way to `Check again`. A tab-bar badge on Ledger for a failure, which would compete with the Orphaned count badge.
