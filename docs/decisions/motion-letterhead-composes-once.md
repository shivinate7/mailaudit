# The letterhead composes itself once per load

The masthead builds itself once per load, in the order a page is made: wax, rules, name, house, figures. The seal is pressed (`mdl-press`, 600ms, .68 → 1.06 → 1). Its specular catch comes up once the wax is down and still (`mdl-shine`, 420ms in). The gold rules are drawn outward from the seal (`mdl-draw`, scaleX, each pulling from its inner end). Then the title, house line and tallies settle. Six beats overlap and land at 600 / 900 / 920 / 940 / 970 / **1060ms**.

**Holds while:** `src/app.jsx` runs `mdl-press` for 600ms, starts `mdl-shine` at 420ms, and starts `mdl-draw` at 240ms. A comment there says the sequence finishes by about 1060ms.

The sequence needs room. A version that ran inside 700ms read as one blur, not as a sequence. The owner chose this price knowingly. It is the thing to re-examine if this is revisited. **The tallies arrive last.** They are the figures the app is opened to read. If you retime it, keep the final beat under ~1.1s. Never let the tallies start after the house line.

`mdl-shine` is scoped to `.mdl-head .mdl-seal`. The running head renders a second `<Seal>`, and that second seal is deliberately not selected. Its highlight keeps the `opacity="0.22"` presentation attribute throughout. The masthead falls back to that same value under reduced motion.

Native composes once per launch, not once per tab: the first masthead copy to appear composes, and each later copy starts drawn (`MastheadModel.claimStartFrame`).

## See also

- `motion-timings` — the exact beat timings this sequence lands on.
- `masthead-is-one-letterhead` — the letterhead this sequence composes.
