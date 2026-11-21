# Weekly recap, blind 1: notes

Designer kind: blind. Designer: weekly-recap-blind-1. Mockup: `weekly-recap-blind-1.html`.
I saw no current screen, spec, token file or other mockup. Every part is new, so the mockup
labels parts "New:" only. Each figure, seller and date is a sample.

Job, from the brief: "Tell me how my week went in ten seconds." Facts: cards that came this week
and last, cards still out, overdue packages, money that came and money still out.

## Deep links

Open the file and add a hash. Keys combine with `&`.

- Concept: `#c=letter`, `#c=exceptions`, `#c=slot`
- State: `s=loaded`, `s=quiet`, `s=unknown`, `s=empty`, `s=loading`, `s=failed`
- Theme: `t=light`, `t=dark`; no `t` follows the system
- Device: `d=folded`, `d=open`, `d=phone`, `d=ax5`; no `d` shows all four
- Open a detail at load: `x=came`, `x=out`, `x=late`, `x=money`
- Hide concepts: `h=letter,slot`. Hide the "New:" labels: `n=0`. Phone size: `pw=420&ph=900`

Focus ids, for an owner pick: `letter-sentence`, `exceptions-verdict`, `slot-piles`.

## Choices

1. **Three concepts, each its own structure.** Letter: one sentence, figures open in place.
   Exceptions: only what is not normal, then four figures, a pushed detail, and a week switch.
   Mail slot: every card is a tile, in two piles split by a slot. Gain: the owner culls from
   three real routes. Loss: three to judge. Pick: show all three. Each has a Hide button.

2. **Letter: the week as one sentence.** "So far this week 47 cards came, 11 more than by now last
   week. 63 are still on the way, and 3 packages are late. ..." Each figure is a button.
   Gain: one read answers the job in under ten seconds, in the person's words. Loss: no figure
   stands out at a glance; a scan finds less than a grid gives. Pick: keep.

3. **Letter: the answer opens under the sentence.** On one screen, a panel opens right under the
   sentence (ux-answer-at-press). On the open Duo, the facing page shows it, with the late
   packages first. Gain: no navigation stack, nothing to go back from. Loss: on the folded pose a
   long detail scrolls below the fold. Pick: keep.

4. **Letter: sentence set in the system font.** I first set it in Apple's serif for content, to
   read like a note. The iOS mockup check asks for the system font first, so I took it out.
   Gain: passes the check, one type family. Loss: less voice. Pick: system font.
   Owner grant: yes, if the owner wants the serif for this content.

5. **Exceptions: a summary that names only what is not normal.** "Needs a look" lists late
   packages and packages with no due date, else "All is well." (ux-all-is-well). Gain: the ten
   second read is the first row. Loss: an arrivals drop is not yet a listed exception; I had no
   rule for "not normal" arrivals. Pick: keep, and ask where that line sits.

6. **Exceptions: a This week / Last week switch at the thumb.** A segmented control in a bottom
   toolbar (ux-thumb-zone, ux-control-beside-area). Gain: the comparison the brief asks for is one
   press. Loss: a bottom toolbar can clash with the app's tab bar, which I did not see. Pick: keep;
   see Input Needed.

7. **Mail slot: every card is a tile.** On the way: hollow tiles above the slot, late ones filled
   and notched, nearest the slot; no-due-date ones dashed. Came: filled tiles below. Gain: the
   size of the week shows before any number is read; a bold structure no list app uses. Loss: a
   week of hundreds of cards needs a denser tile (not drawn); tiles are not tap targets, the pile
   is. Pick: keep as the bold concept.

8. **Mail slot: the hinge is the slot on the open Duo.** On the way on the left page, came on the
   right; late tiles sit by the hinge. Nothing crosses the hinge (checked in the mockup). Gain:
   the device's shape carries meaning. Loss: none found. Pick: keep.

9. **Mail slot: tap a pile to list it.** The tapped pile grows to a list, the other shrinks to a
   56 pt strip; Done returns. Gain: one gesture, no stack. Loss: a pile tap is less obvious than
   a row with a chevron. Pick: keep, watch in a test.

10. **Compare with last week up to the same weekday.** The sample week is Monday to Saturday so
    far, so "11 more than by now last week" compares 47 with 36, not with the full week's 38.
    Gain: a fair figure mid-week. Loss: one more phrase to read. Pick: keep. The detail shows both.

11. **"On the way" counts packages with no due date.** They are still out, so they count; the
    recap never calls them late or on time (ux-unknown-is-not-empty). Pick: keep.

12. **States.** Loading keeps the loaded shape. Failed says the read failed, shows no figure, has
    Try again, and hides the raw text in "What the app said" (ux-machine-text-hidden). Empty is one
    sentence and one control. Quiet shows "All is well." / "nothing is late". Unknown shows the
    no-due-date packages as their own group.

13. **Empty state control "Add orders".** I do not know how orders enter the app. The control
    answers "Sample only" at the press. Gain: meets ux-unknown-is-not-empty. Loss: the claim may
    be untrue (ux-statements-are-true). Pick: keep until the owner names the real path.
    Owner grant: yes.

14. **Colour by role, own values.** Surface, raised, text, muted, ink (action), came, late, out.
    Late is shape plus colour (diamond, notch, wavy underline), so it never rests on colour alone.
    Light and dark sets; dark uses true black. Gain: meets tokens.md. Loss: these are not the
    repo's tokens, which a blind designer may not read. Pick: keep for the mockup.

15. **No tab bar drawn.** tokens.md says a phone uses a bottom tab bar, but I do not know the app's
    other sections. Pick: draw the recap as one screen. Owner grant: yes, on where the recap lives.

## Sizes and sources

- Duo folded 466 x 678 pt and open 951 x 669 pt, hinge x 455.5 to 495.5: from the brief.
  `layout.py devices` printed "unknown" for this repo.
- Large phone: the brief writes no size. The frame is 420 x 900 pt, a placeholder of mine, with
  width and height inputs on the page. Not a device spec.
- Status bar inset 28 pt and home bar inset 20 pt: my placeholders. No page I read gives a Duo
  inset.
- Apple pages read 2026-11-21, each answered 200 (JSON under `tutorials/data`):
  layout (safe areas, size classes; its device size table did not come through in the JSON:
  read unknown), typography (Dynamic Type sizes, Large (default) and AX5 tables), accessibility
  (44x44 pt default control, 200 percent text), buttons (44x44 pt hit region), tab-bars, toolbars,
  sheets, lists-and-tables.
- Text styles: Large Title 34/41, Title 1 28/34, Title 3 20/25, Headline and Body 17/22, Subhead
  15/20, Footnote 13/18, Caption 1 12/16; AX5 from the AX5 table (Body 53/62, Large Title 60/70).
