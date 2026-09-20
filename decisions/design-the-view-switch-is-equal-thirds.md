# The view switch is equal thirds

The view switch is a pill-shaped segmented control divided into three equal columns. The order is Orphaned, Tally, Packages, so the daily-driver view sits under the thumb. Equal thirds inverted the old sizing constraint. The pill can no longer overflow its column, so the longest label plus its count badge must fit inside one third instead.

## The argument, as recorded

```
The outstanding "N left · $Y" pill is the one deliberate exception to
"mono for numbers": it's set in `serif` so it reads in the letterhead voice
rather than as tabular data. No emoji in
chrome except the empty-state 📬. Typographic dot indicators, not icons. Max
content width 760px; must work at 380px (iPhone). Touch targets: whole-row tap,
30px check indicator, 34px steppers. The view switch is a pill-shaped segmented
control in uppercase mono, active segment filled with **accent violet** — same
treatment as the active date-range chip. It is **equal thirds at full width**
(`grid-template-columns: repeat(3,1fr)`), in the order Orphaned / Tally /
Packages — Packages sits right so the daily-driver view lands under the thumb.

Equal thirds *inverted* the old sizing constraint, so ignore any advice about
trimming the pill padding. The pill can no longer overflow the column; it is the
column by construction. The constraint moved inside: the longest label plus its
count badge has to fit **one third — 114px at 375px** — and the lever is the
clamped `font-size`, not the padding. Measured at 375: all three fit.
```
