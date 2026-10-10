# Motion sheet durations and beats

This record holds every duration, delay, and beat in the motion sheet. It holds the stagger cap for a card opening. Re-measure in a real 375px viewport with a compositor after a change to any keyframe or beat.

## How to re-measure

Open the built page in a real browser. Watch a full load for the letterhead beats. Check a card in for the check tick and gild. Open a card for the row stagger. Force reduced motion on and check the resting frame. Pause with `getAnimations()` and set `currentTime` rather than sampling frames, because a hidden pane freezes the timeline. jsdom has no layout and no compositor, and cannot do this measurement.

## Reader

Group 42 pins two behaviour claims under `useJustBecame`. No reader holds a duration, a delay, or the no-reflow claim, because jsdom has no layout and no compositor.
