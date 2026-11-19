# Overlay panels carry no paper fill

**What.** Overlay panels carry no `paper` fill: `panelWrap` in `src/app.jsx` sets padding and a top border, and no background. The orchestrator default of 2026-10-11 is that an overlay panel takes the `paper` fill. The owner confirmed the paper fill for the web's Sorted by and History panels (item 63 a, 2026-11-18 21:56 CST); other overlay panels carry it as the default. Whether the square edges show with `paper` is unmeasured. The gap closes when the fill is built and checked on a screen.

**Status:** open. The owner confirmed the paper fill for Sorted by and History (item 63 a, 2026-11-18 21:56 CST); other panels carry it as the default, not owner-confirmed. The fill is not built.

**Decision:** `head-panels-carry-paper-fill`.
