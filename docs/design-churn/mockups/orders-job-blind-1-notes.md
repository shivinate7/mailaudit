# orders-job-blind-1: notes

Designer kind: blind. Designer: orders-job-blind-1. Mockup: `orders-job-blind-1.html` in this folder.

Job: "Did my new orders come in, or is it broken?" The helper runs on the person's computer. It
gives a last-run time, a count of new orders, a state (idle, running, failed) and a short error
text. The person checks it and starts it from the phone.

Deep links (append to the file URL): `#c=line` or `#c=ring`, then `&s=` one of `never`, `new`,
`none`, `old`, `running`, `failed`, `unknown`, then `&t=light` or `&t=dark` (no `t` follows the
system). `&sheet=helper` opens the On the list sheet; `&sheet=found` opens the Ring orders sheet.
`&marks=0` hides the Today and New marks. Focus ids: `line-status-row` (On the list) and
`ring-dial` (Ring).

Every frame draws the same state: Duo folded, Duo open, large phone, Duo folded at AX5. Each
item below has a control on the page that hides it, where it is an option.

## Items

1. **Concept "On the list".** A status line sits under the Orders title, above the order list.
   It names the state by shape and one sentence. A tap opens a sheet with the full answer, the
   error and Run now in the thumb zone. On the Duo open, the left page is the order list and the
   right page is the helper, always shown.
   Gain: the answer is on the screen the person already opens when mail comes; no new tab.
   Loss: the line is at the top, out of thumb reach; Run now is one tap deeper (in the sheet).
   Pick: this one, as the default. Hide: "Hide this concept" beside the concept buttons.

2. **Concept "Ring" (the bold one).** A Helper tab whose first screen is an age gauge. The ring
   fills with the time since the last news, so a glance says how fresh it is. Its colour and
   end mark say the state. The centre of the ring is Run now, and Stop while a run goes. On the
   Duo open, the right page is "Last run": what the run added, or what the helper said.
   Gain: "is it stale?" reads without reading; the main act sits mid-screen, in thumb reach.
   Loss: a new tab; the ring needs an agreed scale (item 6); it is a picture to learn.
   Pick: keep it for the owner to judge. No common app of this kind uses a gauge as its screen.

3. **State by shape, words once.** Each state has one shape: filled check (ran fine), spinner
   (running), triangle (failed), dashed circle with a question mark (not answering), empty circle
   (never run). The words come from one function per screen, so each state word shows once per
   frame. Gain: colour is never the only cue. Loss: none seen. Pick: yes.

4. **A "Not answering" state.** New. The phone cannot read the helper when the computer sleeps or
   is offline. House rule ux-unknown-is-not-empty forbids showing that as idle or empty. The screen
   shows the last news it has, when it last heard, a reason why Run now is off, and "Try to reach
   it". Gain: the person never reads stale news as fresh. Loss: it needs a "last heard from" time
   that the brief's data does not hold.
   Owner grant: yes (adds a data field). Pick: yes.

5. **What the run added.** New. A list of the orders the last run brought in: dots on the order
   list (On the list), "Show the 7 orders" and the Last run page (Ring). Gain: answers "which ones",
   not only "how many". Loss: the brief gives only a count, so the helper must say which orders.
   Owner grant: yes (adds a data field). Hide: "What the run added". Pick: yes.

6. **How fast the ring fills, and when a run is late.** The ring needs a span for a full circle.
   No value is given, so the page offers 6 h, 24 h and 7 days. The same unknown decides whether
   the app may say "late": with no expected interval, the "Old run" state still says "All is
   well." on the line, two days on. Ask: how often should the helper run? With that, the ring
   fills at twice the interval and a late run turns the line from "All is well." to "Late".
   Owner grant: yes (adds a setting or data field). Pick: 24 h until the owner answers.

7. **Run now from the phone.** One name for the act everywhere ("Run now", also after a failure).
   The button keeps its box: Run now becomes Stop in the same place. When the computer is not
   answering, Run now is off and the reason shows under it, since a phone has no hover.
   Gain: one act, one name; the answer shows at the press (the note line). Pick: yes.

8. **Stop.** A run can take minutes, so Stop shows while it runs (house rule ux-long-run-stops).
   The note after Stop says "Nothing changed." That is only true if a stopped run keeps no orders.
   Ask: does a stopped run keep what it already fetched? The note follows the answer.
   Pick: Stop yes; the note's words wait on the answer.

9. **Why it failed.** The screen says "The last run failed.", when, and "Orders placed since then
   may be missing." The helper's own text sits behind "What the helper said" (house guidance
   ux-machine-text-hidden). Gain: plain words first, raw text one tap away. Loss: the plain
   sentence cannot name the cause. Ask: can the helper send a short cause the app can name, such
   as "sign-in expired" or "site did not answer"? Then the sentence names it and offers its fix.
   Owner grant: yes (changes the error data). Pick: yes.

10. **Pull to run.** Option, On the list only: pull the order list down to start a run.
    Gain: a thumb gesture, no tap at the top. Loss: iOS pull-to-refresh ends in a moment; a run
    lasts minutes, so the gesture promises more speed than it gives. Hide: "Pull to run".
    Pick: hide it unless the run is quick.

11. **Biggest text size (AX5).** Body text is 53 pt on a 466 pt screen. Answers wrap and scroll.
    Run now (or "Try to reach it") is pinned above the bottom edge, never scrolled away. The Ring
    hides the centre button and shrinks the ring; the act moves to that pinned bar. Bar titles,
    the sheet's Close and the tab labels stay at their default size; that matches how iOS bars
    behave, from memory: no page read states it. Pick: yes.

12. **Large phone size.** The brief gives no size, `layout.py devices` printed `unknown`, and the
    HIG layout page's JSON had no device table. The frame is a placeholder, 440 x 956 pt.
    Ask: which phone and size? Pick: placeholder until then.

13. **"All is well." on the line.** The line is a status summary, so the normal state says "All is
    well." (house rule ux-all-is-well), and the count follows as data: "7 new orders, last run
    9:42 AM, 22 min ago". The sheet and the open-pose page give the full sentence. Pick: yes.

14. **A Helper tab (Ring only).** New. Tabs drawn: Orders and Helper. A blind designer does not
    know the app's other tabs; the builder adds the tab beside them. Pick: yes, for Ring.

15. **Colour and type.** Colours are by role, with a light and a dark set, chosen here; none comes
    from any product. Contrast, measured: text on surface 15.8 (light) and 15.7 (dark); muted text
    at least 5.4; button text on accent 6.1 and 7.0; each state colour on surface at least 5.4.
    Type is the system font at the Dynamic Type sizes of the HIG typography page, Large (default)
    and AX5. Space is on the 4 px step, radius 8 px for lists and fields, capsules for buttons.

16. **Numbers no page gives.** Status band 48 pt and home-indicator band 24 pt (drawn bands only),
    ring 240 pt with a 136 pt centre, tab 96 x 48 pt, buttons 50 pt tall (each at least 44 x 44 pt,
    from the buttons page). The sample run lasts 6 s and "Try to reach it" 2 s; both are mockup
    timing, not a claim about the helper.

17. **Haptics.** No control here changes a value, so house rule ux-haptics-feel-substantial does
    not ask for one. A light haptic on Run now and Stop is an option for the builder.

18. **Checks run.** `check_ios_mockup.py`: exit 0. An in-page hinge check walks every box on the
    Duo open: clear in all 28 concept, state and theme pairs. `label_once.py` on the rendered page
    flags shop names, "orders" and "helper" four times each: these are the same screen drawn in
    four frames, not a label shown twice on one screen. A headless run tapped through open sheet,
    Run now, Stop, a run to its end, failure, the disclosure, "Try to reach it", the orders sheet
    and hide concept: all passed. At a 390 px page width there is no sideways scroll.

## Critique pass (impeccable critique, design review only: native platform, no detector)

Nielsen scores, 0 to 4: status 3, real-world match 3, control 3, consistency 3, error
prevention 3, recognition 3, flexibility 2, minimalism 3, error recovery 2, help 2. Total 27/40.

1. P1, open. On the list: Run now is two taps away (line, then sheet), and the line sits at the top,
   out of thumb reach. Pull to run (item 10) is the only one-gesture path. A trailing Run button
   on the line was weighed and not drawn: the line is itself a button.
2. P1, open. Ring: at a 24 h span a fresh run is a dot, so the ring says little in the usual case.
   It waits on item 6.
3. P2, open. Ring "Old run": the full ring stays green, so "fine" and "stale" show at once. It
   waits on item 6 (no expected interval, so the app cannot call it late).
4. P2, open. A failed run cannot name its cause or its fix. It waits on item 9.
5. P3, fixed. The ring caption said "the age of this news"; it now says "time since the last run"
   (or "since your computer last answered").
6. P3, fixed. The never-run line said "Tap to run it", but a tap opens the sheet; it now says
   "Open to run it".
7. P3, fixed. The off Run now button pointed its reason at a missing id; each copy now names its
   own reason line.

## Apple pages read (2026-11-21, each answered 200)

- https://developer.apple.com/design/human-interface-guidelines/typography: Dynamic Type tables,
  Large (default) and AX5.
- https://developer.apple.com/design/human-interface-guidelines/buttons: 44 x 44 pt hit region;
  start a label with a verb.
- https://developer.apple.com/design/human-interface-guidelines/sheets: Cancel or Close on the
  leading edge; grabber; detents.
- https://developer.apple.com/design/human-interface-guidelines/tab-bars: navigation, not
  actions; floats above content.
- https://developer.apple.com/design/human-interface-guidelines/progress-indicators: spinner for
  a run of unknown length; refresh control.
- https://developer.apple.com/design/human-interface-guidelines/layout: size classes; it gave no
  device sizes.
- accessibility, lists-and-tables and toolbars pages: fetched; no number used from them.
