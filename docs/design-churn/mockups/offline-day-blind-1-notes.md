# Offline mail day: blind designer 1 notes

Designer kind: blind. Mockup: `offline-day-blind-1.html`. Every figure on it is sample data.

The job: mark mail as received with no signal, for hours. Another phone may change the same data.
A mark made offline is kept. Nothing is lost or doubled when signal returns, and the screen never
claims more than it knows.

The brief gives no data shape. I used the least the job implies: sender, what is inside,
due date, and received or not, with a time. There is no cost and no product view name.

Deep links: `#c=pocket|tape`, `&s=offline|sending|conflict|failed|live|unknown|empty`, and
`&t=dark|light`. With no `t`, the page follows the system theme.

Frames, in this order: Duo folded 466 x 678, Duo open 951 x 669 (hinge x 455.5 to 495.5, nothing
crosses it), the large phone, and Duo folded at text size AX5. `layout.py devices` gives no size for
this repo. The Duo sizes come from the brief. The brief gives no large-phone size, so 430 x 932 is a
stand-in that I picked.

No "Today:" labels: a blind designer cannot see today's screen. Every dashed label reads "New:".

## Concepts

### 1. Pocket list

A list of expected mail with a mark button on each row, plus one status strip under the title.
Tabs: Mail and Sync. In the open pose, Mail is on the left page and Sync on the right page,
with no tab bar. Focus id: `choice-pocket`, the status strip.

- Gain: it is the familiar shape, so there is nothing to learn at the mailbox. The thumb reaches the
  mark at the trailing edge of each row. Rows never move when marked.
- Loss: the history of what happened sits behind a tab, so "did my offline marks land?" takes a
  second look on the folded pose.
- Pick: either is fit. I lean to Receipt tape, because it makes the "not lie" promise visible
  without a tab.

### 2. Receipt tape (the bold one)

One surface with no tabs. The top is a tape of every act, newest last, near the thumb. A dashed
tear line splits it: lines above were sent, lines below are kept on this phone only. The bottom is a
"Still expected" tray with a search field. Tapping a piece tears it off the tray and onto the tape.
The other phone's acts come in as lines set in from the left. A conflict is a line with its two
choices inline. The open pose puts the tape on the left page and the tray on the right page. Focus
id: `choice-tape`, the tear line.

- Gain: the tear line answers "what is still only on my phone" with a place, not a word. The log is
  append-only, so a take-back adds a line and never erases one. That is honest by construction.
- Loss: the shape is new, and some people will not read a log. Only part of the tray shows on the
  folded pose, so a long list scrolls inside it.
- Pick: Receipt tape.

## Choices

1. **A held mark shows by shape, not by word.** A dashed ring with a tick means kept on this phone.
   A solid disc means sent. Two discs mean both phones agree. A phone outline means the other phone
   did it. A diamond means it needs a choice. The words "kept on this phone" show once, in the strip or
   on the tear line (`ux-label-once`). Gain: the eye sorts the rows fast, with no repeated status
   words. Loss: the shapes must be learned once; each carries an accessible name. Pick: shapes.
2. **Merge rule when the phones disagree.** Options: (a) ask each time, (b) latest change wins,
   (c) received always wins. Gain of (a): no offline mark is ever dropped without a press. Loss of
   (a): one more tap after a long dead spot. (b) can silently drop a mark made offline. (c) can
   keep a piece marked that the other phone rightly undid. Pick: (a), ask. The mockup draws (a)
   only. `Owner grant: yes`, because it sets the data rule.
3. **Both phones mark the same piece: merge with no question.** One record shows, with the
   two-disc shape and "counted once". Gain: no doubling and no needless question. Loss: none seen.
   Pick: merge.
4. **The last time the other phone was heard shows while offline.** "Your other phone: last heard
   11:02 AM." Gain: the screen says what it cannot know (`ux-unknown-is-not-empty`). Loss: one more
   line in the strip. Pick: show it.
5. **"No copy yet" is its own state.** A phone that has never loaded the list says so, with Try
   again. It never shows as empty. Pick: keep it apart from "Nothing expected".
6. **A failed send says the marks are still kept and offers Try again.** The server text sits in
   a closed "What the server said" disclosure. Pick: as drawn.
7. **Sending shows Stop** (`ux-long-run-stops`). A stop keeps every unsent mark and offers Send now.
   Pick: as drawn.
8. **All sent and nothing open reads "All is well."** with no other item (`ux-all-is-well`).
9. **Reopen keeps every mark.** The sim's "Close and reopen app" proves it: the held marks stay.
   This assumes the builder stores each mark on the device before it shows it. `Owner grant: yes`:
   the mockup cannot prove storage, and the spec must say it.
10. **Receipt tape has no bottom tab bar.** Departs from: house tokens "on a phone, navigation uses
    a bottom tab bar". Gain: a single surface with nothing to switch, and the tear line is always in
    view. Loss: it breaks the house default, and a later second screen has no obvious home.
    `Owner grant: yes`. Not blocking.
11. **Undo.** Pocket list: press the mark again to take it back. Receipt tape: tap the line, then
    Take back. An unsent mark that is taken back leaves the phone with nothing to send. A sent one
    sends a take-back. Pick: as drawn.
12. **AX5.** Rows restack into one column, and the mark sits under the text. Tab labels hide and
    icons stay. On the tape, the time moves under the line. Gain: no clipping. Loss: about two rows
    per screen on the folded pose. Pick: as drawn.

Each concept has a hide control (the cross beside its name), so one press removes one option.

## Apple pages read (2026-11-21, each answered 200)

- https://developer.apple.com/design/human-interface-guidelines/typography: the Large (default) and
  AX5 Dynamic Type rows. Body is 17/22 at the default size and 53/62 at AX5.
- https://developer.apple.com/design/human-interface-guidelines/accessibility: the default control
  size is 44x44 pt and the minimum is 28x28. Text can grow to at least 200 percent.
- https://developer.apple.com/design/human-interface-guidelines/buttons: the hit region is at least
  44x44 pt.
- https://developer.apple.com/design/human-interface-guidelines/layout: respect safe areas.
- https://developer.apple.com/design/human-interface-guidelines/tab-bars: a tab bar floats at the
  bottom and is for navigation.
- https://developer.apple.com/design/human-interface-guidelines/sheets: Cancel or Close dismisses the
  sheet.
- https://developer.apple.com/design/human-interface-guidelines/toolbars: the large title.
- https://developer.apple.com/design/human-interface-guidelines/lists-and-tables.

The status-bar and home-indicator heights are drawn by eye. No page I read gives them.
