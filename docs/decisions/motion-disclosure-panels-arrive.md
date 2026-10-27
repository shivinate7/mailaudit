# Disclosure panels overlay the list and do not push it

A disclosure panel overlays the list. It arrives with an opacity fade and a 4px move, over 220ms. The exact timing is in the `motion-timings` record. The panel does not push the list down.

**Status:** ruled 2026-10-11, not built. The owner ruled under press movement, "Fix both": disclosure panels overlay the list and do not push it. Today a panel takes layout space and pushes the list down. Debt: `panels-overlay-unbuilt`.

Kind: build

Plan: docs/decisions/motion-disclosure-panels-arrive.md#web-plan (web)

**Holds while:** `.mdl-panel` in `src/app.jsx` runs `mdl-panel` for 220ms, and that keyframe moves the panel 4px.

The arrival is a fade and a 4px move. It changes no layout. A panel never reflows the list while it arrives. Today the panel's layout space is the part that pushes the list down. The overlay ruling removes that push.

## Web plan

Position `.mdl-panel` over the list so its arrival moves no row. Keep the 220ms fade and the 4px move. A check at 375px proves the list rows do not move when a panel opens.

## See also

- `motion-timings` — the exact duration this fade uses.
- `motion-nothing-may-reflow` — the rule that keeps this arrival from touching layout.
- `ruled-head-panels-carry-no-fill` — the orchestrator default that an overlay panel takes the paper fill, so the list rows do not show through it.
