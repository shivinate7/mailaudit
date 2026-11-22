# Order id chips: notes

Designer kind: directed. Direction: copy-first: the number is a one-tap copy chip. Mockup:
`order-ids-directed-1.html`. Sample data only. Native iOS, light only: the app and the native client
are held to light (`design-parchment-ledger`).

Deep links: `#c=<today|links|split|menu>`, `#d=<folded|open|phone|ax5>`,
`#s=<idle|copied|refused|menu|order|tcg>`, joined with `&`. No hash shows every option on every device.
Focus ids for the page: `focus-today`, `focus-links`, `focus-split`, `focus-menu` (the first copy line's
order id, Duo folded).

## Sources

- Today, native: `ItemLine.lines` in `native/Manifest/ItemLine.swift` sets the id as `Text(orderID)`,
  Menlo 10.5 relative to body, `fixedSize()`. No tap, no link, no copy. Tally passes it from
  `TallyRowView.copyLine` in `native/Manifest/TallyView.swift`.
- Today, web: `ItemRow` in `src/app.jsx` draws the Tally id as a button (`onOpenOrder`) that opens the whole
  order in Packages, with `stopPropagation`, and ends a long id in an ellipsis (debt
  `order-id-visible-unbuilt`). The package header id is a TCGplayer link, and nothing copies
  (`order-id-button-stops-propagate`, owner 2026-10-21 00:10 CDT).
- Link URL: `tcgplayerOrderUrl` in `src/view-rules.mjs`. Whether TCGplayer lands on the order or the list
  is unmeasured (debt `tcgplayer-link-opens-history-list`). No record holds a URL for one order's own page.
- Open Duo layout: `TallyView` draws names on the left page and the picked name's copies on the right
  (`TallyView.detail`, pose 9). Kept.
- Folded size 466 x 678 pt and the tab bar from y 595 pt, 83 pt tall: measurement `duo-fold-and-keyboard`.
  The brief gives the same size. Status bar height is unmeasured; drawn at 20 pt as `duo-hand-tap-shift`
  draws it.
- Large phone: no written size (`layout.py devices` gives none, the brief names none). The frame starts at
  440 x 900 pt as a sample and resizes by its corner from 340 to 520 pt.
- Apple pages, read 2026-11-21 (all answered 200): accessibility (44 x 44 pt default control, 28 x 28 pt
  minimum; about 12 pt of padding around a bezeled element), typography (Dynamic Type table: Large default
  Body 17, Subhead 15, Footnote 13, Caption 1 12; AX5 Body 53, Subhead 49, Footnote 44, Caption 1 43),
  buttons, layout, edit menus ("let people select and copy noneditable text"; Copy needs no
  confirmation), context menus (use the system icons for Copy; a menu shows only what applies), feedback
  (put status feedback near the item it describes). The sheets page was not fetched; the Done-trailing
  rule comes from skill `ios-apps`.

## Choices

1. **The id becomes a copy chip.** The whole number in Menlo at the Subhead size (15 pt, relative to
   `.subheadline`), on paper inside a 1 pt line border, 8 pt radius, at least 44 pt tall, with the system
   Copy glyph. One tap copies the exact id, dashes included. Gain: the job's "paste the order number into a
   message" is one tap, and the number is read whole at 15 pt instead of 10.5 pt. Loss: every copy line
   grows from 86 pt to 113 to 165 pt by option (read in the drawing, Duo folded). Pick: yes.
   Departs from: `order-id-button-stops-propagate`, the package header ruling ("the copy button and its
   Copied stamp go away. Nothing copies", owner 2026-10-21). **Owner grant: yes.**
2. **The number reads in its dash groups.** Dashes in inkSoft, groups in ink, a break only after a dash.
   At AX5 (49 pt) it reads as three lines, `7C41B09E-` / `381604-` / `A9D2C`, never cut. Gain: today's
   native id at AX5 is 414 pt wide in a 361 pt column and runs about 53 pt past it (read in the drawing,
   Today, Folded largest text); the web cuts it with an ellipsis. Loss: none found. Pick: yes. Closes debt
   `order-id-visible-unbuilt` for Tally once built.
3. **The receipt sits at the press.** The glyph turns to a tick, the chip fills greenSoft, a small
   "Copied" bubble shows above its trailing end for 2.4 s, and VoiceOver hears "Copied order …". Nothing
   moves (`no-layout-shift-under-pointer`). Gain: `ux-answer-at-press`; the person knows it took. Loss: the
   bubble covers the free end of the detail line for 2.4 s. Pick: yes. A success haptic on copy is
   proposed (`ux-haptics-feel-substantial`); unmeasured on the phone.
4. **No "Copy" word on the chip.** The critique found "Copy" repeated on every chip (`ux-label-once`); the
   system Copy glyph carries it, as HIG context menus ask. Gain: quieter list; the menu option now fits on
   one row at the 440 pt sample. Loss: a first-time reader leans on the glyph alone. Pick: yes.
5. **Option: Chip and links.** Chip, then two links under it: Open on TCGplayer, Show whole order. Gain:
   every act named and visible; nothing behind a gesture. Loss: the copy line grows to about 165 pt, so the
   Tally list nearly doubles in length. Pick: no.
6. **Option: Copy-and-open chip.** One capsule: the number copies; its TCGplayer end copies too, then
   opens TCGplayer. The seller name, underlined with an accent chevron, shows the whole order. Gain: one
   44 pt row; and if the link lands on the order list (the open debt), the number is already on the
   clipboard for TCGplayer's search field, so the job ends on the right order either way. TCGplayer still
   opens when the copy fails. Loss: the open overwrites the clipboard without a separate ask; the whole
   order hides behind the seller name; the capsule fits the folded Duo's 363 pt column but wraps to two rows
   on the 440 pt phone sample's 337 pt column (copy line 159 pt). **Pick: yes.**
7. **Option: Chip with a menu.** Chip plus a 44 pt More button; More, and a press and hold on the chip,
   open one native menu: Copy order number, Open on TCGplayer, Show whole order (the header menu drops the
   last). Gain: the quietest row, native, and each act named in the menu. Loss: TCGplayer and the whole
   order are one tap deeper, and press and hold is not discoverable (More is the on-screen way, per HIG
   accessibility). Pick: no.
8. **Show whole order is a page pushed onto Tally, native.** Back reads "‹ Tally" (folded) or
   "‹ Lightning Bolt" (open Duo, right page only). The package header there carries the same chip.
   Departs from: native has no route today (`ItemLine.lines` comment); the web jump to Packages
   (`ItemRow` `onOpenOrder`, `a-reveal-ignores-hidedone-too`) stays on the web. **Owner grant: yes.**
9. **On the web, a tap on the Tally id copies instead of opening the whole order.** The whole order moves to
   its own control (per option). Departs from: `ItemRow` `onOpenOrder` in `src/app.jsx`. The
   `stopPropagation` rule holds for every new control. **Owner grant: yes.**
10. **Copy refused, web only.** If the browser refuses the clipboard, the chip turns red, the number is
    selected, and a bubble says "Could not copy. The number is selected: press and hold it, then Copy."
    Gain: no dead end (`ux-no-dead-end`). Loss: the bubble covers the seller line while it shows. Pick:
    yes. Native `UIPasteboard` has no refusal path.
11. **TCGplayer opens Safari, outside the app.** The URL stays `tcgplayerOrderUrl`. The mockup draws only
    the address and what is known. Gain: no change to a ruled URL. Loss: "lands on that exact order" stays
    unmeasured until the owner follows the link signed in. Pick: keep; option 6 covers the gap.
12. **Package header height grows.** A 44 pt chip in place of the link changes the header's reserved
    geometry and the touch-sweep spacing of claim 17a (`card-reserved-geometry`,
    `order-id-button-stops-propagate`). Must be re-measured when built. **Owner grant: yes.**

## Critique (impeccable, design review only: the target draws a native screen)

- Fixed: "Copy" repeated on every chip (item 4). Fixed: one act had two names ("Whole order" and "Show
  whole order"; "TCGplayer" and "Open on TCGplayer"); now one name each, except the capsule's short
  "TCGplayer" end, whose spoken name is "Copy order … and open it on TCGplayer". Fixed: the seller-name
  control read as plain text; its chevron is now accent. Fixed: the receipt bubble covered the seller name;
  it now sits at the trailing end. Fixed: the AX5 number fell under its glyph; it now keeps its row.
- Open: the refused bubble still covers the seller line (item 10). The capsule wraps on the 440 pt phone
  sample (item 6); a builder could shorten its end to the glyph alone below a width, unmeasured.

## Input Needed (closing questions)

- Should a copy also put the seller name or the order date beside the number? The job says the number
  alone; this mockup copies the number alone.
- Should the TCGplayer end of the capsule copy silently, or should the first use say so once?
- Is press and hold on the chip worth keeping in the menu option, given the chip's tap already copies?

## Checks

- `check_ios_mockup.py`: one fault, `system-font`: a font stack starts with Cochin. Cochin is the app's
  content font by ruling (`typography-cochin-and-mono`); the chrome (status bar, back button, menus, tab
  bar, Safari) is system. Possible false alarm: the check cannot tell content from chrome.
- Driven headless over CDP: every chip, link, capsule end, seller name, More, menu item, Back and Safari
  return worked in all four options and devices; a trusted tap wrote the real clipboard; no page error;
  no sideways scroll at 375 px.
