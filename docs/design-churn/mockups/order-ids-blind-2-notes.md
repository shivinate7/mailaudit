# order-ids-blind-2: notes

Designer kind: blind. Mockup: `order-ids-blind-2.html`.
Job: read an order's full number, copy it in one tap to paste into a message, and open the
seller's page for that exact order.

As a blind designer I saw no current screen, so I cannot tell what exists today. Every part is
labelled "New:". The order data shape here is a guess from the brief: seller, date, card count,
mail status, a long number with dashes, and a web address that may be missing.

## Deep links

`#c=<concept>&s=<state>&t=<light|dark>&o=<order index>&h=<hidden options>&l=off`

- Concepts: `c=slip`, `c=ledger`.
- Slip states: `list`, `detail`, `copied`, `nolink`, `opened`, `loading`, `failed`, `empty`.
- Ledger states: `list`, `copied`, `pocket`, `nolink`, `opened`, `loading`, `failed`, `empty`.
- Focus for the page: `#slip-plate` (Order slip), `#ledger-pocket` (Number ledger).

## Choices

1. **Concept: Order slip.** A large-title list of orders. A tap opens the order. The number
   plate and the open buttons sit at the bottom, in the thumb zone. The open pose shows the list
   beside the order. Gain: a structure people know; room for other order facts. Loss: two taps
   to copy (open the order, then the plate). Pick: keep, as the safe choice.
2. **Concept: Number ledger (bold).** No order screen at all. Each row is the number itself,
   with the seller above it. One tap on the row copies. An open button sits beside each row. A
   clipboard pocket at the bottom holds what you copied, with its own open button. A tap on the
   pocket opens a Clipboard sheet with the plate, the open button and the numbers copied
   earlier. On the open pose the right page is the Clipboard, always shown. Gain: one tap for
   either job, from the first screen; the person sees what they will paste. Loss: no room for
   other order facts; a clipboard history is a structure few apps of this kind have.
   Pick: this one. Owner grant: yes (new structure, no spec covers it).
3. **Number set in its dash groups.** Monospace, slashed zero, groups wrap only at a dash.
   Gain: the person can read and check the number group by group; 0 and O never mix. Loss: a
   second face in the app. The copy is always the exact stored string, dashes included. Pick:
   keep.
4. **Copy answers on the press.** The plate or row turns green and its label reads "Copied".
   The label box keeps the width of its longest word, so nothing moves (at AX5 the box may
   wrap instead). It stays until the next
   act, with no timer. Pick: keep.
5. **"Spell it out".** A closed disclosure that reads the number as words ("four, Charlie, one,
   Echo..."), for a phone call. Gain: no misread letters aloud. Loss: one more line. Pick: hide
   unless the owner reads numbers aloud.
6. **"Copy and open order".** One press copies, then opens the order page; the page shows
   "Order number copied. Paste it into your message." Gain: the whole task in one press. Loss:
   a second open button beside the first. In the ledger the pocket already does this (copy, then
   open). Pick: keep in Order slip.
7. **Open lands on the order, and says so.** The label is "Open order page". The hint under it
   says it opens this one order in Safari. The address hides in "Show the web address", a closed
   disclosure (house rule ux-machine-text-hidden). The stand-in page uses `orders.example`, not
   a real site. Pick: keep.
8. **No web address.** The open button stays, disabled, with the reason written beside it: "No
   web address is saved for this order." The number still copies (ux-control-earns-place,
   ux-no-dead-end). "Copy and open" is absent there. Pick: keep. Owner grant: yes, if orders
   with no address cannot occur, this state goes.
9. **Search matches part of a number.** Placeholder "Seller or part of a number", for a seller
   who quotes a number back. Gain: find an order from a message. Loss: none seen. Pick: keep.
10. **States.** Loading shows a line and fixed-height placeholder rows. Failed says the orders
    could not be read, with "Try again". Empty says what fills it, with "Add orders". The list
    hides search with no data (ux-unknown-is-not-empty). "Add orders" names no import route,
    because the blind brief gives none. Owner grant: yes, the builder names the real route.
11. **Largest text (AX5).** Groups stack one per line. Buttons stack full width. In Order slip
    the whole screen scrolls, so the pinned plate never hides the order. In the ledger the
    pocket shrinks to "Copied, ends 0A6E2"; the sheet shows the full number.
12. **Colour.** My own set, by role: cool grey surfaces, a postal-ink blue accent, a green for
    "copied". A light and a dark set. No repo colour used.
13. **No tab bar drawn.** The brief names no sections, so the screens sit in no tab bar. The
    ledger pocket sits where a tab bar would float. Owner grant: yes, if the app has a tab bar,
    the pocket goes above it.

## Devices and sizes

- Duo folded 466 x 678 pt and Duo open 951 x 669 pt, hinge 455.5 to 495.5, from the brief.
  `layout.py devices` printed `unknown` for this repo, so the brief's sizes rule.
- Large phone: neither the brief nor the device list gives a size, and no Apple page read gives
  one. It is drawn at the folded Duo size, 466 x 678, and the frame drags to any size.
- Status bar (28 pt) and home indicator (20 pt) heights are placeholders. No source read gives
  them for the Duo.

## Apple pages read (2026-11-21, each answered 200)

- Layout: safe areas; lay out by size class. Its device table was not in the page's text.
- Typography: Dynamic Type sizes, Large (default) and AX5, used for every text size here.
- Accessibility: 44x44 pt control size; contrast 4.5:1.
- Buttons, Sheets (Done on the trailing edge), Lists and tables, Tab bars, Toolbars.
