# Motion sheet durations and beats

This record holds every duration, delay, and beat in the motion sheet. It holds the stagger cap for a card opening. Re-measure in a real 375px viewport with a compositor after a change to any keyframe or beat.

## How to re-measure

Open the built page in a real browser. Watch a full load for the letterhead beats. Check a card in for the check tick and gild. Open a card for the row stagger. Force reduced motion on and check the resting frame. Pause with `getAnimations()` and set `currentTime` rather than sampling frames, because a hidden pane freezes the timeline. jsdom has no layout and no compositor, and cannot do this measurement.

## Reader

Group 42 pins two behaviour claims under `useJustBecame`. No reader holds a duration, a delay, or the no-reflow claim, because jsdom has no layout and no compositor.

## The figures, as recorded

```
The app moves now, and the register is **stationery, not software**: ink
settling into paper, a seal pressed, a stamp rocked onto a page, rules drawn
like a pen stroke, gold catching light once. Nothing springs, nothing bounces
past its rest and hangs there. The one overshoot in the whole sheet — the
stamp's `+1deg` — is the wrist roll that inks a rubber stamp's edges, and it
returns *through* rest rather than oscillating around it.

Everything lives in one commented block in the `<style>` tag, under a single
rule that is not a style preference: **nothing may reflow.** Every keyframe
touches opacity, transform, colour or box-shadow and nothing else. That is
invariant 5 restated as a stylesheet constraint, and it is why the sliding
switch fill is an absolutely positioned element rather than a background moving
between three buttons, and why the check tick is drawn with `stroke-dashoffset`
inside a box whose 30px never changes. Measured in a real 375px viewport across
a check-in: the row's height, the indicator's 30×30 and the document width all
drift **0.00px**, and horizontal overflow stays 0 in every state. The same
holds for a card being opened: the card below it steps to its new position in
**one commit** and holds it for the whole animation (measured across ten frames
— a single distinct offset), because only opacity and transform are animated
and the height is never touched.

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
- **The view switch is one object being moved, not three lamps being lit.**
  `.mdl-thumb` is the violet fill, absolutely positioned at exactly a third of
  the track and translated by whole multiples of its own width, so it lands on
  the thirds the grid already defines and cannot drift out of step with them.
  The buttons no longer paint their own background — a button that did would
  leave a fill behind wherever the thumb had just been, and there would be two
  of it mid-slide. **The consequence to know: `data-view` on `.mdl-switch` is
  now the only thing saying which segment is active.** Drop it and the app has
  no active-view indicator at all, and every button still looks correct in a
  DOM dump. Tests 43.1–43.2.
- **The RECEIVED stamp lands** rather than blinking into being: down at −13°,
  rocked flat, settled back to its −4°. The order-stamp band uses the same
  keyframes and returns to its own −3° — the resting angle rides in a `--rest`
  custom property, so one animation serves both.
- **A completed package is gilded.** One pass of gold across the card, on the
  same beat as the stamp. This is where the completion moment actually lives:
  the per-package progress bar is mounted only while `gotQty > 0 && !done`, so
  it is *gone before it can ever render at 100%* — the bar cannot mark its own
  completion because it does not survive it. The card does. The band is the
  ornamental gold, which is never allowed to carry information, and here it
  carries none.
  That gate is now load-bearing in a second direction, and the reason is worth
  knowing before anyone touches the bar: it survived the fix for the 28px card
  shift **only because the bar was taken out of flow rather than reserved a
  slot**. A reserved slot would have to stay mounted at 100%, and the bar would
  then sheen its own completion next to the gild. See "The card's reserved
  geometry"; test 44.5 is what fails if it is put back.
- **The check tick is written**, one stroke left to right, 300ms. That ceiling
  is not a preference either: this fires hundreds of times on a mail day and
  anything slower starts to feel like latency. The glyph is an SVG path rather
  than the `✓` character purely so it *can* be drawn; the `aria-label` carries
  the meaning either way, and the partial state stays a typographic dash
  because a half-drawn stroke would read as a tick still arriving.
- **The masthead progress bar** takes its green a beat after the width lands,
  so the two read as cause and effect rather than one event, and sweeps once.
  It is reachable but rare: 100% there means every card in the ledger has
  arrived, which is the largest thing this app has to say.
- **A card opening lays its contents down in order.** The bulk row, then each
  item row, each a beat behind the last (`mdl-reveal`, 240ms, opacity and 4px)
  — a letter unfolded rather than a light switched on. The stagger is **capped
  at 132ms**, so past the sixth row every remaining row shares the last beat
  and a twenty-line order finishes as promptly as a three-line one (measured:
  delays 0/22/44/66/88/110/132/132/132, everything settled by 372ms).
  It is gated on `useJustBecame` for a reason particular to this card: an
  unreceived package **starts expanded** (`useState(!done)`), so a bare class
  would set every open card on the page animating at once on load, competing
  with the letterhead's own sequence. Measured on the seeded ledger: 0 reveals
  fire on load, 9 on a card opened by hand.
  **Collapsing is deliberately not animated**, and that is the same rule read
  the other way. An exit animation means keeping the rows mounted past the tap
  and shrinking the card a fifth of a second later — a *delayed* layout change,
  under a thumb that has already moved on, which is worse than an immediate
  one. The caret carries both directions instead (200ms, the sheet's easing);
  on the way closed it is the only thing that moves.
- **The disclosure panels arrive** (220ms, opacity and 4px). The space they
  take is *not* animated and must not be — it is the same layout they have
  always pushed down, one commit after the tap.

**`useJustBecame` is the load-bearing piece and the one to protect.** Every
celebration here marks a state a package can already be *in*, so a bare CSS
class would replay its animation each time React rebuilt the tree: switching
Packages → Tally and back would restamp every finished order at once, and a
re-sort would do it again. The hook returns true only when its value rises
false → true **while the component stays mounted**, and never on a fresh mount.
It is also the more honest reading — the moment worth marking is the check-in,
not the fact of having been checked in. Tests 43.3–43.6; 43.4 and 43.6 are a
pair, and a mutant that classes the stamp on `done` alone passes the first and
dies on the second.

**Every rule is switched off under `prefers-reduced-motion`, and the resting
state is each animation's own final frame** — so `animation: none` leaves the
thing *drawn*, not hidden: the seal visible, the rules full width, the tick
complete, the stamp at its inline angle, the thumb on its third. Verified by
forcing the reduced-motion block on unconditionally in a real browser: seal
opacity 1, rules 104px, title and tallies opaque, thumb at 228.66px = 2 × the
114.33px third, overflow 0. With motion off the app is pixel-for-pixel what it
was before this pass.

Two things measurement, not reading, settled here, and both will need
re-measuring rather than re-reasoning if they change. **jsdom has no layout and
no compositor**, so durations, easing, distances and the no-reflow claim are
not assertable and no test protects them — group 42 pins only the two claims
that are behaviour. And **the Browser pane freezes animation timelines when it
is not compositing**, which makes sampled mid-animation values read as frozen;
pause with `getAnimations()` and set `currentTime` instead of sampling frames,
or the numbers will lie to you.

`_studies.html` is not in the repo, but the method that produced this is worth
keeping: each moment was built two or three ways as a side-by-side proof sheet
with every variable but one held constant, and picked by looking rather than by
reading a description.

```
