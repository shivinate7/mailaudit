# Cochin sets words, monospace sets numbers

Cochin sets everything that is not a number. Monospace sets numbers, ids, and labels. The app has no sans-serif font. One exception: the Sync panel's labels are Cochin. The owner ruled on 2026-10-27 12:25 CDT to record it.

**Holds while:** the `cochin` and `mono` constants are defined in `src/app.jsx`, no `sans` constant is defined there, and the root `div` sets `fontFamily: cochin`.

The `cochin` constant is the Cochin font stack. Its last family is the generic `serif`. The `mono` constant is the monospace stack. The `sans` constant is gone.

The root element sets `fontFamily: cochin`. Every element inherits that font. Form controls do not inherit it on their own, so they need their own rule. See `design-form-controls-no-inherit`.

The native client sets words in Cochin and numbers in Menlo through `Font.cochin` and `Font.mono`. Both use `Font.custom(_:size:relativeTo:)`, so Dynamic Type scales them.

## The size floor

No visible text is smaller than 10px. The owner ruled on 2026-10-11, accept all: record a 10px micro-label floor. Per `ux-house-rules-govern`, some labels are smaller than 10px today.

**Status:** ruled 2026-10-11, not built. Build: lane L1, see `ux-house-rules-govern`. Debt: `type-floor-unbuilt`.

Kind: build

Plan: docs/decisions/typography-cochin-and-mono.md#the-size-floor (web)

## See also

- `design-view-switch-equal-thirds` — the one exception to mono for numbers, the outstanding pill.
- `design-form-controls-no-inherit` — form controls need their own font rule.
- `masthead-is-one-letterhead` — MANIFEST is set in Cochin caps.
