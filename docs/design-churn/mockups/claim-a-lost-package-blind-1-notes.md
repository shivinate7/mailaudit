# claim-a-lost-package-blind-1: notes

Designer kind: blind. Mockup: `claim-a-lost-package-blind-1.html` in this folder. It opens from disk.

Job, from the brief: one place that holds what was ordered, from whom, when, the carrier status,
the days that have passed, and a message ready to send, for each order whose claim window is open.

## Deep links

Add one of these to the file URL. Parts join with `&`.

- `#s=late` first screen, `#s=claim` claim open, `#s=copied`, `#s=share` share sheet,
  `#s=evidence` fact tapped, `#s=sent` marked as sent, `#s=notrack` no tracking number,
  `#s=failed` carrier not read, `#s=expired` claim window closed, `#s=edited` message edited,
  `#s=empty` nothing late, `#s=loading`.
- `t=light` or `t=dark`. With no `t`, the page follows the system setting.
- `h=desk` or `h=letter` hides one option. Each option also has its own Hide button on the page.
- Focus ids for the waiting page: `opt-claim-desk` and `opt-the-letter`.

## Devices drawn

- Duo folded, 466 x 678 pt, and Duo open, 951 x 669 pt with the hinge from x 455.5 to x 495.5.
  Sizes are from the brief: `layout.py devices` printed `unknown` for this repo.
- Large phone at 430 x 932 pt. This size is assumed. Neither the brief nor the device list writes one.
  The layouts use container widths, so another width changes little.
- Duo folded at AX5, the largest accessibility text size.
- Light and dark themes for every frame.

## Apple pages read, 2026-11-21

Each answered 200, read as the `.json` form under `developer.apple.com/tutorials/data/`.

- Typography: the iOS Dynamic Type sizes, Large (default) and AX5 tables. Every type size in the mockup
  comes from these two tables.
- Buttons: a hit region of at least 44 x 44 pt.
- Layout: respect the safe areas. The Duo insets in the mockup are drawn sizes. No page gives them.
- Sheets: Cancel on the leading edge, Done on the trailing edge.
- Accessibility, lists and tables, tab bars, toolbars, segmented controls: read for the parts used.

## Choices

1. **Two options.** Claim desk is a list of late orders and a claim page. The letter makes the drafted
   message the first screen and puts every fact inside it. Gain: the owner compares a safe structure with
   a bold one. Loss: two things to judge. Pick: The letter, for the open Duo, where the letter and its
   evidence face each other. Claim desk is the safer build. Owner grant: no.
2. **Order of late orders.** Open claims first, soonest deadline first. Closed windows after them.
   Gain: the claim about to be refused is at the top. Loss: an old order with a far deadline sits low.
   Pick: deadline first. Owner grant: no.
3. **Days-left badge** (Claim desk). Each row leads with the days left to claim. Three days or fewer
   gets a warning colour and a ring, so the tone is not carried by colour alone. A closed window shows a
   crossed circle, a sent claim a check. Gain: one glance finds the urgent claim. Loss: days since the
   order moves to the second column. Pick: as drawn. Owner grant: no.
4. **One scroll for the claim** (Claim desk). Seller and days left, then the facts (ordered, waited,
   carrier, paid), then the message, then the card list. Gain: no digging. Loss: on the folded Duo the
   message starts below the fold. Pick: as drawn. Facts come first so the person can check them before
   copying. Owner grant: no.
5. **The message is drafted, then editable.** Edits stay when the person leaves and comes back, and
   "Use the drafted text" undoes them. Gain: no lost words. Loss: an edited message no longer follows a
   later carrier change. Pick: keep edits. Owner grant: no.
6. **Copy, then Mark as sent.** Copy puts the message on the clipboard. The bar then says Copied and
   offers Mark as sent. A second copy answers with a toast. Gain: the app never claims a message was sent
   when it was only copied. Loss: one more press. The other choice, marking sent on copy, saves the
   press but can be wrong. Pick: two steps. Owner grant: no.
7. **Share** opens the system share sheet, drawn here with Mail, Messages, Notes and Copy. Which apps
   appear is the system's choice. Owner grant: no.
8. **Closed claim window.** The page says when it closed and that the seller may refuse, and still
   lets the person copy the message. Mark as lost moves the order out of the open list, with Undo.
   Gain: no dead end. Loss: none found. Owner grant: no.
9. **Carrier states.** Stalled: last scan and days since. No tracking number: the message says so.
   Not read: "Could not read the carrier", Try again, and the server's words behind "What the server
   said". The message then gives the tracking number and makes no claim about where the package is.
   Gain: a failed read never shows as "no movement". Owner grant: no.
10. **It arrived.** On every claim. It removes the order from the screen, with Undo. Owner grant: no.
11. **Facts inside the letter** (The letter). Each fact is an underlined phrase in the letter. Tap one
    to see its source: a sheet when folded, the matching section lit on the right page when open.
    Inline phrases in running text cannot each have a 44 pt hit region without overlap. Fix: a second
    route of 44 pt rows, "What the letter says", under the letter when folded, and the right page when
    open. Gain: the message and its proof are one object. Loss: underlines add texture to the letter.
    Pick: as drawn. Owner grant: no.
12. **Leave a fact out** (The letter). Switches on the carrier and the card list take them out of the
    letter. Gain: a short message for a seller who wants one. Loss: one more control. Owner grant: no.
13. **Pager order holds still** (The letter). One letter per late order, in a fixed order. A sent
    letter keeps its place and gets a stamp. The dots under the pager show sent, closed and open, and
    each dot is a 44 pt target. Swipe or the arrows move between letters. Gain: nothing jumps after a
    press. Loss: sent letters stay in the pager. Pick: as drawn. Owner grant: no.
14. **Deadline fuse** (The letter). A bar above the letter shows how much of the claim window is left,
    with the days and the date in words. Owner grant: no.
15. **Airmail edge and system serif** (The letter). The letter is set in the system serif
    (`-apple-system-ui-serif`) on a page with an airmail stripe. App chrome stays in the system font.
    This is the one loud element. Gain: the screen reads as a letter, not a form. Loss: a serif is new
    to an app that may use only the system sans. Owner grant: no.
16. **Open Duo.** Claim desk: list on the left page, claim on the right. The letter: letter on the
    left, evidence on the right. Each sheet, toast and bar stays inside one page. Nothing crosses the
    hinge. Owner grant: no.
17. **Largest text (AX5).** Rows and fact lists stack label over value. The back button shows only its
    chevron. In The letter, the pager and fuse scroll with the letter so the letter keeps the screen.
    Loss: the bottom bar takes about a quarter of the folded screen at AX5. Owner grant: no.
18. **Empty, loading and failed.** Empty says "All is well.", one sentence, and one control. Loading
    keeps the loaded size. A failed carrier read is its own state, never empty. Owner grant: no.
19. **No tab bar drawn.** House tokens put phone navigation in a bottom tab bar. A blind designer does
    not know the app's other sections, so the screen is drawn as one section. Owner grant: no.
20. **Colour.** By role, my own values, light and dark. Ink blue for actions, amber for a near
    deadline, red for a closed window, green for sent. No product colour was used. Owner grant: no.

## Labels

Every part is marked "New:" on the page. A blind designer has not seen today's screen, so no part is
marked "Today:".

## Critique (native platform: design review only, no detector)

Fixed:

- Fact underlines with tinted fills made the letter read like a form. Now: a light underline, and a
  dotted one on the card lines.
- The Sent stamp covered words of the letter. Now smaller, beside the greeting line.
- The evidence sheet showed its heading twice. One heading now.
- Pager dots did not say their state to a screen reader. Each label now names it.
- Copy on a sent claim showed no answer. It now answers with a toast.
- AX5: the letter was pushed off the folded screen, the sheet title hit Done, and the back label
  wrapped. All three fixed.

Open, for the owner:

- Should Copy also mark the claim as sent? (item 6)
- Should one seller with several late orders get one combined message? The brief does not say whether
  this happens.
