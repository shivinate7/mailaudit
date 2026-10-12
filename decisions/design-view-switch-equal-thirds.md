# The view switch is equal thirds

**Ruled, not built:** on phone, the bottom bar replaces this switch. The bar has four tabs, not three, and its active tab is not the violet fill. See `phone-nav-is-bottom-bar`. The layout below is the code today. It holds until the bar is built.

The view switch is a pill-shaped segmented control in uppercase mono. It is **equal thirds at full width**, with `grid-template-columns: repeat(3,1fr)`. The order is Orphaned, Tally, Packages. The owner has not ruled whether Packages moves left. The active segment is filled with **accent violet**, the same treatment as the active date-range chip.

**Holds while:** `.mdl-switch` in `src/app.jsx` sets `grid-template-columns: repeat(3, 1fr)`.

Equal thirds inverted the old sizing constraint. The pill can no longer overflow its column, because the column is the pill. The constraint now sits inside each segment. The longest label plus its count badge must fit one third, which is 114px at 375px. The lever is the clamped `font-size`, not the padding. Do not trim the pill padding to make a label fit. Measured at 375px, all three labels fit. The `switch-thirds-and-seal` record has the measured third and label fit.

The rest of the design language still applies. The outstanding "N left · $Y" pill is the one deliberate exception to "mono for numbers". It is set in `serif`, so it reads in the letterhead voice rather than as tabular data. The only emoji in chrome is the 📬 in the empty state. Dot indicators are typographic, not icons. Max content width is 760px. The app must work at 380px, the iPhone width. Touch targets are a whole-row tap, a 30px check indicator, and 34px steppers.

## See also

- `phone-nav-is-bottom-bar` — the bar that replaces this switch on phone.
- `switch-thirds-and-seal` — the measured third width and label fit this ruling depends on.
- `motion-the-switch-is-one-object` — the animation built on these same equal thirds.
