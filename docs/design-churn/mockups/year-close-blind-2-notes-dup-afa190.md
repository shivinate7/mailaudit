# Year close, blind designer 2: notes

Designer kind: blind. Designer: year-close-blind-2. Mockup: `year-close-blind-2.html`.
Job: "Put the done stuff away, but never lose it." Facts used: orders fully received, orders
still open, a year, and the total spent per year. Every figure, seller and date is sample.

I saw no current screen, spec, token file or other mockup. Every part is new, so each frame marks
its key parts with a dashed "New:" label. There is no "Today:" label, because I do not know what
exists today. The "New" labels button hides them.

## Options

Two options, each with its own structure, way to move around and first screen. Each has a Hide
button in the page's top bar. Focus element for the waiting page: `#close-folded` for Year close,
`#strata-folded` for Strata (the folded frame of each option).

1. **Year close.** Two tabs, Orders and Records. Received orders stay in Orders all year. At year
   end, a bar above the tab bar offers Put away. One sheet shows what goes, what stays, and the
   year total, with Cancel and Put away. Records lists each year with its total. A year opens to its
   total, Export for taxes, a search, and its orders. An order opens read only, with Share for a
   dispute. On the open Duo, Orders is the left page and Records the right page, with no tab bar.
   - Gain: a familiar shape. One clear act, once a year. The person decides when the put-away happens.
   - Loss: clutter builds all year until the press. Two places to look for an order.
   - Pick: keep it as the safe option.
2. **Strata (the bold one).** No tabs and no archive screen. One column runs through time. Orders
   still waiting sit at the bottom. Each year is a band above them, as tall as what it cost (36 pt
   for each $1,000, from zero). The moment every item of an order is in, the order settles into its
   year's band, so nothing builds up. Year end only seals the band. Tap a band to open its record in
   place. On the open Duo, the column is the left page and the tapped band's record is the right page.
   - Gain: the clutter never forms, so most of the year-end chore goes away. The totals per year
     show as a shape you can compare at a glance. The record is always one tap away, in the same
     column.
   - Loss: new to learn. Long lists of years push the bands off screen. At AX5 the bands must grow
     to fit their words, so the height no longer shows money there (the amounts stay in words).
   - Pick: my pick. It answers "put the done stuff away" every day, not once a year.
   - Owner grant: yes. It departs from two house rules: `tokens.md` "On a phone, navigation uses a
     bottom tab bar", and skill `ios-apps` Mockups ("a tab bar for the sections"). Strata has one
     screen with no sections, so it has no tab bar.

## Choices inside the options

3. **A partly received order stays open.** An order leaves the open list only when every item is
   in. A half-filled circle marks a part-received order; an empty circle marks none received.
   - Gain: nothing half-done is put away. Loss: a seller who never sends the last item keeps the
     order open. Pick: yes, both options.
4. **A late arrival after year end.** In Year close it joins its year's record. In Strata it joins
   the sealed band, marked late with its own date, shown apart from the sealed total.
   - Gain: the year holds every order of that year. Loss: a closed year's figures can still change.
   - Pick: the Strata form (the sealed total never changes; late lines show apart).
   - Owner grant: yes. It sets a rule for whether a closed year's record may change.
5. **Undo after the put-away or the seal.** The answer shows in the bar that held the button, with
   Undo. Nothing is ever deleted.
   - Gain: a mistaken press costs nothing. Loss: "sealed" is softer while Undo shows.
   - Pick: Undo shows until the person leaves the app.
6. **Tax file.** A switch in the sheet, on by default, saves one file of every order of the year
   with its total. Each year record also has Export for taxes.
   - Gain: the tax copy exists outside the app. Loss: one more file to keep. Pick: on.
   - The switch gives a haptic on change (`ux-haptics-feel-substantial`).
7. **Share for a dispute.** A kept order opens read only, with its order number, dates, items and
   cost, and Share for a dispute. Pick: yes, both options.
8. **Search inside a year record.** By seller or order number. A search that finds nothing keeps
   the search field and shows Clear search.
9. **When the year-end bar shows.** The mockup shows it at year end. I did not decide from which
   date it shows. Pick: from 1 December until the year is put away or sealed.
10. **Waiting days.** An order waiting 30 days or more shows its day count in the warning colour.
    Gain: a lost package stands out. Loss: one more colour. Pick: yes.
11. **The confirming button sits at the bottom of the sheet.** Put away 418 orders, or Seal 2026,
    is a full-width button at the sheet's foot, in reach of the thumb (`ux-thumb-zone`). Cancel
    stays at the top leading edge.
    - Gain: the act that matters most is where the thumb is, and its label names the act and the
      count. Loss: Apple's Sheets page puts Done on the top trailing edge.
    - Pick: bottom button.
    - Owner grant: yes. It departs from the HIG Sheets layout in favour of house rule
      `ux-thumb-zone`.
12. **Largest text (AX5).** The year-end bar leaves the bottom dock and joins the top of the list,
    so it does not cover the screen. Rows stack their words. The tab bar keeps its size.

## States (deep links)

Open `year-close-blind-2.html` with a hash. `c` names the option, `s` the state, `t=dark` or
`t=light` the theme (default: the system), `l=0` hides the "New" labels, `hide=close` or
`hide=strata` hides an option.

- Year close: `#c=close&s=orders`, `sheet`, `done`, `failed`, `records`, `year`, `order`,
  `nomatch`, `empty`, `unknown`.
- Strata: `#c=strata&s=now`, `layer`, `seal`, `sealed`, `failed`, `order`, `nomatch`, `empty`,
  `unknown`.

Each frame is live: tap a circle to mark an order received, open the sheet, put away or seal, undo,
open a year, search, open an order.

## Devices and sources

- Duo folded 466 x 678 pt and open 951 x 669 pt with the hinge at x 455.5 to 495.5: the brief's
  sizes. `layout.py devices` printed `unknown` for this repo.
- Large phone: no size is written in the brief or in `layout.py`. It is drawn at the folded size
  from the brief, and its frame can be resized by hand.
- The status strip (24 pt) and home bar (20 pt) are drawing choices on the 4 px step, not Apple
  figures.
- Apple pages read 2026-11-21, each answered 200: Layout, Typography (iOS Dynamic Type tables,
  Large default and AX5), Accessibility (44 x 44 pt default control size), Buttons, Sheets (Cancel
  leading, Done trailing, Done paired with Cancel), Lists and tables, Tab bars (floats above the
  content), Toolbars.
- Not read: whether bar buttons grow with Dynamic Type. The AX5 frames draw them growing.
- Colour, type and spacing: `tokens.md` (4 px step, 8 px radius, colour by role, system font).
  Colours are my own.
