# Motion reads as stationery, not software

Every motion in the app must feel like paper and ink. It must never feel like software chrome. Ink settles into paper. A seal is pressed. A stamp is rocked onto a page. Rules are drawn like a pen stroke. Gold catches the light once.

**Holds while:** `mdl-press` in `src/app.jsx` keeps its 58% frame at `scale(1.06) rotate(2.5deg)`. `mdl-stamp` keeps its 45% frame at `rotate(1deg) scale(.97)` and its 72% frame at `rotate(-6deg) scale(1.01)`, and it ends at `var(--rest)`.

Nothing springs or oscillates; each returns through rest once.

The sheet has two overshoots. Each one is a keyframe that goes past the rest value before the animation settles.

- The seal press, `mdl-press`, at 58%. Scale goes to 1.06 and rotation goes to 2.5deg. Both then settle to 1 and 0.
- The stamp, `mdl-stamp`. Rotation goes to 1deg at 45%, then to -6deg at 72%, then settles at `var(--rest)`. Scale goes to .97, then to 1.01, then to 1. The 1deg frame is the wrist roll that inks a rubber stamp's edges.

No other keyframe overshoots. No easing curve overshoots either. Every `cubic-bezier` in the sheet keeps its y values between 0 and 1.

## See also

- `motion-method-is-side-by-side-proof` — how each moment here was chosen.
- `motion-the-stamp-lands` — the stamp's landing, whose overshoot frames this rule names.
