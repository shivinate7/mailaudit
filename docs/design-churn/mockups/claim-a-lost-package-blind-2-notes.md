# Claim a lost package: blind designer 2

Designer kind: blind. Designer: claim-a-lost-package-blind-2. Mockup:
`claim-a-lost-package-blind-2.html` in this folder. Every figure on it is sample data.

Deep links: `#c=<docket|letters|runway>&s=<state>&t=<light|dark>&d=<folded|open|phone|ax5>`.
States: `list`, `detail`, `copied`, `notrack`, `delivered`, `failed`, `loading`, `closed`,
`asked`, `edit`, `empty`. Leave out `t` to follow the device theme. Leave out `d` to see every
frame. `h=<concept>` hides a concept. The Hide button beside each concept does the same.
Focus ids: `#focus-docket`, `#focus-letters`, `#focus-runway`, on the folded frame in every
state. A focus link must not carry `d=open`, `d=phone` or `d=ax5`, which hide the folded frame.

Apple pages read 2026-11-21, as JSON under `developer.apple.com/tutorials/data/`. Each answered 200:
layout, typography, accessibility, buttons, sheets, tab-bars, toolbars and lists-and-tables, under
`design/human-interface-guidelines/`. Numbers used: the iOS Dynamic Type table at Large (default)
and AX5 (typography). Default control 44x44 pt and minimum 28x28 pt (accessibility). Button hit
region at least 44x44 pt (buttons). Done on the trailing edge of a sheet (sheets). The tab bar
floats above content at the bottom (tab-bars). The layout page holds no device sizes now.

## Items

1. **Three concepts, each with its own structure.**
   - Docket: a list, soonest deadline first, that pushes to a claim page.
   - Letters (the bold one): the first screen is the finished message. Its facts are underlined
     and open their source. A strip of stamps, one per late order, moves between letters.
   - Runway: one chart of every late order, from the order date to the claim deadline, with a
     Today line. A tap opens the claim kit in a sheet.

   Gain: the owner can cull by structure. Loss: three things to judge. Pick: Letters, because it
   answers "do not make me dig through three places" most directly. The message is the place.
   Docket is the safe fallback. Runway is best when many orders are late at once.
2. **Order: soonest deadline first. Closed windows go last.** In Docket, closed windows sit in
   their own section. In Letters and Runway, closed windows come after asked orders. Gain: the
   order that is about to be refused is on top. Loss: an order date sort is gone. Pick: deadline.
3. **Deadline tones.** 3 days or fewer is urgent (rust). 7 or fewer is warning (amber). Otherwise
   calm. Closed is grey. Each tone also carries a number and words, never colour alone. The
   thresholds are my own choice. Pick: as drawn.
4. **The message adapts to what is known.** It drops the tracking line when there is no tracking.
   It says "shows delivered, but it never reached me" when the carrier says delivered. It makes no
   status claim when the carrier failed or is loading. It adds a line when the window has closed.
   After "mark as asked" it becomes a short follow-up. Gain: the message is never false. Loss:
   more message variants to keep. Pick: as drawn.
5. **Refund or replacement.** A two-segment control sets the ask sentence. In Letters, the ask
   sentence is itself a fact that opens the control. Pick: refund by default.
6. **The card list goes inside the message.** Gain: the seller sees what to refund. Loss: a long
   message for 9 cards. Pick: include it. A toggle to leave it out could come later.
7. **No order number.** The data shapes in the brief hold no order number, so the message names
   the order by seller, date, count and total. Gain: nothing is invented. Loss: a seller may ask
   which order. See Input Needed.
8. **Copy and Share, not Send.** The screen cannot know how the person reaches the seller. Copy
   is the main action in a bar at the bottom, in thumb reach. Share opens the system share sheet,
   drawn here as a stub. "I sent it, mark as asked" is a plain button under them. Gain: no false
   promise. Loss: one manual step. Pick: as drawn.
9. **After asking.** The order moves from Late orders to Asked (Docket), or its stamp gets a
   check (Letters, Runway). The primary button becomes "Copy follow-up". Refunded and Arrived
   close the order. Each act answers at the press: "Marked as asked." with Undo, in the same row.
10. **Closed window is no dead end.** The band says the window closed and that the seller may
    refuse. Copy still works, and "Mark as lost" closes the order.
11. **Carrier states differ.** Loading shows a skeleton at the loaded line's height. Failed says
    so, with "Try again". The sample answers with a new scan after 1.2 s. No tracking says "No
    tracking number". None of them shows as empty or done. In Letters, a failed or loading carrier
    also shows under the deadline line, so it is seen without opening the tracking fact.
12. **Edit the message.** Edit opens a plain text field. The draft is kept per order in browser
    storage and survives a reload. An edited message stops updating its facts and says so, with
    "Undo edits". In Letters, edit mode trades the underlined facts for plain text.
13. **Empty state.** "No order is late. An order shows here on the day its claim window opens."
    The one control, "See orders still on the way", is a guess: the brief names no such list. See
    Input Needed.
14. **Type.** Chrome uses the system font at Dynamic Type sizes. The message itself uses the
    system serif (New York). Gain: what you send looks different from the app around it. Loss: a
    second face. Pick: serif for the message only.
15. **Duo open pose, one layout per concept.** Docket puts the list on the left and the claim page
    on the right, with the soonest order chosen. Letters puts the letter on the left and every fact
    it uses on the right. A tap on a fact rings its section. Runway puts the chart on the left and
    the kit on the right. Nothing crosses x 455.5 to 495.5. Each sheet opens inside one page.
16. **AX5 (body 53 pt).** Rows stack, and prices drop under names. Only Copy stays pinned. Share
    and the second act move into the scroll. In Letters the stamps and the postmark scroll away
    with the letter. In Runway the month ticks hide and Today stays. Sheet titles wrap under the
    sheet buttons. Loss: in Letters at AX5 the first view is the stamps, the deadline and Copy;
    the letter starts below them.
17. **No tab bar in Letters or Runway.** Owner grant: yes. The house default puts phone navigation
    in a bottom tab bar. Letters and Runway have one view each, so a tab bar would hold one tab.
    Docket keeps one, with two tabs: Late orders and Asked. Gain: the letter and the chart keep the
    screen. Loss: departs from the house default. Pick: no tab bar in those two.
18. **Fact targets in Letters are about 30 pt tall.** Owner grant: yes. They are inline words in
    a sentence. They sit above Apple's 28 pt minimum and below the 44 pt default. Each fact also
    shows in a list (sheet or right page) at full size. Pick: keep the inline facts.
19. **Colour.** My own palette, by role: indigo accent, rust urgent, amber warning, green asked,
    and a cool grey ground in light and dark. No repo or product colour was read.
20. **Sizes with no source.** The large phone is drawn at 440 x 956 pt. The brief and the device
    list give no size, and the Apple layout page holds none now. The status bar (44 pt) and the
    home indicator area (32 pt) are fallbacks behind `env(safe-area-inset-*)`, from no page.
21. **No "Today:" or "New:" labels.** A blind designer cannot see what exists today, so the page
    marks nothing as Today or New.
