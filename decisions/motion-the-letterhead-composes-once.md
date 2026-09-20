# The letterhead composes itself once per load

The masthead builds itself in the order paper is made: wax, rules, name, house, figures. The tallies land last on purpose, because they are the numbers the app is opened to read.

## The argument, as recorded

```
Eight moments:

- **The letterhead composes itself, once per load**, in the order a page is
  actually made: wax, rules, name, house, figures. The seal is pressed
  (`mdl-press`, 600ms, .68 → 1.06 → 1), its specular catch comes up once the
  wax is down and still (`mdl-shine`, 420ms in), the gold rules are drawn
  outward from it (`mdl-draw`, scaleX, each pulling from its inner end), then
  the title, house line and tallies settle. Five overlapping beats landing at
  600 / 900 / 920 / 940 / 970 / **1060ms**.
  The first cut ran the whole thing inside 700ms and **read as one blur rather
  than as a sequence** — the ceremony needs the room. The price was chosen
  knowingly by the owner and is the thing to re-examine if this is revisited:
  **the tallies arrive last**, and they are the figures the app is opened to
  read. Two guard rails if you retime it — keep the final beat under ~1.1s, and
  never let the tallies start after the house line.
  `mdl-shine` is scoped to `.mdl-head .mdl-seal`. The running head renders a
  second `<Seal>`, and it is deliberately not selected: its highlight keeps the
  `opacity="0.22"` presentation attribute throughout, which is also exactly
  what the masthead's falls back to under reduced motion.
```
