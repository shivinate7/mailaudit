# Envelope photos: blind designer 1, notes

Designer kind: blind. Mockup: `envelope-photos-blind-1.html`. It opens from disk. All data on it is a sample.

Deep links use the hash: `c` is the concept (`shelf`, `sheet`, `finder`), `s` is the state (`list`, `detail`,
`viewer`, `zoom`, `confirm`, `match`, `empty`, `failed`), `d` is the device (`all`, `folded`, `open`, `phone`,
`ax`), `t` is the theme (`light`, `dark`; none means the system theme), `ann=0` hides the "New:" labels, and `h`
lists hidden concepts. Example: `#c=finder&s=zoom&d=folded&t=dark`.

Each concept has a Hide button at the top of the page. One press removes that concept.

## Sources

- Brief sizes: Duo folded 466 x 678 pt, Duo open 951 x 669 pt with the hinge from x 455.5 to 495.5.
  `layout.py devices` printed `unknown` for this repo, so these come from the brief.
- Large phone: no size is written in the brief, the device list or the Apple layout page I read. The frame is
  fluid and its corner drags. I invented no size.
- Apple pages, read 2026-11-21 as JSON (each answered 200): layout, typography, accessibility, buttons, sheets,
  lists-and-tables, tab-bars, toolbars, all under `developer.apple.com/design/human-interface-guidelines/`.
  - Typography: default Dynamic Type sizes (Large Title 34/41, Title 3 20/25, Headline 17/22, Body 17/22,
    Subhead 15/20, Footnote 13/18) and AX5 sizes (Large Title 60/70, Title 3 55/65, Body 53/62,
    Subhead 49/58, Footnote 44/52) in pt.
  - Sheets: Cancel on the leading edge, Done on the trailing edge; a resizable sheet has a grabber, and a tap
    on it cycles the detents.
  - Buttons and accessibility: 44 x 44 pt hit regions.
  - Tab bars: the bar floats above the content and is for navigation, not acts.
- House rules: `principles.md`, `layout.md`, `tokens.md`. Colour, status-bar height (24), home-indicator
  height (20) and tab-bar size are my own values: neither tokens.md nor an Apple page I read gives them.
- The repo has no setup command (no `setup` script in package.json). The mockup needs none.

## Items

1. **Three concepts.** Shelf (list, then a page per envelope), Contact sheet (a wall of photos, then a full-width
   photo with a pull-up sheet), Viewfinder (opens on the camera; envelopes on a strip under the lens).
   Gain: three roots, each with its own first screen and way to move. Loss: the owner must cull two.
   Pick: Viewfinder for speed at the mailbox; Shelf if the screen is mostly read later.
2. **"Has a photo" at a glance, by shape.** A photo thumbnail, or a dashed box with a camera-plus glyph. A count
   pip shows when there are two or more photos. Gain: no word repeats on every row (ux-label-once). Loss: a
   reader must learn the dashed box once. Pick: yes.
3. **A failed photo load looks unlike "no photo".** A filled box with a warning glyph, plus one bar with Retry.
   Notes and cards still show. Gain: a load failure never reads as "no photos" (ux-unknown-is-not-empty).
   Loss: none seen. Pick: yes.
4. **Envelope name is its arrival day.** Two on one day get "(1)" and "(2)" in the order they were made. Gain: no
   typing to name an envelope. Loss: the number means nothing to the person. Pick: yes, the note carries meaning.
   Owner grant: yes (the arrival day is the day the envelope is made in the app; no field edits it).
5. **At most 4 photos per envelope.** The brief says "up to a few". At 4, Add photo and the shutter stay
   focusable, say why on hover and focus, and show the reason at the press. Gain: a short, scannable strip.
   Loss: a fifth angle needs a delete. Pick: 4. Owner grant: yes (a new limit).
6. **Delete a photo asks first, at the trash button.** An in-app pop-over with Keep and Delete, no native
   dialog. The last photo deleted closes the viewer. Gain: no lost photo by a slip; the answer shows at the press.
   Loss: one more tap. Pick: yes.
7. **Zoom.** Double-tap zooms to 2.5x at the tap point; pinch, wheel and drag work; a fixed-size readout shows
   the zoom. Gain: the native photo-viewer feel. Loss: none. Pick: yes.
8. **Match.** Each concept has one Match control. It opens a sheet, "Match to an order", that lists orders with
   cards still on the way; Cancel leading, Match trailing, off until an order is picked. A matched envelope
   leaves the list, the next takes its slot, and a toast offers Undo. Gain: matching stays later and
   reversible. Loss: the order list here is a sample; I do not know which orders the app can offer.
   Pick: yes. Owner grant: yes (the rule for which orders the sheet lists).
9. **Note and cards save as typed** in Shelf, Contact sheet and the open Viewfinder. The folded Viewfinder edits
   them in a Details sheet with Cancel and Done (Apple sheets page). Cancel puts back the note and cards only; a
   photo taken or deleted there stays. Gain: input is never lost (ux-keep-what-was-made). Loss: two save models
   inside one concept. Pick: yes.
10. **Open pose uses both pages.** Shelf and Contact sheet put the list or wall on the left page and the envelope
    on the right. Viewfinder puts the camera on the left and the envelope ledger, with its strip, on the right.
    The viewer and sheets open on the right page only. Nothing sits across the hinge (checked in the browser).
    Gain: shoot or scan on one page, read on the other. Loss: none. Pick: yes.
11. **Tab bar with Orders and Envelopes.** House rule: phone navigation uses a bottom tab bar. I do not know the
    app's other sections, so Orders is a stand-in and its press says it is outside the mockup. Gain: shows where
    the screen lives. Loss: a guessed tab. Pick: keep as a stand-in. Owner grant: yes (where this screen sits in
    the app's navigation).
12. **Viewfinder is the bold concept.** No checklist app of this kind opens on a camera. Each shot drops into the
    lit envelope; "New" on the strip starts the next one. Gain: one tap per photo at the mailbox. Loss: the
    camera starts on every visit, even to read a note; a real build needs camera permission and a denied state,
    which this mockup does not draw. Pick: show it; the owner decides. Owner grant: yes (camera as first screen).
13. **AX5.** Shelf rows stack with a full-width photo; the Contact sheet becomes one column; the Viewfinder chip
    drops "Shooting into" and the strip drops its dates; tab labels hide. Gain: nothing is cut off at AX5.
    Loss: few envelopes fit on one screen. Pick: yes.
14. **Shelf puts Add photo high on the envelope page.** Gain: photos first, the familiar layout. Loss: on the
    folded pose held in one hand, the tile and Match sit outside easy thumb reach (ux-thumb-zone). Viewfinder
    and Contact sheet keep the main act low. Pick: leave Shelf as the familiar baseline.
15. **No "Today:" labels.** As a blind designer I saw no current screen, so every dashed label reads "New:".
16. **Not drawn:** deleting a whole envelope, editing the arrival day, a camera-permission state, a loading
    state. Each is a question for the owner if the concept goes on.

## Critique (impeccable, design review only: native platform, no detector)

Health score 28/40: status 3, real world 3, control and freedom 3, consistency 3, error prevention 3,
recognition 3, efficiency 2, minimalism 3, error recovery 3, help 2.

Fixed: two envelopes on one day shared a name (item 4); the Viewfinder chip covered the lens at AX5 (item 13);
Cancel in Details threw away photos (item 9). Not fixed: Shelf's thumb reach (item 14), by choice.

Questions for the owner:
- Should the app open on the camera when an unmatched envelope is likely in hand, and on a list otherwise?
- Is one photo usually enough? If so, the cap and the photo strip can shrink.
- Which orders should the Match sheet list: all open orders, or only ones whose card count fits the envelope?
