# offline-day-blind-2: notes

Designer kind: blind. Mockup: `offline-day-blind-2.html`. Two concepts: **Stamped list** and
**Two copies**, the bold one. Each item gives what it is, the gain, the loss and the pick. Every name, time and
count in the mockup is a sample.

Deep links: `#c=stamped|copies`, `&s=offline|sending|noreply|sent|conflict|decide|failed|synced|unknown|empty|loading`,
`&v=arrived|changes` (Stamped list tab), `&t=light|dark`, `&hide=stamped|copies`. Each frame shares one
state, so a tap anywhere moves every frame. The dashed sample-event buttons outside the frames act out
the signal and the shared record.

## Concepts

1. **Stamped list.** A list first. A tab bar holds Expected, Arrived and Changes. A truth line at the top
   says what is true now ("No signal since 7:52 AM. 3 marks are kept on this phone."). Each row carries
   a stamp whose shape tells where the mark lives. Changes lists every mark until the shared record
   confirms it. Open pose: the list sits on the left page and Changes on the right, always in view.
   Gain: familiar, one thumb, and the Changes tab is the receipt the person can check. Loss: the shared
   copy is only implied, through the stamps and Changes. Pick: keep it as the safe option.
2. **Two copies (bold).** No tab bar. Every row shows two cells: what this phone holds, and what the shared
   copy held when this phone last saw it, with that time in the column head. A difference bar in the
   thumb zone counts the rows that differ and filters to them. Open pose: the two copies become two
   facing pages, row for row across the hinge. A saved mark slides into the right page. Gain: the
   person sees both copies, so the app cannot quietly claim a save. Loss: twice the marks to read, and
   it is new to people. Departs from the house tab bar default. **Owner grant: yes.** Pick: draw it for the
   owner to judge. This is my lead if the owner wants the strongest answer to "not lie to me".

## Shared choices

3. **Stamp shapes carry the state.** Shapes: dashed ring with a check means kept on this phone. A spinning
   arc means sending. A dashed ring with "?" means sent with no answer yet. A filled disc means saved.
   A diamond means two answers. A crossed square means reported lost. Colour only repeats the shape. The words
   appear once, in the Changes legend (label-once). Gain: a glance shows what reached the shared record,
   and the stamps survive forced colours. Loss: six shapes to learn. Pick: keep.
4. **"Sent, no answer yet" is its own state** (`s=noreply`). A flaky signal can send a mark and lose the
   reply. The mark is not shown as saved and not as failed. It stays on this phone, and "Check again"
   resends it. Each mark carries its own id, so the shared record counts a resend once. Gain: no false
   "Saved", no doubled mark. Loss: one more state. Pick: keep. The resend-by-id is a build need: the
   builder must give each mark a stable id the server dedupes on.
5. **"Saved" means the shared record confirmed it**, never "on all your devices". The other device may not
   have pulled yet. Gain: every claim is true. Pick: keep.
6. **The shared copy always shows its age.** Offline it is the last copy this phone saw ("As of 7:52 AM").
   Gain: the person knows how old it is. Pick: keep.
7. **A mark made offline is never dropped.** When another device says something else (the sample: the
   kitchen tablet reported Bramble & Co. lost at 10:15 AM, and this phone marked it arrived at 11:01 AM),
   both answers are kept and a sheet asks once. Later keeps both. "It arrived" is first, since the person
   held the mail later. Gain: nothing lost, and the person decides. Loss: one question. Pick: keep. This
   rule is my reading of the brief. **Owner grant: yes**, because it sets the merge rule.
8. **The same mark from two devices counts once** (`s=sent`): "Little Wren Prints was also marked on the
   kitchen tablet. It is counted once." Gain: the person sees why the count did not double. Pick: keep.
9. **A marked row stays in place.** It does not jump to Arrived while the person stands at the box. A
   second tap on a mark kept on this phone undoes it, with "Undone. Nothing was sent." at the row. Gain:
   no hunt, easy undo (house rule on order). Pick: keep.
10. **Failure and unknown are not empty.** "The shared record did not answer" keeps the marks and offers
    Try again. The server text hides behind "What the server said". "This phone has no copy of the list
    yet" is shown with no signal and no list. "Nothing is on its way" shows only when the shared record
    says so. Loading has a Stop. Pick: keep.
11. **Open pose by width, not a stretched phone.** Stamped list: list beside Changes. Two copies: phone
    page beside shared page, rows aligned and scrolled together. Nothing sits in the hinge gap
    (x 455.5 to 495.5). Pick: keep.
12. **AX5.** Rows restack. In Stamped list the stamp becomes a full-width button with its words. In Two
    copies the two cells sit under the name, and the bar keeps only the differences control. The tab bar
    keeps its size, as iOS tab bars do. Pick: keep.

## Sizes, sources and gaps

13. **Sizes.** Duo folded 466 x 678 and open 951 x 669 come from the brief. `layout.py devices` printed
    `unknown` for this repo. The large phone has no written size. It is drawn at the folded size as a
    stand-in, and its frame can be resized. Status bar (28) and home indicator (20) heights are my
    choice: no Apple page I read gives them. **Owner grant: yes** for a real large-phone size.
14. **Apple pages read 2026-11-21** (all answered 200): human-interface-guidelines layout, typography,
    accessibility, buttons, tab-bars, toolbars, sheets, lists-and-tables. Used: Dynamic Type sizes at Large
    (default) and AX5 from typography, 44x44 pt targets from accessibility and buttons, the floating tab bar
    from tab-bars, Cancel on the leading edge of a sheet from sheets (drawn as "Later", since it keeps both).
15. **Colours, type and spacing.** Spacing on the 4 px step, radius 8 px, from house `tokens.md`. The colours
    are my own role tokens, light and dark. The system font is used throughout. The sheet's top corners (16) are the system's
    shape, not the house radius.
16. **No "Today:" labels.** A blind designer sees no current screen, so every dashed label reads "New:".
    The labels can be turned off with "New: labels".

## Critique (impeccable critique, own pass, 2026-11-21)

Run in one context with no sub-agents, as the coordinator ordered. The impeccable detector ran on the
file. I rendered the mockup headless and checked 13 deep links: no script errors, no overflow, and no tap
target under 44 pt. `check_ios_mockup.py` exits 0.

- Fixed: rows and the sheet shrank and overlapped at AX5. Children of the scroll area and the sheet no longer shrink.
- Fixed: the two open pages of Two copies did not line up row for row. The page heads now share one height.
- Fixed: at AX5 the Changes legend filled the first screen. It now follows the marks.
- Fixed: at AX5 the Two copies bar took a third of the screen. It keeps only the differences control, and
  the status sentence moves into the page.
- Fixed: Two copies had no visible control for a disagreement other than tapping the row. The bar now
  shows Choose, and its count shows the diamond.
- Fixed: "New:" tags were clipped at the right edge of the frame. They now sit at the left.
- Detector: `cramped-padding` on the device frame is a false alarm, because the bezel holds the
  app layer. `tight-leading` (1.29) is Apple's Body 17/22 leading. Kept.
- Open: the sending stamp is a faint ring and arc, which reads close to "not marked" when the motion
  is reduced. A builder could add a dot in the centre.

### Questions from the critique

- Should a mark kept on this phone show its age after a set time, such as "kept 3 hours"?
- In Two copies, should the folded pose open on the difference filter whenever anything differs?

## Input needed

- Item 2, the bold concept with no tab bar: Owner grant: yes.
- Item 7, the merge rule (an offline mark is kept, and a disagreement asks): Owner grant: yes.
- Item 13, a real large-phone size: Owner grant: yes.
