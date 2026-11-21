# A tick that did not take: notes

Designer kind: blind. Designer: failed-checkin-blind-1. Mockup: `failed-checkin-blind-1.html`.

The job: the person ticks hundreds of cards fast. Some ticks do not save. They must see at once
that one failed, see which card, and redo it in one tap, without losing their place or their list.

I saw no current screen, spec, token or mockup of this repo. So every part is marked "New:", and
no part is marked "Today:". No item here can cite the existing app's behaviour; the informed
designers and the design reviewer hold that comparison.

## Deep links

Open the file, then add a hash. Keys combine with `&`.

- `#c=row`, `#c=tape`, `#c=envelope`: one concept only.
- `#s=failed`, `#s=many`, `#s=offline`, `#s=saving`, `#s=empty`, `#s=loading`, `#s=readfail`: start states.
  `saving` holds one tick with no answer; it turns to "No answer" after 6 s.
- `#t=light`, `#t=dark`: theme. With no `t`, `prefers-color-scheme` picks.
- `#n=flaky`, `#n=offline`: the signal. Flaky fails every third tick.
- `#d=folded`, `#d=open`, `#d=phone`, `#d=ax5`: one device.

Example: `failed-checkin-blind-1.html#c=tape&s=many&t=dark&d=folded`.

Each concept has a "Hide this concept" button. Its section id is the focus for the waiting page:
`concept-row`, `concept-tape`, `concept-envelope`.

## Concepts

1. **Row receipt.** A list grouped by package, a large title, and a floating tab bar for Packages,
   Tally and Orphaned. The tick button is the receipt: "+1", then a spinner, then a check and
   "Saved 7:43 PM, You", or a red "Retry". A red bar above the tab bar names every unsaved card,
   with Retry all. Each tab shows its count of unsaved ticks. Open Duo: list of packages on the left
   page, the chosen package's cards on the right.
   Gain: the answer sits on the button just pressed; the bar catches a failure that scrolled away.
   Loss: the most familiar shape, so the least new; the bar covers the last row until you scroll.
   Pick: yes, as the base for the folded Duo and the phone.

2. **Tick tape.** The whole row is the tick. Under the list, in thumb reach, a tape prints one line
   per tick: "+1 Brainstorm, Blue Heron Games", then a time with seconds when it saves. A line that
   did not save stays pinned at the top of the tape, in red, with Retry, until it saves. Lists switch
   with a segmented control at the top. Open Duo: the right page is the whole session's tape, with
   "All ticks" and "Not saved".
   Gain: "Did it take?" has a written answer with a time, for every tick, under the thumb. Best use
   of the open Duo of the three.
   Loss: the tape takes 196 pt of the folded screen; at the largest text it shrinks to one line.
   Pick: yes on the open Duo; owner to choose between this and Row receipt on the folded Duo.

3. **Envelope (bold).** One package per screen, the way it sits in the hand. Each expected card is a
   bead. A bead fills only when its save is confirmed; it shows a dashed ring while saving, and turns
   red with "!" when the save fails. A one-line legend under the strip names the bead states. The whole card row is the tick, and on a failed card the same
   tap retries. You page with the arrows or a sideways swipe. "All packages" opens a rack: every
   package with its beads, so every red bead in the session is in one view. Open Duo: rack on the
   left page, package on the right.
   Gain: the bead strip is both progress and save receipt, and the rack is a map of the session.
   Matches opening one envelope at a time. You cannot lose your place: the place is the package.
   Loss: no app of this kind works this way, so it needs learning. Tally is read-only here (a tap
   opens the package that still needs that card). Paging costs a tap per package.
   Pick: no for the first build. Worth one phone test, because it fits the mail in the hand.

## Design choices

4. **The count shows confirmed saves only.** A tick in flight shows as "+1" beside the count. A
   failed tick never enters the count.
   Gain: the count never claims a card that did not save. Loss: the count lags the tap by the save time.
   Pick: yes. Owner grant: yes (it sets what a count means).

5. **Retry is the same tap in the same place.** The tick button, or the row, turns into Retry.
   Gain: one tap, no hunt, no other screen. Loss: a further tick on that card waits until the retry.
   Pick: yes.

6. **Retry must not count twice.** A tick with "No answer" may have saved. Each tick needs its own id,
   so a retry of a tick that did land is a no-op. This is a sync change for a builder, outside my
   write scope.
   Gain: Retry is always safe to press. Loss: the save call carries a tick id.
   Pick: yes. Owner grant: yes (it changes the saved-state or sync contract).

7. **"No answer" is its own state.** A save with no answer in time shows "No answer. It may not have
   saved." It is red, it is not counted, and it has Retry. The time limit is unmeasured; the mockup
   uses 6 s for the demo only.
   Gain: the person is never told "saved" or "failed" when neither is known. Loss: one more message.
   Pick: yes. Owner grant: yes (the time limit needs a number).

8. **A failure stays until it saves.** No toast, no timeout. The bar, tape line, badge or red bead stays
   until the tick saves, and then shows "Saved" with the time.
   Gain: no silent loss. Loss: a long outage leaves a long red list. Pick: yes.

9. **Retry by itself when the signal comes back.** Not drawn: the mockup retries only on a tap.
   Gain: fewer taps after a dead zone. Loss: a red line may turn green while the person looks away;
   the "Not saved" sheet then keeps it as "Saved" until closed. Pick: owner's call. Owner grant: yes.

10. **Failure arrives with a haptic.** An error haptic when a save fails; a light one on each tick
    (`ux-haptics-feel-substantial`). A browser cannot show it; the mockup calls `navigator.vibrate`
    where present. Gain: noticed without looking. Loss: none known. Pick: yes.

11. **No row moves.** The bar and the tape are fixed overlays or fixed-height regions, and each tick
    button keeps the box of its widest label, "Retry". A save moves no row (`ux-order-holds-still`).
    Gain: the thumb stays on target at speed. Loss: the list keeps space at its end for the bar. Pick: yes.

12. **Where the failure is, by list.** Tab badges (Row receipt), red dots on the segmented control
    (Tick tape), red counts on rack rows (Envelope). Gain: a failure in another list is never hidden.
    Loss: one more mark per list. Pick: yes.

13. **Data states.** Empty: one sentence and "Import order history". Loading: a sentence and fixed-size
    placeholders. Read failed: a sentence that says nothing is shown as missing, "Try again", and a
    closed "What the device said" (`ux-unknown-is-not-empty`, `ux-machine-text-hidden`). Pick: yes.

14. **Orphaned mail counts toward no order.** Its ticks say "logged" and have no "of N". Pick: yes.

## Devices, type and colour

15. **Large phone size is not written.** `layout.py devices` printed `unknown` for this repo, the brief
    gives no size, and the HIG layout page read today has no device table. I drew it at 440 x 956 pt
    as a placeholder from memory, not from a source. Owner grant: yes (name the phone and its size).

16. **Largest text (AX5).** Content type uses the AX5 sizes. Bars (tab bar, Not saved bar, tape lines,
    toolbar) keep their default size, and the headers scroll with the list, so the list keeps room.
    Gain: at AX5 at least one card stays on screen. Loss: bar text does not grow. Pick: yes.

17. **Status bar and home indicator.** Drawn heights, not measured. Frames pad with
    `env(safe-area-inset-*)`.

18. **Large title.** The HIG toolbars page says a large title becomes a standard title on scroll. The
    mockup does not animate that; the build uses the native behaviour.

19. **Colour.** My own values, named by role: surface, raised, text, muted, line, accent, ok, fail,
    fail-bg, bead-empty. A light and a dark set. Red is never the only cue: each failure also has "!",
    words and a left edge. Owner grant: no; the informed designers map these roles to the repo's tokens.

## Apple pages read, 2026-11-21 (each answered 200)

- Layout (safe areas; size classes). Typography (Dynamic Type table: Large default and AX5).
- Accessibility (44 x 44 pt default control). Buttons (44 x 44 pt hit region).
- Sheets (Cancel or Close leading, Done trailing). Tab bars (navigation only; floats at the bottom).
- Toolbars (large title collapses on scroll). Lists and tables.

All under `https://developer.apple.com/design/human-interface-guidelines/`, read as JSON from
`https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`.
