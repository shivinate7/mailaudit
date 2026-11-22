# First run, blind designer 1: notes

Designer kind: blind. Mockup: `first-run-blind-1.html` (opens from disk, no network).
Every figure, seller, card and order in the mockup is sample data.

Deep links: `#s=<state>&t=<theme>&c=<option>`. States: `empty`, `add`, `importing`,
`failed`, `imported`, `ticked`, `loaded`, `envelope`, `merge`. Themes: `light`, `dark`
(no `t` follows the system). Options: `checklist`, `tape`; `c` scrolls to and focuses that
option's folded frame (`#choice-checklist`, `#choice-tape`).

Frames per option: Duo folded 466 x 678, Duo open 951 x 669 (two pages, 40 pt hinge gap,
nothing crosses x 455.5 to 495.5), large phone, and Duo folded at AX5 text.

## Options

1. **Guided checklist.** A list you work down, with a tab bar (Waiting, In hand,
   Envelopes). The empty screen is one sentence and one button. After import, three
   numbered steps sit above the real list and tick off as the person acts, so the
   tool is learned by use. Open pose: list on the left page, the package's cards on
   the right.
   Gain: familiar iOS shape; scales to hundreds of packages; search pools a card name
   across sellers. Loss: the person must open a package before they can stamp (6 taps
   from empty to first stamp); the three words sit behind a step tap after the sheet
   closes. Pick: keep as the safe option.
2. **Mail tape (bold).** No tab bar and no list as home. Home is a tape: every act
   prints a line, newest at the bottom, and one field in thumb reach asks who the mail
   in your hand is from. Typing narrows to waiting packages; a tap opens a strip of
   cards to stamp. An envelope is one button beside the field. Open pose: tape and
   field on the left page, "Still out" list (or the picked package) on the right.
   Gain: matches the real moment (mail in hand, look at the label, type); the history
   proves nothing was wiped; 5 taps from empty to first stamp. Loss: no browsing home;
   a person who wants a list must open "cards still out"; long tapes need day headers.
   Departs from the house tokens rule "On a phone, navigation uses a bottom tab bar".
   Owner grant: yes. Pick: my recommendation for the first minute.

## Design choices

3. **Getting the file onto the phone.** The person's file is on their computer. Both
   options show "Choose from Files" (works with what iOS has: AirDrop or email, then
   Files) and a disclosure with the steps for Mac and for Windows. A second row, "Send
   it from your computer" (an address plus a code, then drop the file), is drawn as an
   owner choice: it needs a capability the tool may not have. Gain: removes the
   biggest "what does this want from me" moment. Loss: needs a server-side drop point
   and a pairing code. Owner grant: yes. Pick: draw both; ship Files first.
4. **Import is all or nothing, with Stop.** Reading shows progress and a Stop button.
   Nothing is added until the whole file is read; Stop adds nothing. Gain: Stop is
   safe in the first minute. Loss: a very large file shows no partial result. Pick:
   keep.
5. **Wrong file.** A file with no orders shows one plain sentence, "Nothing here
   changed", a "Choose another file" button, and the machine detail behind "What the
   file held". Pick: keep.
6. **Adding the file again merges.** A second import adds only new orders and says how
   many cards already here kept their stamps (`#s=merge`). The add sheet says so
   before the pick. Pick: keep.
7. **The three words, drawn.** Package (one order from one seller), card (one line of
   an order), envelope (mail you opened but cannot match to a seller; it never stamps
   a card by itself). Each has a small drawing. Checklist: in the import result sheet
   and behind step 2; on the open pose, on the right page before any data. Tape:
   printed on the import line. Gain: the person meets each word once, at the moment it
   first matters. Loss: the envelope meaning is my reading of the job.
   Owner grant: yes (confirm what "envelope" means).
8. **Received is a stamp, not a word.** Stamping a card draws a postmark with the date
   on the card's circle. Undo shows beside the stamp that was pressed; pressing the
   stamp again also takes it off. No status word repeats per row. Gain: label shown
   once; the answer is at the press. Loss: a new person must learn that the dashed
   circle is pressable (the first-stamp hint covers it). Pick: keep.
9. **Orders over 3 weeks old on first import.** A history file holds old orders that
   arrived long ago; left alone, they would all show as may be lost. After import, one
   question offers "Stamp them as in hand" or "Keep them waiting" (checklist: inside the
   import result sheet; tape: the next line). Until it is answered, no package is
   called lost and no "All is well." shows: that state is unknown. The bulk stamp can
   be taken off from its tape line or card by card. Gain: no false alarm wall on day
   one. Loss: a bulk act in the first minute; it is reversible, but it is a big
   change. The 3-week line is my guess. Owner grant: yes (the line, and whether to ask).
10. **May be lost.** A package with nothing in after 3 weeks goes to a "May be lost"
    section at the top, marked with an edge bar. The summary names only what is not
    normal, else "All is well." Pick: keep.
11. **Envelope logging.** The tape's button beside the field is named "Envelope", the
    word the person just learned. The person types the card names inside. The tool lists
    waiting packages that hold those cards; the person opens one and stamps the card.
    Logging never stamps anything. Pick: keep.
12. **Order holds still.** Lists sort oldest order first. A stamped package leaves the
    open list only when every card is in; the open package stays in the section it was
    opened in until closed, so a stamp never moves it from under the finger (checked:
    the stamp's top moves 1 px). A wrong file on a second import keeps the list and
    tabs, and shows the notice above them with "Keep what is here".
13. **Large phone size.** `layout.py devices` answered unknown for this repo, and the
    brief gives no size. The frame starts at 440 x 900 as a placeholder, not a device
    size, and it can be resized by dragging its corner. Owner grant: yes (give the size).
14. **AX5.** Rows stack: names take a full line, the stamp and Undo go under. Tab
    labels hide and icons grow; the tape's summary moves into the scroll. Text in px
    stands for iOS points; the built app uses Dynamic Type styles.
15. **Colour.** Cool paper surface, ink-blue accent for actions and the stamp, a rust
    tone for may be lost, a manila tone for envelopes, each with a dark set. No value
    from any repo; my own choice where `tokens.md` gives none.

## Self-critique (impeccable critique, single context: no sub-agent tool)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Status | 3 | Import progress and stamps are clear; "may be lost" was shown too early (fixed) |
| 2 | Real world | 3 | Postmark stamp and envelope match the mail; "package" may mean a box to some |
| 3 | Control | 3 | Undo at the press, stamps come off, Stop adds nothing |
| 4 | Consistency | 3 | Tape departs from the tab bar on purpose |
| 5 | Error prevention | 3 | Bulk stamp is one tap, though reversible |
| 6 | Recognition | 3 | Three words drawn; the dashed circle needs the first hint |
| 7 | Efficiency | 2 | Checklist needs a package open before a stamp |
| 8 | Minimalism | 3 | Checklist first screen after import is dense on the folded pose |
| 9 | Error recovery | 3 | Wrong file says what happened and leads on |
| 10 | Help | 2 | Help covers only the file transfer |
| | Total | 28/40 | |

Fixed: 106 "may be lost" showed before the old-orders question was
answered (now unknown until answered); checklist old-orders question moved into the
import sheet so the list opens clean; tape button "Unknown" renamed "Envelope";
"Take those stamps off" given a full tap target; repeated day words on the tape shown
once per day; three words no longer drawn twice on the open pose. Detector: 5 hits, all
false alarms (line height 1.29 is Apple's 17/22 body leading; "cramped padding" is the
device frame itself). Open: the checklist needs 6 taps to the first stamp; the tape has
no browse home for a person who wants a list.

## Tap counts (clicked in headless Chrome, folded frame)

- Guided checklist: Add order file, Choose from Files, pick file, Show my packages,
  open a package, stamp. 6 taps.
- Mail tape: Add order file, Choose from Files, pick file, tap the suggested package,
  stamp. 5 taps.
- Undo after the first stamp leaves no stamp in either option.

## Apple pages read 2026-11-21 (each answered 200)

layout, typography (Large default and AX5 tables: body 17/22 and 53/62, large title
34/41 and 60/70), accessibility (44 x 44 pt default control size), buttons, sheets
(Cancel leading, Done trailing), tab-bars (floats above content; for navigation, not
actions), toolbars, lists-and-tables. All under
https://developer.apple.com/design/human-interface-guidelines/. No page gives a status
bar height; the top inset uses `env(safe-area-inset-top)` plus a 24 pt token.
