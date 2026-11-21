# Need-by dates: design notes

Mockup: `need-by-dates.html`, an idea mockup for the "Phase 2: Need-by dates" section of the deck-deadline plan in round 2 of the ideas. All names, dates and counts are invented. Each item gives what it is, the gain, the loss and the pick.

1. **Saved state gains `events` and `needs`.** Gain: dates and tags sync like check-ins. Loss: a change to `saved-state-shape`; old clients must ignore two new arrays. Pick: two optional arrays under the existing key, as the plan says. Needs an owner grant: yes.
2. **Tag by product name plus a count.** Gain: one tag covers "all four" in Tally, where that question already lives. Loss: two printings under one name share a tag. Pick: product name plus a count, with the "no matching card" line for drift.
3. **A Tally filter chip and strip, not a fourth view.** Gain: no new tab; the strip sits above the rows it counts. Loss: the event board exists only on the unfolded right half. Pick: chip and strip on Tally; the board is the unfolded pose's second screen, not a new tab. Needs an owner grant: yes (the board is a new screen region).
4. **At risk in slice 1 means the lost-mail warning, claim filed or refunded.** Gain: no new timing guess, so no false alarms. Loss: a slow but unflagged order reads as in transit until the warning fires. Pick: as the plan says.
5. **Refunded copies sit in the at-risk count, labelled "not coming".** The plan's edge state ("count as not coming") and its slice-1 rule disagree. Gain: the strip keeps four cells. Loss: "at risk" then mixes "may come" with "will not come". Pick: drawn this way; a fifth "not coming" cell is the alternative. Needs an owner grant: yes.
6. **Two events on one date warn on both strips.** Gain: catches the one real clash. Loss: different dates never warn. Pick: as the plan says.
7. **Past events collapse to one line and stay until removed.** Removal shows an undo toast, not a dialog (`no-native-dialogs`). Pick: as the plan says.
8. **Orphaned hint only.** The row says "maybe in Orphaned" and no count moves (`orphaned-mail-never-decides`). Later slice 2.
9. **Packages event chip in a reserved slot.** Every package row keeps an empty slot, so a check-in never moves text under the thumb (`no-layout-shift-under-pointer`). Later slice 2.
10. **Bulk tag "All 12 shown".** Gain: one deck tags in one press. Loss: it tags every shown row at its ordered count, which may over-tag. Pick: offer it in the "Need for…" sheet beside "This card".
11. **Date entry with day arrows, not a native picker.** Gain: the date stays a local calendar string, and the past-date error shows inline. Loss: far dates need many presses; a real build would use the system date picker in the sheet. Pick: arrows for the mockup only.

Frames: folded at the brief's 390 by 844. The device list writes no size for either Duo pose, so the unfolded halves are drawn at 390 by 844 each, illustrative. No desktop web width: the plan names no web target.

Apple HIG pages read 2026-11-21: Typography (Dynamic Type at the default size), Accessibility (44x44 pt default control size), Sheets (Cancel leading, Done trailing).
