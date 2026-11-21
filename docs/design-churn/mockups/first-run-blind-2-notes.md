# First run, blind designer 2: notes

Mockup: `first-run-blind-2.html`. Designer kind: blind. Drawn from the brief's job, users and
house rules only. Every figure, seller, card and file name is sample.

Deep links: `#s=<state>` with `empty`, `import`, `pick`, `reading`, `preview`, `error`, `first`,
`ticked`, `day2`, `reimport`. Add `t=light` or `t=dark`, `c=week` or `c=envelope` (one option),
`f=folded|open|phone|ax5` (one frame) and `hide=week,envelope`.
Focus ids for the waiting page: `opt-week` and `opt-envelope` (each option's folded frame).

## Options

1. **Checklist by week.** One list of packages, grouped by the week ordered, oldest first; a
   week that is all in folds to one row. Two tabs: Checklist and Imports. The three words are
   taught on a card above the list, built from the person's own first package, with its cards
   tickable in place.
   Gain: familiar; the person sees the whole job at once; Imports shows every file and "Removed
   nothing", a lasting proof that nothing was erased.
   Loss: on day two the person hunts by search or by scroll; the list is long.
   Pick: keep as the safe option.
2. **Envelope in hand** (the bold one). No list and no tab bar as home. The first screen is the
   envelope in your hand: one box at the thumb asks for the name on it, the match opens like the
   envelope, and its cards are the checklist. "Still coming" is one tap away (a sheet when folded,
   the right page when open). The three words are taught by opening a drawn envelope from the
   person's own file.
   Gain: the app starts from the physical act the person is doing; the three words map onto the
   object (outside, what one seller sent, each line); no navigation to learn in the first minute.
   Loss: no overview on the home screen; a person who wants to browse must open Still coming.
   Pick: this one. It answers "I don't know what this wants from me" with one question.
   Departs from: house `tokens.md`, "On a phone, navigation uses a bottom tab bar". Owner grant: yes.

## Choices inside both options

3. **The three words.** Envelope = the mail in your hand. Package = what one seller sent for one
   order. Card = one line in a package; tick it when the card is in your hand. The brief names the
   words but not their meaning, so these are my reading.
   Gain: each word is a thing you can hold. Loss: if the product means something else by
   "envelope", the lesson is wrong. Pick: these. Owner grant: yes (confirms the terms).
4. **Teach on the person's own data.** The lesson uses a real package from the file just
   brought in (sample: Pebble Cards, three cards), and the first tick happens inside it.
   Gain: the first tick is real work, not a demo. Loss: a first package with one card or forty
   cards teaches less; the mockup picks one with three. Pick: this.
5. **Import is a preview, then Add.** Choose file, read with a Stop, then a check screen with
   counts (packages, cards, sellers) and a green line: "Adds them all. Nothing is here yet, so
   nothing is replaced." A second file says "Adds 12 new packages. The 214 already here stay as
   they are, ticks and all. Removes nothing." Nothing is added until Add.
   Gain: the person sees what the file holds before it lands; the no-erase promise is stated at
   the press. Loss: one extra tap. Pick: this.
6. **The file is on the computer.** A disclosure on the import sheet: AirDrop the file to the
   phone, or save it to iCloud Drive, then Choose file. The picker is drawn as a simplified
   system file picker.
   Gain: answers the first real blocker. Loss: it needs the app to accept a file from AirDrop and
   the Files picker; I cannot confirm the product does either. Builder support needed.
7. **Wrong file.** A text file gives "has no orders in it", "Nothing was added and nothing
   changed", a closed "What the file held" disclosure, and "Choose another file".
   Gain: no dead end; raw text stays hidden. Loss: none seen. Pick: this.
8. **Older orders on first run.** After the first import, packages ordered over three weeks ago
   may already be in the drawer. One offer: "Tick 131 as in hand" or "Leave them open". The
   press shows "Ticked 131 older packages as in hand. Undo" in the same spot. Until the offer is
   answered, nothing is flagged late.
   Gain: day two is not a wall of false "late" flags. Loss: a person who taps it without thought
   marks cards that never came; Undo covers the next moments only. The three-week line is my
   guess. Pick: this, with the line set by the owner. Owner grant: yes (sets the late line).
9. **Ticks are reversible.** Tap a tick again to take it back; the row shows Undo right after a
   tick; "Tick all N left" fills a package. Nothing in either option deletes an order.
   Gain: the first minute cannot erase anything. Loss: none seen. Pick: this.
10. **Envelope with no name.** "No name on it", in both options, sets an envelope aside, with a
    note in Envelope in hand. It changes no package.
    Gain: odd mail has a home. Loss: one more act to learn, though the first minute never needs it.
    Pick: this.
11. **Late flag.** A clock in the warning colour on a row that is over three weeks old and not
    all in; the word shows once, in the summary ("21 packages look late"), which also filters.
    With none it says "All is well."
    Gain: the word is read once, the shape carries it on rows. Loss: the clock alone needs its
    accessible label. Pick: this.
12. **Open pose.** Each option uses both pages: list left and package right (Checklist by week),
    or hand left and package or Still coming right (Envelope in hand). During the lesson the right
    page holds the three words, not a list. Sheets sit inside one page. Nothing crosses x 455.5
    to 495.5 (checked in the browser: zero elements cross).
    Gain: the open pose shows the thing and its detail together. Loss: two layouts to build.
    Pick: this.
13. **One ask at a time in the first minute.** The older-orders offer (item 8) waits until the
    lesson is done; the search box hides while the lesson shows on the folded screen, so the
    first card to tick sits above the fold.
    Gain: one decision per moment. Loss: search is one tap further on the very first screen.
    Pick: this.
14. **AX5.** Titles and lists scroll together; rows wrap and never truncate; the tab bar shows
    icons only; in Envelope in hand the two quiet acts leave the pinned slot and sit at the end
    of the scroll, so the box keeps its room. The search placeholder truncates, as iOS does.
    Icons-only at AX5 is my choice; no page I read sets it.
    Gain: every word stays whole at 53 pt body. Loss: icon-only tabs ask a first-timer to guess;
    only two tabs, so the guess is cheap. Pick: this.

## Blind limits

- No "Today:" labels: a blind designer does not know what exists. Every part is "New".
- Colours, the envelope colour included, are my own. Spacing on the 4 px step, radius 8 px, from
  `tokens.md`. Type sizes from the Apple table below.
- The repo's CLAUDE.md loaded into my context on its own when I started. I kept its view names,
  masthead and marketplace out of both options.

## Sizes

- Duo folded 466 x 678 and open 951 x 669 with the hinge at x 455.5 to 495.5: from the brief.
  `layout.py devices` printed "unknown" for this repo.
- Large phone: no size written anywhere I may read. Drawn fluid, 400 x 868 by default, with a
  width slider (360 to 460). The figures are a drawing choice, not a device.
- Status bar band 48 px and home indicator band 28 px: drawing assumptions. No page I read
  gives them. The CSS also reads `env(safe-area-inset-*)`.

## Apple pages read 2026-11-21 (each answered 200)

- HIG Typography: Dynamic Type table. Large (default): Large Title 34/41, Title 2 22/28,
  Title 3 20/25, Headline 17/22, Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18,
  Caption 1 12/16. AX5: Large Title 60/70, Title 2 56/66, Title 3 55/65, Headline 53/62,
  Body 53/62, Callout 51/60, Subhead 49/58, Footnote 44/52, Caption 1 43/51.
- HIG Buttons: hit region at least 44x44 pt.
- HIG Accessibility: let people enlarge text by at least 200 percent.
- HIG Layout: respect safe areas; lay out by size class.
- HIG Sheets: Cancel leading, Done trailing; pair Done with Cancel.
- HIG Tab bars: a tab bar floats above content at the bottom.
- HIG Toolbars and Lists and tables: read; used for the large title and list rows.
- The three SwiftUI pages (NavigationStack, TabView, List) were not read. No figure came from them.

## Checks run on the final file

- `check_ios_mockup.py`: exit 0.
- Browser click-through of both options (import, wrong file, add, tick, undo, bulk tick, search,
  open, set aside): no script error, no duplicate id, zero elements across the hinge.
- `label_once.py` on rendered folded and open frames of First look and A day later: no hit.
  Finished rows show a check mark, not the words "All in".
- Envelope text in dark mode: 5.7:1 after darkening the dark envelope colour (was 3.75:1).
