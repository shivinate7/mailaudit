# Tracking checker, blind 1: notes

Designer kind: blind. Designer: tracking-checker-blind-1. Mockup: `tracking-checker-blind-1.html`.
Read for this work: the brief, the house files `principles.md`, `layout.md` and `tokens.md`, the
glossary, and the Apple pages below. No screen, code, spec, token file or mockup of the repo was
read. Every figure on the page is sample data.

## Sizes and sources

- Duo folded 466 x 678 pt and Duo open 951 x 669 pt, hinge x 455.5 to 495.5: from the brief.
  `layout.py devices` prints `unknown` for this repo, and the house device list gives no size.
- Large phone: no size is written in the brief, the device list or any Apple page read. The frame
  is a placeholder that can be resized by dragging its corner. `#c=watch&d=phone` opened on a
  phone fills the screen.
- Apple pages, read 2026-11-21, each answered 200, from `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`:
  typography (Dynamic Type sizes at Large (default) and AX5), accessibility (44x44 pt default
  control size, text to at least 200 percent), buttons (44x44 pt hit region), sheets (Cancel
  leading, Done trailing, medium and large detents), tab-bars (floats at the bottom, navigation
  not actions), toolbars (large title), layout (safe areas, size classes), lists-and-tables.
- Type sizes and leading come from the typography tables. Spacing is on the house 4 px step,
  radius 8 px. Colours are this designer's own choice, by role, light and dark.

## Deep links

`#c=<watch|call>&s=<loaded|calm|empty|loading|failed>&t=<light|dark>&d=<folded|open|phone|ax5>`,
plus `sel=<order id>` (a package's detail, or its question in Mail call) and
`sheet=<alerts|nothere|add|ledger>`. `h=<watch,call,runway,threshold>` hides options. Examples:
`#c=call&s=loaded&d=folded`, `#c=watch&s=failed&t=dark&d=open`, `#c=watch&sel=t1&d=folded`,
`#c=watch&sheet=nothere&sel=n1`, `#c=call&sheet=ledger&d=open`.

Focus per option, for the waiting page:

| Option | Link | Focus |
| --- | --- | --- |
| Watch list | `#c=watch&d=folded` | `#watch-folded` |
| Mail call | `#c=call&d=folded` | `#call-folded` |
| Claim-window runway | `#c=watch&d=folded` | `#watch-folded-runway` |
| Stuck after N days | `#c=watch&sheet=alerts&d=folded` | `#watch-folded-threshold` |

## Choices

1. **Two concepts: Watch list and Mail call.** Watch list is a list grouped by what needs you,
   with a detail page. Mail call asks one question per package that needs you, then says
   "All is well." Gain: the owner sees a calm, familiar structure beside a bold one. Loss: two
   designs to judge. Pick: show both; each has a Hide control.
2. **Mail call is the bold concept.** No tracking app I know of opens on a question instead of a
   list. It turns "if it says delivered and it isn't here, I want to know today" into a direct
   question: "Is it here?" Gain: the answer the carrier cannot give (did it reach your hands)
   is collected the same day, with one thumb. Loss: a person who wants to browse must press
   All. Pick: Mail call. Owner grant: yes (it sets the screen's whole structure).
3. **Six verdicts, not four.** The brief names on its way, delivered, stuck and returned. The
   page splits delivered in two: "Check your door" (carrier says delivered, not marked here) and
   "Here" (marked here). It adds "Can't read" for a number the carrier does not answer for, so
   unknown never shows as fine (house rule ux-unknown-is-not-empty). Gain: the one case the
   person fears gets its own name. Loss: two more labels. Pick: six. Owner grant: yes.
4. **Where "here" comes from.** The brief's data shape (carrier, number, latest status, time)
   says nothing about arrival. Both concepts collect it with an "It's here" press. A link to any
   mark-received act the app already has is assumed and unverified; the page tags it
   "Today (assumed)". Pick: one shared "here" mark. Owner grant: yes.
5. **Claim-window runway.** A one-line bar on each package that needs you shows days left to
   claim. The detail page adds the "Claim by" date, marked "(est.)". Gain: the person sees urgency before the window closes.
   Loss: the claim date is not in the data; it must come from the marketplace or the carrier.
   Pick: keep it, hideable. Owner grant: yes (needs a data source).
6. **Stuck after N days.** Stuck means no new scan for N days, default 4, set in Watch list's
   Alerts sheet with a stepper (a haptic on each step). Gain: the person tunes how early the
   warning comes. Loss: one more setting. Pick: keep, hideable. Owner grant: yes (the default).
7. **Early warning by notification.** The Alerts sheet sets the time of day the app asks about a
   delivered package ("Ask me at 6 PM that day"), plus switches for delivered-not-here and
   returned. A notification is not drawn; the HIG notifications page was not read. Pick: one
   notification per day, at the set time. Owner grant: yes (new permission prompt).
8. **Label once.** A verdict word shows once per screen: as the group header in the list, never
   in the row. Rows carry it by glyph shape and colour. The detail page says it in a sentence.
   `label_once.py` on the rendered frames prints nothing.
9. **Not here, next steps.** Pressing Not here never dead-ends: look in the mailbox, porch and
   locker first, then Ask me again tomorrow, Message the seller, or Start a claim. In Watch list
   this is a medium sheet; in Mail call it opens inside the question card. Each answer shows at
   the press. Pick: as drawn.
10. **Carrier text kept, raw codes hidden.** The carrier's own status line shows in quotes,
    because the person asked to see it. Event codes sit behind "What the carrier sent".
11. **Duo open uses both pages.** Watch list: list left, detail right. Mail call: the question
    and its buttons left, in the thumb's reach; the scans and "Still to ask" right. Nothing
    crosses the hinge (checked in a headless browser). The tab bar stays on the left page.
12. **Largest text size.** At AX5 the whole page scrolls with its buttons, rows stack the glyph
    above the text, and buttons stack full width. My own choice: bar buttons stay at 28 pt
    (Title 1 at the default size), so the title row keeps its shape; no Apple page I read says this.
13. **Tab bar.** One New tab, Tracking or Mail call, beside a dashed placeholder for the app's
    other tabs, which this designer does not know. A pushed detail page hides the tab bar, so
    its actions sit in the thumb zone.
14. **Loading and failed.** Loading shows "Asking 3 carriers. 1 of 3 answered." with Stop
    (ux-long-run-stops) and still placeholders. Failed shows which carrier did not answer, marks
    its packages' status as old, and offers Try UPS again, which answers in place.

## Critique (impeccable, single context)

Run degraded: no sub-agent tool in this session, so the design review and the detector ran in
one context. Detector: 8 findings. Seven "tight line height" (1.29x) are false alarms: the
leading is Apple's Dynamic Type leading. One "marquee" was the loading shimmer: fixed, removed.
Review findings fixed: the Mail call buttons sat under the tab bar; Not here's follow-up pushed
the buttons off the screen; AX5 buttons collapsed to zero height; bar buttons grew to 53 pt;
Refresh and All showed where they changed nothing; the sheet row renamed itself when pressed;
Try again gave no answer in place; Undo on a package marked here left it marked; the folded
Watch list showed two and a half rows (the runway is now one line, so three show). Open: none.
A two-level tap sweep in headless Chrome (every control, then every control it reveals, in
each state, folded and open) found no tap that fails, other than taps on controls under a sheet.

## Input needed

- The large phone's size in points.
- Where the claim-window date comes from, and how long the window is.
- Should Mail call also answer from the notification itself ("It's here" on the lock screen)?
- Should "Check your door" wait until evening, in case the person was out when the mail came?
