# The view switch is retired

**Retired:** L11a removed the view switch at every width. The bottom bar replaces it (`phone-nav-is-bottom-bar`). The equal-thirds layout, the 114px label constraint and the violet active fill went with it. The retired figures stay in `switch-thirds-and-seal`, marked as retired. The rules under "What still holds" apply to the rest of the chrome.

**Holds while:** test 62.8 pins that `src/app.jsx` renders no in-page switch.

## What still holds

The outstanding "N left · $Y" pill is the one deliberate exception to "mono for numbers". It is set in `serif`, so it reads in the letterhead voice rather than as tabular data. The only emoji in chrome is the 📬 in the empty state. Dot indicators are typographic, not icons. Max content width is 760px. The app must work at 380px, the iPhone width. Touch targets are a whole-row tap, a 30px check indicator, and 34px steppers. The bar's tabs are 44px, as L6 requires.

**Pinned by:** 62.8 (no in-page switch). The other rules in this section have no test. `npm run check:screens` checks 375px and 760px, not 380px.

## See also

- `phone-nav-is-bottom-bar` — the bar that replaces this switch.
- `switch-thirds-and-seal` — the retired thirds figures and the seal and tally figures.
- `motion-the-switch-is-one-object` — the retired switch's motion. The active-view ruling is open for the bar.
