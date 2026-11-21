# orphaned-mail-blind-1: notes

Designer kind: blind. Mockup: `orphaned-mail-blind-1.html`. Every figure on it is sample data.

I saw no current screen, code, spec or token file, on purpose. So the mockup marks no part
"Today:". Each concept carries one dashed "New: whole screen" tag.

Deep links: `#c=<concept>&s=<state>&t=<light|dark>`. Concepts: `shelf`, `sieve`. Each concept
section lists its states as links. Focus ids for the waiting page: `concept-shelf`,
`concept-sieve`.

## Choices

1. **Shelf: a list of kept envelopes, then one envelope's page.**
   What: the first screen lists each kept envelope with its day, its card names and a count of open
   orders that share every clue. Open one to see its photo, its clues and a ranked list of who could
   have sent it. The open Duo shows the list on the left page and the envelope on the right page.
   Gain: a pattern people already know. A wrong clue only lowers a rank, so it hides no sender.
   Loss: the ranking is soft. The person must read the reasons to judge how sure the top row is.
   Pick: keep as one of the two options. Hide control: "Hide this concept".

2. **Sieve: a board of every open order. Clues turn orders over (the bold concept).**
   What: all open orders sit as tiles in a fixed order, by order day. Each clue turns over the tiles
   it rules out. A turned tile keeps its place, so nothing moves under the thumb. Tap a turned tile
   to read why it is out. Tap a face-up tile to pick it yourself. When one is left, the bottom bar
   offers "It is from <sender>". Kept envelopes sit in a strip along the top. The open Duo puts the
   envelope and its clues on the left page and the board on the right page.
   Gain: the person sees the whole field shrink, and that shows how sure the answer is. It also
   makes a clue that is wrong easy to spot: "No open order fits every clue" offers "Remove the last
   clue".
   Loss: a strict sieve. A clue that is wrong turns over the right sender. With many open orders,
   the board gets long; the count line carries the answer then.
   Pick: keep as one of the two options. Hide control: "Hide this concept".

3. **Each clue choice shows what it would leave (Sieve clue sheet).**
   What: in "Add a clue", each card name and each day shows "leaves N" before it is added. A choice
   that leaves 0 shows in the warning colour.
   Gain: the person picks the clue that narrows most, and sees a dead end before taking it.
   Loss: one more number per row to read.
   Pick: keep.

4. **A match never marks cards received unless the person presses for it.** Owner grant: yes.
   What: the match sheet lists the order's cards, ticks the ones the person wrote down from the
   envelope, and says the cards stay as they are. An option adds a switch, "Also mark the ticked
   cards received", off by default.
   Gain: an unsure match cannot change the order's check-in on its own.
   Loss: one more step when the person is sure.
   Pick: the switch, off by default. Hide control: "Hide option: mark cards received at match" in
   the page header. I could not read how the product treats a match, so this needs the owner's word.

5. **A city on the label is kept, but it rules nothing out.**
   What: the brief says an order holds a day, a sender and cards, and no city. So the city is saved
   with the envelope, drawn with a dashed edge, and one sentence says it does not change who could
   have sent it.
   Gain: the screen claims no match it cannot make (house rule ux-statements-are-true).
   Loss: a clue the person holds does no work yet.
   Pick: keep. If orders do carry a city or a seller location, the city should rank and sieve like
   a name. Owner grant: yes, if that data exists.

6. **The day it came limits the field.**
   What: an order placed after the envelope came is left out (Shelf) or turned over (Sieve).
   Gain: a fact the person always has removes impossible senders at once.
   Loss: a wrong day hides the right sender. The day stays changeable in both concepts.
   Pick: keep.

7. **The name on the label matches any part of the sender name.**
   What: "pine" fits "Pinegate TCG" and "Pine Hollow Games". The part that fits is highlighted.
   Gain: a torn or smudged label still helps.
   Loss: a short fragment fits many senders.
   Pick: keep.

8. **Undo sits where the envelope was.**
   What: after a match, the envelope's row (Shelf) or the bottom bar (Sieve) shows
   "Matched to <sender>" with Undo. In Sieve, the envelope leaves the strip only when the person
   moves to another envelope.
   Gain: the answer shows where the person looks; one press reverses it.
   Loss: the press itself was in the sheet, so the answer is near, not at, the press
   (ux-answer-at-press).
   Pick: keep.

9. **A new envelope keeps its draft.**
   What: in Shelf, Cancel closes the "New envelope" sheet and keeps what was typed for next time
   (ux-keep-what-was-made). Save keeps the envelope even with no clue at all.
   Gain: the person never loses the envelope or the clues typed so far. "A safe place" is the job.
   Loss: a draft the person wanted gone comes back once.
   Pick: keep.

10. **States drawn.** Shelf: kept envelopes, envelope with fits, fits and the rest, match sheet,
    just matched, new envelope, no clues yet, nothing fits, orders did not load, nothing kept.
    Sieve: new envelope with no clues, one card added, clue sheet, why one is out, one left, match
    sheet, just matched, nothing fits, orders did not load, nothing kept. "Orders did not load"
    shows as unknown, never as empty (ux-unknown-is-not-empty), and says the envelopes are safe.

## Sizes and platform

- Duo folded 466 x 678 and Duo open 951 x 669 with the hinge from x 455.5 to x 495.5: from the
  brief. Nothing crosses the hinge. Sheets open on one page only.
- Large phone: no size is written in the brief or in `layout.py devices` ("unknown" for this
  repo), and Apple's layout page no longer lists device sizes. The frame is drawn at the folded
  Duo size and can be resized by its corner. It uses the same compact layout as the folded Duo.
- Largest text: the folded Duo is drawn a second time at AX5. There the screen scrolls as one,
  the board is one column, rows and the sheet bar wrap.
- The status band (44) and home indicator band (20) heights are placeholders. No page I read
  gives them.
- Type sizes are the Dynamic Type sizes at Large (default) and at AX5. Controls are at least
  44 x 44. Sheets put Cancel leading and Done or Save trailing.

Apple pages read 2026-11-21, each as JSON under `developer.apple.com/tutorials/data/`, each 200:
layout, typography (Dynamic Type tables: Large default and AX5), accessibility (44x44 pt),
buttons, sheets (Cancel leading, Done trailing), lists-and-tables, tab-bars (floats at the
bottom), toolbars (large title).

## Critique pass

Method: design review only (native platform drawn as HTML; the detector reads web markup only).
Fixed: count legend moved below the list; no-clue envelopes show no "0" badge; name highlight
changed from underline to a mark, so it does not read as a link; the Sieve legend now says a
face-up tile can be picked; a matched Sieve envelope keeps its Undo until the person moves on;
AX5 count badge no longer clips; AX5 list scrolls under a fixed bottom bar; a just-matched
Sieve envelope draws no dead remove buttons or tiles; with orders not loaded, the clue and card
suggestions show no counts; the AX5 segment buttons reach 44 high and no longer overlap.
Open: at AX5 the Sieve board is a long single column, and the Shelf bottom bar takes about a
third of the folded screen.
