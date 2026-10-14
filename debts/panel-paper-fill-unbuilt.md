# Overlay panels carry no paper fill

The orchestrator default is that an overlay panel takes the `paper` fill. `panelWrap` in `src/app.jsx` sets padding and a top border, and no background. Whether the square edges show with `paper` is unmeasured. The gap closes when the owner rules on the default and, if it stands, the fill is built and checked on a screen.

**Status:** open. An orchestrator default, not an owner ruling. The owner may overrule it.

**Decision:** `ruled-head-panels-carry-no-fill`.
