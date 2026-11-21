# Mail day flow: blind designer 1

Designer kind: blind. Mockup: `mail-day-flow-blind-1.html`. Every name, sender, item and count in it is
sample data. The brief gave no data shapes, so the mockup assumes one: an expected envelope has a sender
and a short list of things that should be inside. Piles are by the first letter of the sender.

Deep links: `#c=route|stack` picks the concept, `&s=<state>` opens a state, `&t=dark|light` sets the
theme. States: `loading`, `error`, `empty`, `start`, `sort`, `work`, `envelope`, `pilebreak`, `aside`,
`done`, `clean`, `resume`.

## Sources

- Brief sizes: Duo folded 466 x 678 pt, Duo open 951 x 669 pt with the hinge gap at x 455.5 to 495.5.
- `layout.py devices` printed `unknown` for this repo, so no device size came from it.
- The large phone has no written size. It is drawn at a stand-in of 402 x 874 pt, and its frame says so.
- Apple pages, read 2026-11-21 as JSON (each answered 200): typography (iOS Dynamic Type tables "Large
  (default)" and "AX5"), accessibility (44x44 pt default control, 28x28 pt minimum, about 12 pt padding,
  text to at least 200 percent), layout (safe areas), buttons, sheets, tab-bars (the tab bar floats
  above the content), toolbars, lists-and-tables.
- Unmeasured placeholders, from no page read: status bar height 24, home indicator area 20, tab bar
  height 56. The tab bar keeps its default text size at AX5; no page read confirms that iOS does this.
- House files: `principles.md`, `layout.md`, `tokens.md`. Spacing on the 4 px step, radius 8 px, system
  font. The colours are this designer's own, named by role, with a light set and a dark set.

## Design choices

1. **Two concepts, each a different structure.** Route is a guided route of stops on one scrolling
   screen, plus a set-aside tab. Stack has no list and no tabs: the screen is the pile of post itself.
   Gain: the owner compares two answers to the job, not two skins. Loss: twice the build cost if both
   survive. Pick: keep both on the page; the owner culls. Each has a Hide control.

2. **Route: the day is one ordered route.** Stops: bring in the post, sort into piles, one stop per
   pile, done. Stops above the open one are ticked; the open stop holds its one next step. Gain: the next
   step is always the open stop, and "how much is left" is the whole route at a glance. Loss: a long
   route scrolls on the folded pose, and at AX5 it is very long. Pick: Route as the calm default.

3. **Stack: the height of the pile is the count.** Each envelope is a strip in a tray. The top envelope
   rests on the pile, so it sinks as you file. Bands in the pile are the sorted piles. Done is an empty
   tray. Gain: the person sees what is left without reading a number; there is one place to press. Loss:
   no common app works like this, so it needs a first look to learn; above about 30 envelopes the strips
   get thin. Pick: Stack as the bold option.

4. **Count first, then sort.** The day starts by counting the envelopes in hand with a stepper. The sort
   step splits that count into four piles by first letter, with a stepper per pile, and refuses to go on
   until the piles add up. Gain: "left" is known from the first minute, and a lost envelope shows as a
   mismatch, not as silence. Loss: one more step before the first envelope. Pick: keep it. Until the
   count is taken, the count line says "Not counted yet", never 0.

5. **One envelope: who sent it, then what is inside.** Pick the sender from the people still due in this
   pile, then tick each thing inside. "All here" ticks everything. "File it" names how many are missing.
   Gain: two short choices per envelope, both in reach of the thumb. Loss: a sender in the wrong pile is
   not in the short list; the person must use "Not on my list". Pick: keep the short list; see Input
   Needed 3.

6. **Odd mail goes aside, never blocks.** "Not on my list" and "No sender on it" set the envelope aside.
   A filed envelope with a missing thing also counts as odd. Odd mail sits in the Set aside tab (Route) or
   the side tray (Stack), each item with "Sorted out". Gain: the day can always finish. Loss: odd mail
   waits for a second visit. Pick: keep.

7. **A pile break.** When a pile empties, a short card says so and offers "Start pile <next>". Gain: it
   matches the person picking up the next physical pile, and gives a small moment of progress. Loss: one
   extra press per pile. Pick: keep; the owner may drop it.

8. **Done is a status summary.** "Done. All 11 envelopes are accounted for." With nothing odd it says
   "All is well." and nothing else. With odd mail it lists only the odd items. "Finish for today" closes
   the day and starts a fresh count. Gain: a clear end. Loss: none found. Pick: keep.

9. **Place is never lost.** Every press saves the whole day on the device. "Leave and come back" on the
   mockup closes and reopens it; the screen opens where it was, with one line: "Welcome back. You were on
   pile F–L, envelope 2 of 3." Undo sits beside the last answer. Gain: the brief's "nothing may lose their
   place". Loss: none found. Pick: keep. The mockup uses browser storage only as a stand-in.

10. **Open pose: object left, hands right.** Route: the route on the left page, the open stop's work on
    the right. Stack: the pile on the left page, the opened envelope (or the count and sort steppers) on
    the right. Nothing crosses the hinge; each sheet and note stays inside one page. Gain: the two-page
    layout uses its width, not a wider folded screen. Loss: none found. Pick: keep.

11. **No tab bar in Stack.** House `tokens.md` says phone navigation uses a bottom tab bar. Stack has
    one screen and a side-tray button, so a tab bar would hold one tab. Gain: the pile gets the screen.
    Loss: it departs from the house default. Pick: no tab bar in Stack. Owner grant: yes.

12. **Main action in the dock, in thumb reach.** On the folded pose and the phone, the one main action
    sits at the bottom. At AX5 the dock flows at the end of the scroll instead of being pinned, so it
    does not eat half the screen. Gain: thumb reach at the default size, no clipping at AX5. Loss: at
    AX5 the main action needs a scroll. Pick: keep.

13. **Haptics.** Steppers: a light tick on each change. Tick of an item: a light tick. "File it": a
    success haptic. Set aside: a soft haptic. Done: a success haptic. Gain: each change feels real (house
    rule ux-haptics-feel-substantial). Loss: none found. Pick: keep.

14. **System states.** Loading says what it reads. A failed read says what failed, keeps the count and
    place, hides the device's own words in a closed disclosure, and offers "Try again". Empty is one
    sentence and "Add what you are waiting for". Gain: none of them looks like zero or done. Loss: where
    the expected list comes from is unknown to a blind designer. Pick: keep; see Input Needed 2.

15. **Icons are placeholders.** The two tab icons in Route are text glyphs. A build uses system symbols
    of the same meaning: one for today's route, one for the set-aside tray. Gain: none; this is a
    mockup limit. Pick: the builder picks the symbols.

16. **One name per place.** Route calls odd mail "Set aside" (the tab and its title). Stack calls it
    "Side tray" (the button, the sheet, and each act that sends mail there). Each concept keeps one name.
    Gain: a press always says where the envelope goes. Loss: the two concepts differ; the owner keeps one.

## Input Needed

1. The large phone's real size. It is drawn at a stand-in.
2. Where the list of expected mail comes from, so the empty state's one control names the real way to
   fill it.
3. Whether a sender may arrive in a pile other than their letter (for example a trading name). If yes,
   the sender pick needs a search over every pile.
