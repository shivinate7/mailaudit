# Swift stacks space by the platform default, not by shared values

**What.** Rule `ux-swift-same-intent` (claude-settings, Swift screens space like the web) asks two things. Each stack sets its own gap with `VStack(spacing:)` or the like, and no item uses padding to push a neighbour away. That gap comes from shared spacing values that grow with the text size (`@ScaledMetric`). The app does neither in full. 10 of 87 stacks set no spacing (measured 2026-11-06, app code under `native/`, tests left out). `native/Manifest/ItemLine.swift` line 90 pads the stepper's top to push it from the line above. No code uses `@ScaledMetric`. The platform's default gap is fine where a stack sets no spacing.

The owner kept the rule as written, with one debt per app (waiting page item 272, pick b, "Keep it as written, one debt per app"). Gain: no work now. Lose: the rule stays unenforced and asks for what no app does. The gap closes when shared spacing values scaled with `@ScaledMetric` exist, each stack takes its gap from them, and the stepper's top padding moves to the parent stack's spacing.

**Status:** open. Measured 2026-11-06.

**Decision:** `ux-house-rules-govern`.
