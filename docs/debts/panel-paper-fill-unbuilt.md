# Overlay panels carry no paper fill

**What.** Overlay panels carry no `paper` fill: `panelWrap` in `src/app.jsx` sets padding and a top border, and no background. The orchestrator default of 2026-10-11 is that an overlay panel takes the `paper` fill. The owner confirmed it, 2026-11-18 21:56 CST: the web's Sorted by and History panels take the paper fill. Whether the square edges show with `paper` is unmeasured. The gap closes when the fill is built and checked on a screen.

**Status:** open. The owner confirmed the default, 2026-11-18 21:56 CST. The fill is not built.

**Decision:** `ruled-head-panels-carry-no-fill`.
