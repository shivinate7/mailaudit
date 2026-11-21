# record-envelope-blind-1 notes

Designer kind: blind. I saw no current screen, spec, tokens or other mockup. Every figure in the
mockup is sample data. Since I cannot know what exists today, every marked part is "New:"; no
part is marked "Today:".

The job: record the envelope in hand (type card names, match each to an order line, save or throw
away), and never lose sight of which envelope it is. The one rule both concepts keep: nothing on
the record screen floats. The envelope's identity, the dock (field, Save, Throw away) and the keys
are all in normal flow, in that order from the top, so the keys can only squeeze the list of names
in the middle. They can never reach the identity. A headless check confirms this in every state, at
every size and theme: the identity is inside the frame, nothing is drawn over it, and its name is
not cut off.

## Deep links

Open `record-envelope-blind-1.html` with a hash. `c` is the concept (`pinned`, `spine`), `s` the
state, `t` the theme (`light`, `dark`; default follows the system), `d=undo` the undo strip,
`v=all` the save-every-name mode, `l=0` hides the New labels, `h=<option>,...` hides options.
States: `list` (first screen), `nomail`, `empty`, `typing`, `matched`, `choose`, `confirm`,
`gone`, `saved`, `failed`. Examples:

- `record-envelope-blind-1.html#c=pinned&s=typing&t=dark`
- `record-envelope-blind-1.html#c=spine&s=list`
- `record-envelope-blind-1.html#c=spine&s=confirm`
- `record-envelope-blind-1.html#c=pinned&s=gone&d=undo`

Focus ids for a waiting page (present in the folded Duo frame only): `#choice-pinned` (the band,
any record state of the pinned concept), `#choice-spine` (the spine, any record state of the spine
concept), `#choice-throw` (state `confirm` with the confirm style, state `gone` with `d=undo`),
`#choice-save` (state `matched`, with or without `v=all`).

## Choices

1. **Concept: Pinned header.** A navigation stack. First screen: today's mail as a list. Tap an
   envelope for its record screen. A manila band at the top holds the sender, its orders and the
   ready count with one tick per name. Names in the middle. A dock at the bottom holds the field,
   Throw away and Save, and rides on top of the keys. Open Duo: the list on the left page, the
   record on the right page, keys on the right page only.
   Gain: familiar, nothing to learn; the identity reads like a title. Loss: the band costs height
   on every screen; at the largest text the name may wrap to two lines and the list of names gets
   short. Pick: keep as the safe concept. Hide control: Concept, "Hide" beside Pinned header.

2. **Concept: Spine (the bold one).** The envelope's identity is a vertical spine on the leading
   edge, like the spine of an envelope in a file drawer. First screen: the drawer, one manila spine
   per envelope, side by side; a spine with a draft shows its ready count. Tap a spine to open it.
   The spine holds Back and Throw away at the top (out of thumb reach on purpose), the sender
   running up the middle, and the ready count and Save at the bottom (in thumb reach). Typing
   narrows the order lines above the field, so typing and matching are one step. Open Duo: the
   open envelope on the left page, every order line on the right page, keys on the left page only,
   so the keys never hide the lines.
   Gain: the identity runs along the long side, so neither the keys nor large text eat it; at the
   largest text it wraps into two columns and stays whole. The keys shorten the spine, not remove
   it. Loss: vertical text is slower to read; the spine takes 72 pt of width (144 pt at AX5), so
   names in the list wrap sooner; no common app works this way, so it needs a first look to learn.
   Pick: this one. Hide control: Concept, "Hide" beside Spine.

3. **Throw away: Confirm in place.** Throw away turns the dock into "Throw away this draft? Its N
   names go for good." with Keep draft and Throw away, at the spot that was pressed. The keys drop
   first, so the confirm and the keys never stack. On confirm the draft is deleted from the model:
   its mark leaves the list or drawer, and reopening the envelope shows an empty draft.
   Gain: one deliberate step, no alert over the screen, and gone means gone. Loss: one extra tap.
   Pick: this one. Owner grant: yes. Hide control: Throw away, "Hide" beside Confirm in place.

4. **Throw away: Undo strip.** Throw away deletes at once and shows "Draft thrown away." with Undo
   for six seconds (an unmeasured stand-in), then "Nothing was kept."
   Gain: one tap, and Apple's alerts page prefers undo over an alert. Loss: for six seconds the
   draft is still held, which works against "a thrown-away draft must really be gone". Pick: not
   this one. Owner grant: yes. Hide control: Throw away, "Hide" beside Undo strip.

5. **Save: Save ready names.** Save records the names that have a line; a name with no line stays
   in the draft, and the message says how many stay. Save is off, with its reason on hover, while
   no name has a line. Gain: nothing is saved without a line. Loss: the draft lives on after Save
   when a name has no line. Pick: this one. Owner grant: yes. Hide control: Save, "Hide" beside
   Save ready names.

6. **Save: Save every name.** Save records every name, matched or not, and ends the draft.
   Gain: one press ends the envelope. Loss: a name with no line is saved with no cost. Pick: not
   this one. Owner grant: yes. Hide control: Save, "Hide" beside Save every name.

7. **An exact name matches by itself.** When a typed name equals a line's card name and that line
   has a copy left, the name gets that line on Add. Gain: most names need no second tap. Loss: a
   wrong line is possible when two orders hold the same card; the row shows the line it took, and
   a tap changes it. Pick: keep. Owner grant: yes.

8. **A line with every copy named cannot take another name.** It shows dimmed with "every copy
   named" and says why on hover. Gain: the count of a line never goes over. Loss: a seller who
   sent an extra copy cannot be recorded against that line. Pick: keep.

9. **A draft survives leaving.** Back, another envelope or another screen keeps the names and the
   half-typed text for that envelope. Only Save and Throw away end a draft. Pick: keep.

10. **Largest text (AX5).** Pinned: the orders line and the ticks hide, the name may wrap to two
    lines, Throw away becomes a trash icon with a label for VoiceOver, and while the keys are up
    Save and Throw away hide (the keys' add key still adds; hide the keys to save). Spine: the
    sender wraps into two columns; while the keys are up, Back, Throw away and Save hide. Gain:
    the identity stays whole at AX5. Loss: at AX5 with the keys up, the list of names shows about
    one row. Pick: keep.

11. **Empty, failed and unknown states.** No names: one sentence and "Type a name". No mail:
    one sentence and "Check again". Order lines failed: "Order lines did not load. Names you type
    stay in the draft." and "Try again"; names can still be typed. Pick: keep.

## Sizes, stand-ins and sources

- Duo folded 466 x 678 pt and open 951 x 669 pt with the hinge at x 455.5 to 495.5: from the brief.
  `layout.py devices` printed `unknown` for this repo. A headless check confirms no drawn element
  crosses the hinge in any state.
- Large phone: no size is written in the brief or the device list, so its frame has no real size
  and can be resized by hand. Input needed: the phone's size.
- Stand-ins with no Apple source: the status bar (32 pt), the home indicator area (20 pt), the
  keys' height (four rows of 44 pt keys), the spine widths (72 pt, 144 pt at AX5), the undo time
  (6 s). The keys are drawn, not real.
- Type sizes: Dynamic Type Large (default) and AX5 tables, from Apple's typography page.
- Apple pages read 2026-11-21, each through its `tutorials/data` JSON (all answered 200):
  - design/human-interface-guidelines/layout: safe areas; lay out by size class.
  - design/human-interface-guidelines/typography: Dynamic Type sizes, Large and AX5.
  - design/human-interface-guidelines/accessibility: 44 x 44 pt default control size.
  - design/human-interface-guidelines/buttons: 44 x 44 pt hit region.
  - design/human-interface-guidelines/alerts: prefer undo to an alert for an undoable delete;
    Cancel on the leading side.
  - design/human-interface-guidelines/virtual-keyboards: keep important parts of the interface
    visible while the keyboard is up (the keyboard layout guide).
  - design/human-interface-guidelines/sheets, tab-bars, toolbars, lists-and-tables: read; no
    sheet or tab bar is drawn, because both concepts navigate by a stack (pinned) or the drawer
    (spine), and a sheet would cover the identity.
- Departs from: the house rule "on a phone, navigation uses a bottom tab bar" (tokens.md). This
  screen has one section, so a tab bar would hold one tab. Not blocking.
