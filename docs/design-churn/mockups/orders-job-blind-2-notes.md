# Order check concepts: notes (designer orders-job-blind-2)

Designer kind: blind. Mockup: `orders-job-blind-2.html` in this folder. All figures are samples.

Job, from the brief: "Did my new orders come in, or is it broken?" A helper on the person's
computer pulls new orders from the sellers' site. It has a last-run time, a count of new orders, a
state (idle, running, failed) and a short error text. The person wants to start it by hand, with no
terminal.

Deep links (append to the file path): `#s=<state>`, `&t=dark` or `&t=light`, `&c=strip|answer|slot`
(one concept only), `&open=sheet|drawer|why|fix`, `&tags=0` (hide the Today and New labels).
States: `new`, `none`, `running`, `waiting`, `failed`, `stale`, `unknown`, `never`, `stopped`.
A deep-linked state stays put. Only a press starts a timed change.

Focus ids for the waiting page: Status strip `#strip-status`, Answer page `#answer-sentence`,
Mail slot `#slot-band`. Each sits in the folded frame of its concept.

## Choices

1. **Status strip (concept).** The order list stays the first screen. One strip above the tab bar
   says what the last check did. A press opens a sheet with the detail and Check now. Open, the
   right page holds the detail all the time.
   Gain: no new screen or tab; the answer shows every time the list opens.
   Loss: starting a check takes two presses (strip, then Check now), except while a check runs,
   when Stop check sits in the strip itself. The strip costs list height on the folded screen.
   Pick: strong second. Hide control: "Hide this concept".

2. **Answer page (concept).** A tab of its own, Order check. The screen asks the person's question,
   "Did new orders come in?", and answers it in one line at Large Title size: "Yes. 3 new orders came
   in." or "No. The last check failed." Check now sits above the tab bar. Open, the right page shows
   the orders the check brought, or the sign-in steps when it failed.
   Gain: the plainest answer to the job; one press starts a check.
   Loss: a third tab; the person has to go to it, so a failure is only seen there unless a badge is
   added (not drawn).
   Pick: my pick for the job as written. Hide control: "Hide this concept".

3. **Mail slot (concept, the bold one).** The order list runs upward, newest at the bottom, next to
   the thumb. The helper is a slot band right above the tab bar: new orders sit just above it, under
   a line "Brought by the 9:14 check". The slot's top edge changes colour by state, and a light runs
   along it while a check runs. A press on the slot opens a drawer with the detail. Open, the hinge
   is the line: the left page holds what the last check brought, and the right page holds everything
   before.
   Gain: the answer and its proof are in one place, at the thumb; no app of this kind ties the run to
   the orders it brought.
   Loss: an upward list is unusual for a list that is not a chat, and it needs to know which orders
   each check brought (item 7). At the largest text size the slot joins the end of the list.
   Pick: worth a look; the riskiest. Hide control: "Hide this concept".

4. **Result line and health line are kept apart.** House rule ux-all-is-well asks a status summary
   to name only what is not normal. Here the line is the run's result ("3 new orders came in"), not a
   health summary, so it shows in every state. A not-normal state changes its glyph, colour and words.
   Gain: the job's question is answered in the normal case too.
   Loss: a reviewer may read the strip or slot as a status summary and flag it.
   Pick: keep the result line. Owner grant: yes.

5. **Nine states, each its own words and glyph.** New orders, nothing new, running, waiting for the
   computer, failed, stale, unknown, never run, stopped. Unknown and failed never show as zero or
   empty (ux-unknown-is-not-empty). Never run is one sentence and one control. Each glyph differs in
   shape, not only colour.
   Gain: "is it broken?" has a true answer in each case.
   Loss: four of the states need data the brief does not give (items 6 to 9).
   Pick: keep all nine.

6. **Start from the phone, and "Waiting for your computer".** Check now on the phone asks the
   computer to run. Until the helper picks it up, the screen says "Waiting for your computer", with
   Cancel the ask. Marked "New: start from this phone" and "New: computer picks up the ask".
   Gain: the person starts a check with no terminal, and never sees a press that seems to do nothing.
   Loss: needs a way for the phone to reach the helper, which the brief does not name.
   Pick: keep. Owner grant: yes.

7. **Which orders a check brought.** The concepts mark the orders from the last check with a dot
   and group them. The brief gives a count only. Marked "New: which orders the check brought".
   Gain: "what it found" becomes the orders themselves, not a number.
   Loss: needs the helper to record which orders it added. Without it, Status strip and Answer page
   fall back to the count; Mail slot loses its point.
   Pick: keep. Owner grant: yes.

8. **Stale.** When the last check is old, the screen says "No check since Thursday" and that the
   computer may be asleep or off. Marked "New: stale after a set time".
   Gain: a helper that silently stopped is caught, which is the "or is it broken" half of the job.
   Loss: needs a threshold. I do not know if the helper runs on a schedule.
   Pick: keep, threshold for the owner. Owner grant: yes.

9. **Unknown.** "Can't tell if the helper ran" when the phone cannot read the status, with Try again.
   Marked "New: a status read can fail".
   Gain: a failed read never looks like "nothing new".
   Loss: none beyond the state itself.
   Pick: keep.

10. **Failed: plain sentence first, helper text behind a disclosure.** "The sellers' site signed the
    helper out." The raw text sits behind "What the helper said" (ux-machine-text-hidden). Two
    controls lead on: Check now, and How to sign in again (ux-no-dead-end). The sign-in steps are
    marked New: I do not know what the helper shows on the computer.
    Gain: the person knows what broke and what to do.
    Loss: needs a map from the helper's error text to plain sentences.
    Pick: keep.

11. **Stop check.** While a check runs, Stop check takes Check now's place, in the same box, so
    nothing moves (ux-long-run-stops, ux-answer-at-press). The button box holds its widest label.
    Pick: keep.

12. **Largest text size (AX5).** Sizes from the HIG AX5 table. The strip and the slot join the list
    and scroll with it; the Answer page's buttons follow the answer. The tab bar keeps its size, as
    iOS tab bars do.
    Pick: keep.

13. **Colours and type.** System font only, Dynamic Type sizes at the default size. Colours are my
    own picks by role, light and dark: a cool grey-green surface, a deep blue for actions, green for
    a good result, amber for stale and unknown, red for failed. Spacing on the 4 px step, radius 8
    for cards; buttons and the tab bar are capsules, as on iOS 26.
    Pick: keep.

## Devices and sizes

- Duo folded 466 x 678 and open 951 x 669, from the brief. `layout.py devices` printed `unknown`,
  and `layout.json` writes no size for any device.
- Hinge drawn as a 40 pt gap from x 455.5 to 495.5. Nothing crosses it; each page has its own
  status bar.
- Large phone: no size is written in the brief or the device list. Drawn at 402 x 874 as a
  placeholder, and labelled so on the frame. Owner grant: yes (give the size).
- The status bar (44) and home indicator (20) insets are drawn, not measured.

## Apple pages read 2026-11-21

Each answered 200 through `developer.apple.com/tutorials/data/...json`:
layout, typography (default and AX5 Dynamic Type tables), accessibility (44x44 default control,
17 pt default text), buttons (44x44 hit region), sheets (Done on the trailing edge), lists and
tables, tab bars (floats at the bottom, for navigation), toolbars.
