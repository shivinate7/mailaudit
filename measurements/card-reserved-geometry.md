# Card reserved geometry heights

This record holds the package card and Tally card heights across a check-in. It holds the row displacement, the action row content needed per width, and the 320px case left unfixed. Re-measure at 375px, and at the widths listed, after a change to the progress bar or the action row.

## How to re-measure

Open the built page against the seeded ledger. Step through rest, the first check-in, the second check-in, and the tap that completes the package. Measure the card height and the row displacement at each step. Repeat the action row content measurement at 320, 360, 375, 390, 430, and 760px. The prose names no script. Re-run this by hand in a real browser. jsdom has no layout and cannot do this measurement.

## Reader

No reader. A test cannot hold this claim, because jsdom has no layout.
