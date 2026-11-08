# Orders extension, options page: design notes

Mockup: `options.html` beside this file. Open it from disk. Plan: `orders-extension` (Flow, Failures, Worker contract, Extension). Badge: `badge.html` and `badge-notes.md`.

Size: one Chrome tab, 960 by 720 px of page. `layout.py devices` prints `unknown` for this repo, and the brief names no size, so the width is the designer's choice. It is not taken from `test/screens.mjs`, whose widths are the app's phone and tablet sizes. The column is 520 px at most, so any tab from about 570 px wide draws the same page.

Themes: light (the repo's tokens) and dark (proposed, item 2). `t=both` draws both side by side; `t=light` or `t=dark` draws one.

Deep links: `#s=` one of `first`, `saved`, `ok`, `zero`, `unreadable`, `signedout`, `fetch`, `timeout`, `empty`, `noitems`, `refused`, `offline`, `toolarge`, `pulling`, `notab`, `clearing`. Add `&t=both|light|dark`. Options: `&tab=answer|disabled`, `&check=on|off`, `&clear=arm|once`, `&stop=on|off`. Each option chip has a × that hides it.

Measured in headless Chromium, every state, both themes: the Save key button and the Pull now button sit at the same place in all 16 states. No answer moves them. No script error.

## Choices

1. **Look.** The app's own vocabulary, abridged: the wax seal between gold rules, MANIFEST in Cochin caps, a mono house line, then hairline sections with uppercase mono micro-labels over Cochin values. Read from `src/app.jsx`: `Seal`, `.mdl-head`, `cellLab`, `partGrid`, `partVal`, `keyField`, `optCell`, `restoreCell`. Gain: the extension reads as part of MANIFEST. Loss: the house token rule "app chrome uses the system font" is not followed; the app itself sets Cochin throughout, and the repo wins. The uppercase micro-labels are a ruling (`ruled-head-masthead-vocabulary`), so they stay. Pick: this.

2. **Dark palette (proposed).** The app ships one light palette and no `prefers-color-scheme` rule (`design-parchment-ledger`; the iOS app is held to light). The brief asks for dark, so this mockup proposes a set. Measured ratios, all over the 4.5:1 floor of `palette-tokens-contrast-floor`:

   | role | value | ratio |
   |---|---|---|
   | paper | `#1E1B24` | — |
   | card | `#27232E` | — |
   | ink | `#EFE6D6` | 12.41 on card |
   | inkSoft | `#B1A6BB` | 6.62 on card |
   | line | `#443D4D` | — |
   | accent | `#A796DA` | 5.87 on card; paper text on it 6.48 |
   | green | `#6DBB98` | 6.74 on card |
   | red | `#E3857B` | 5.79 on card, 5.41 on redSoft |
   | redSoft | `#3A2426` | — |
   | manila | `#3A3122` | — |
   | manilaInk | `#E2CB96` | 8.05 on manila |
   | amber | `#D9AE4A` | 7.40 on card |

   Gold stays `#C9A961`, ornament only, in both. The seal keeps its wax ramp. Gain: the page follows the owner's system theme. Loss: a second palette to keep, and the values need a home in `shared/tokens.json`, outside this folder. Pick: draw it, ship it only on the owner's word.
   Departs from: `design-parchment-ledger` (one palette, values only in `shared/tokens.json`). Not blocking. Owner grant: yes.

3. **Section order: Device key, Pull, Last failure, Last run.** The brief lists Last run and Last failure before Pull. Gain: Pull now sits above every block that changes after a pull, so a failure that arrives while the pointer is on Pull now moves nothing under it (`no-layout-shift-under-pointer`). Last failure sits above Last run so its fix and its control show without a scroll at 720 px. Loss: the status reads after the action. Pick: this order.

4. **Key field.** `type=password`, the app's write-on rule at 16 px (`keyField`, `token-field-is-sixteen-pixels`). No reveal control. Save empties the field. The page never shows the key, its length or its first characters: one status line says `A key is saved.` or `No key saved.` (`the-token-is-a-credential`). Placeholder: `Paste the device key`, then `Paste a new key`. Pick: this.

5. **Save checks the key** (`#key-answer`, ids `light-keyans` and `dark-keyans`). Options: Save stores the key, then calls `GET /orders/status` with it and answers `Saved. The server accepted this key.` or `The server refused this key.`; or Save stores only and answers `Saved.` Gain of the check: a wrong key shows at the press, not hours later at the first pull. Loss: one more request, and the page needs the Worker origin, which the host permissions already name. Pick: check.
   Options: `#s=saved&check=on`, `&check=off`. Focus: `light-keyans`.
   Departs from: the plan's Flow, which sends the key only with a pull. Not blocking. Owner grant: yes.

6. **Clear key.** Options: press twice in place, as `restoreCell` arms (`red` fill, `Press to clear`, answer `Press again to clear. Pulls stop until a key is saved.`); or one press. No native confirm (`no-native-dialogs`). The button is 120 px whatever its label. With no key saved it keeps its box, hidden, so Save never moves. Gain of two presses: a stray click cannot stop the pulls. Loss: one more press. Pick: two presses.
   Options: `#s=clearing&clear=arm`, `&clear=once`. Focus: `light-clear`.

7. **Pull now.** The accent fill, the app's "active" colour. Disabled with no key saved; the reason `Save a device key first.` sits in the answer slot and is named by `aria-describedby`. A help line under it: it runs in an open `store.tcgplayer.com` tab where the owner is signed in, and it runs by itself when a store page loads and the last pull is over 12 hours old.

8. **No store tab open** (`#pull`, ids `light-pull`, `dark-pull`). Options: Pull now stays live, and a press with no store tab answers `No store.tcgplayer.com tab is open.` with an `Open TCGplayer` control; or Pull now is disabled while no store tab is open, with the same line and control as its reason. Gain of the answer at press: no tab listener, and the button never changes under the pointer. Loss: the owner learns only on the press. Pick: answer at press.
   Options: `#s=notab&tab=answer`, `&tab=disabled`. Focus: `light-pull`.

9. **Stop while pulling** (`#pull-answer`, ids `light-pullans`). The page loop has no page cap and each fetch may take 30 s. While a pull runs, the button reads `Pulling` (disabled) and the answer reads `Pulling order page 3…` with a `Stop` control (`ux-long-run-stops`). Stop sends no pages and merges nothing. Options: with Stop, or without. Gain: a long or stuck run can end. Loss: one more message between page and service worker. Pick: with Stop.
   Options: `#s=pulling&stop=on`, `&stop=off`. Focus: `light-pullans`.
   Departs from: the plan, which names no Stop. Not blocking. Owner grant: yes.

10. **Answer slots.** One 20 px line under the key row and one under Pull now, always rendered, mono 11 px, as the app's `syncKeyMsg` slot. Green for a success, red for a refusal, inkSoft otherwise.

11. **Last run.** Rows: When, Outcome, Last pulled (only after a failure: the last success), Next. Outcome is `Pulled.` or `Failed.` and a mono figure, such as `41 orders read, 12 new lines`. "Lines" is the app's word for an item row (`N lines` in the ruled head), and `added` counts item rows, not cards. Next names the 12 h gate: `after 9:14 PM, on the next store page load`. Times are the owner's local time, as `Sun, Nov 8, 9:14 AM`: `toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })`. Never run: `Never. The first pull runs when a store page loads.`

12. **Last failure.** The app's advisory block (`photoMsg`: `manila` fill, `manilaInk` text, 8 px radius): what happened, when, the fix line, one control that leads on, and a closed `What the extension recorded` disclosure with the raw kind (`ux-machine-text-hidden`). With no failure: `None.` Copy per kind:

    | kind | line | fix | control |
    |---|---|---|---|
    | `signed-out` | Signed out of TCGplayer | Open TCGplayer and sign in, then load any store page. | Open TCGplayer |
    | `fetch` | TCGplayer did not answer the order page | TCGplayer may be down or busy. Pull again in a few minutes. | Pull now |
    | `timeout` | An order page took over 30 seconds | TCGplayer is slow right now. Pull again later. | Pull now |
    | `empty` | The order page held no orders | TCGplayer may have sent its sign-in page. Open TCGplayer and sign in, then pull. | Open TCGplayer |
    | `no-items` | No TCGplayer card orders in the last 120 days | Nothing was added. If you ordered cards in that time, report it. | none |
    | `unreadable` | N lines could not be read and were left out | The other lines were added. Nothing was guessed. | none |
    | `unauthorized` | The server refused the device key | Paste the device key again and press Save key. | Go to the key field |
    | `network` | The ledger server did not answer | Check the connection, then pull again. Nothing was sent. | Pull now |
    | `too-large`, `bad body` | The order pages were too large to send | Nothing was added. This needs a change to the extension or the server. Report it. | none |

    `unreadable` shows here while Last run reads `Pulled`, because the plan keeps it in `lastFailure` after a success that dropped lines.

13. **Two sources, builder must follow.** The Worker records only what reaches `POST /orders`. A 401, a 413, a 400 or a network failure never lands in `GET /orders/status`, and `GET /orders/status` itself answers 401 to a wrong key. So the extension keeps its own record of its last attempt in `chrome.storage.local` (time, outcome, counts, kind), and the page reads that first. It reads `GET /orders/status` for `lastSuccessAt` and the Worker's kinds when the local record is missing or older. The key never enters that record.

14. **Names.** Tab title and extension name `MANIFEST orders`; house line `TCGplayer orders`. The masthead is MANIFEST (`masthead-is-not-project-name`); the extension sits under it, not under the project name.

15. **Icon.** The favicon drawing (`favicon_svg()`, record `assets-and-icons`), not the seal and not the 1024 master, because the master fails at 16 px. The extension needs it exported at 16, 32, 48 and 128 px: a builder task outside this folder.

16. **Labels on the page.** Dashed `New: options page` and `Today: Chrome` labels; the Labels chip hides them.
