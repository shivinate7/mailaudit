# Waiting calmly

These ideas were written blind. I did not read the code, the records or the screens, so each premise below is unchecked.
- P1, from the brief: each order row gives a seller, an order date and a price. Status: unknown. Whether the file also has a ship date is unknown.
- P2, my inference: each check-in is saved with a timestamp. Status: unknown. Directions 1 to 3 need this.
- P3, my inference: the "may be lost" flag uses one fixed age threshold. Status: unknown. If it already learns from history, Direction 3 shrinks.

## Not yet due, so not shown
The idea: an envelope the collector has no reason to expect yet should not count as outstanding. Each package gets an expected window: its order date plus that seller's past delivery time, falling back to the collector's overall typical delivery time. Before that window opens, the package sits folded away under a line like "31 in the air, none expected yet." The list holds only packages that are due today or later. This is how the tool deliberately says less.
- Who and why now: a collector with 40 envelopes in flight. Today a list of 40 open items looks like 40 problems, which drives refreshing.
- Shape: the fold row is collapsed by default, and one tap opens it. Each package shows "expected Tue to Fri." Data needed: order dates, plus arrival dates per seller from past check-ins.
- Risks: a folded item is forgotten if its window is wrong. A new seller has no history. Opening the fold must not move content under the finger.
- Owner decides: whether the fold also hides the dollar total in the air, and how many past orders a seller needs before its own window replaces the overall default.

## Mailbox check-ins, empty days included
The idea: one tap records "checked the mail" at that moment, even when nothing came. Days with no mail become data. Sundays, holidays and a quiet carrier route stop counting against sellers, so lateness is measured in mail days rather than calendar days. Each check-in also ends with a close: "Done for today. 4 likely tomorrow."
- Who and why now: someone who checks the mailbox twice a day. The open loop ("did I miss something?") gets a recorded ending.
- Shape: a "Mail came / Nothing today" control, then the usual marking. Data needed: the check-in timestamps (a new small record) and a list of mail days learned from them.
- Risks: one more tap is friction, and a missed tap looks like an empty day. A check-in must never decide anything about orphaned mail.
- Owner decides: whether to log empty days at all, and whether a missed day counts as unknown or as no mail.

## Late is not lost: worry from the collector's own history
The idea: replace the yes/no "may be lost" flag with the collector's own record. For example: "Of 212 envelopes, 96% came by mail day 9 and 3% by day 20. Of the 11 you flagged, 9 still arrived, a median of 6 days late." A package past its window shows where it sits on that curve.
- Who and why now: the moment of "was I scammed?" Most late mail is only late, and the collector's own data can say so.
- Shape: one line per late package ("day 13, 1 in 30 of your envelopes took this long") and a small history row. Data needed: arrival delay per package, plus flags that later resolved.
- Risks: small samples mislead, and a low-cost card from a new seller has no history. Sharing seller-level numbers with anyone else would need care.
- Owner decides: whether a seller's own record overrides the overall one, and whether "still arrived after a flag" is kept as a permanent record.

## One deadline per worry
The idea: every overdue package gets one date and one action, such as "Report missing by Dec 3 (Pinecone Cards, order MW-48213, $4.70)." Before that date the tool says "nothing to do yet." After it, the package becomes a single task that can be checked off. Worry turns into an appointment.
- Who and why now: a collector who loses the chance to report a missing item by noticing too late, or who reports one too early.
- Shape: a "Needs you" list that is usually empty, one date per package, and a "reported" mark that keeps the package open until it arrives or the case closes. Data needed: the order date and a claim window the owner enters.
- Risks: the marketplace's claim rules are outside the tool and can change. A wrong date is worse than none.
- Owner decides: the window length (entered once by hand, never assumed), and whether a package that was reported and then arrives counts against the seller.

## One calm sentence first, numbers on request
The idea: the app opens to one sentence that reflects the data: "All on time. 38 in the air, $61.20. Nothing needs you." Detail sits one tap below. On the phone, a notification fires only when a deadline is near, never for "something arrived" and never as a daily count.
- Who and why now: on a normal day, opening the app should take two seconds and end the urge to check.
- Shape: the sentence is built from the other directions (due, late, needs you), and the money at risk is shown apart from the money merely in transit. Data needed: nothing new.
- Risks: the sentence can feel false if one late package is buried in "all on time." Its wording must be testable against fixed states.
- Owner decides: whether money appears in the sentence at all, and whether any notification is wanted.

Strongest: Mailbox check-ins, empty days included. It is the one idea that adds new data (mail days), it makes every other lateness clock honest, and it gives each trip to the mailbox a defined end.

## Phase 2: Mailbox check-ins (fleshed out)

A trip to the mailbox becomes a recorded event. If nothing came, that day still counts. Lateness counts mail days, not calendar days. Every trip ends with one closing sentence.

These parts belong to other planners and are only referenced here: the doorstep pass, the mail forecast, calibrated lateness, the claim clock and trip mode.

Unknown: I did not read the code. So I do not know how the lost-mail warning counts days, what the recent-checks log stores, or whether sync merges per record. Any step that leans on these says so.

### Flow, step by step
1. The owner opens the app on Packages. A fixed-height bar sits above the list. It reads "Checked the mail?" with two buttons: **Mail came** and **Nothing today**.
2. **Mail came** opens a trip. The bar becomes "Mail check · 14:10 · 0 marked" with a **Done** button. The owner marks cards in Packages as today. If the doorstep pass has shipped, its taps go into the open trip.
3. **Done** closes the trip. The bar is replaced in place, at the same height, by the closing sentence. The trip appears as one line in the recent-checks log, and undo works from there.
4. **Nothing today** records an empty check and shows the closing sentence at once. No list changes.
5. Marks made with no trip open still count. Marks less than 30 minutes apart are grouped into one implied trip, read from the existing check-in timestamps. The bar then shows its closing sentence after 30 minutes with no marks, or the next time the app opens.
6. A trip left open closes itself after 2 hours with no marks. Its sentence shows the next time the app opens.
7. The next day the bar resets. A second check on the same day is allowed: a later "Mail came" turns an empty morning into a mail day.

### Closing sentence (from "One calm sentence first")
Each sentence is built from fixed states, so tests can pin every wording. It never mentions money. Examples:
- Normal: "Done for today. 3 marked, 29 in the air. Nothing needs you."
- Late: "Done for today. 1 late: Pinecone Cards, mail day 14. Nothing to do until Dec 3." The date comes from the claim clock if it has shipped. Otherwise the sentence stops after "mail day 14".
- Empty: "No mail today. Clocks did not move."
- Too early: "Nothing yet. Mail usually comes by 15:40." This check is not recorded as an empty day (see the rule below).
- Sunday or a holiday: "No delivery today. Clocks paused."
- Nothing in the air: "All in. Nothing in the air."
- Forecast shipped: the sentence can add "4 likely tomorrow". Without the forecast it says nothing about tomorrow.

### Mail-day counting
- **Mail day:** a day with a "Mail came" check or any marked card.
- **Empty day:** a day whose last check was "Nothing today" and came after the cutoff. The cutoff is the 90th percentile of past "Mail came" times, for example 15:40. A fixed default of 16:00 applies until 20 trips exist.
- **Unknown day:** a day with no check. Monday to Saturday count as mail days, so lateness is never hidden. Sundays and holidays the owner enters do not count.
- **Trip mode:** a span marked "away" by trip mode counts as unknown. It is never empty.
- **Orphaned mail:** it decides nothing. An orphan never turns a day into a mail day by itself. Only the owner's "Mail came" tap does.
- **Display:** each late order shows both counts: "mail day 9 (12 calendar)".

### Screen states
- **Empty:** no orders imported, so the bar is absent and the existing empty state stands. Orders exist but nothing is in the air, so the bar still shows and its sentence reads "All in."
- **Normal:** three bar states (idle, trip open, closed with its sentence), all the same height. Tally and Orphaned show nothing new, so they say less.
- **Edge cases:**
  - After midnight: a check at 00:30 belongs to the previous day. The day boundary is 04:00.
  - Two devices on one day: their checks are united. The latest kind wins.
  - Clock skew: covered by the accepted risk `merge-later-change-wins`.
  - Undo: an undone empty check reverts the day to unknown.
  - Import: a CSV import never touches trips.
- **Errors:**
  - Sync fails: the trip is saved on the device, the sentence still shows, and the existing sync indicator carries the "not synced" state.
  - Local save fails: the bar stays open (step 2 state) so nothing is lost silently. The message is in-app text, never a native dialog.

### Data
- New field `mailChecks`: a list of entries, each with `id`, `at`, `kind` (`mail` or `empty`), `closedAt` and `undone`. It holds no copy of any check-in, because trips link to marks by time window. It touches `saved-state-shape` and needs an owner ruling.
- No new storage key. The field rides inside the existing saved state, which keeps `storage-keys-are-frozen`.
- Sync merges the list as a union by `id`. An undo sets `undone: true` and never deletes, so a late device cannot bring an undone trip back. This keeps the spirit of `imports-merge-never-replace` for sync.
- New field `holidays`: a list of dates the owner enters once a year. No outside calendar is fetched. It touches `saved-state-shape` and needs a ruling.
- Learned cutoff: computed each time, never stored.
- Unchanged: the parser (`parser-filters`), the device key (`the-token-is-a-credential`), the check-in shape and orphan handling.

### Slices
1. **Smallest first slice: closing sentence only.** The bar offers **Mail came** and **Done**, plus the implied-trip grouping. The sentence is built from existing check-ins and the existing lost warning. It adds no new field, needs no ruling, and ships alone. "Nothing today" is not in this slice.
2. **Empty days.** Adds "Nothing today", the `mailChecks` field and the cutoff. Needs the saved-state ruling.
3. **Mail-day counting.** The lost-mail warning switches to counting mail days, with both counts shown. Needs `holidays` and 30 recorded trips before it switches.
4. **Optional later: "Not yet due, so not shown".** A fold above the Packages list hides orders whose window has not opened. It reuses the mail-day clock and seller medians from the seller record card.

### Risks
- **Friction.** One more tap per day. A forgotten tap makes the day unknown, not empty, so the cost is lost data, never hidden lateness.
- **Sentence drift.** A wrong "Nothing needs you" is worse than none. Each wording needs a fixture test.
- **Fewer counted days.** Counting mail days delays the lost warning by up to 1 day per Sunday or holiday. Showing both counts keeps this visible.
- **Layout.** Each bar state must hold its height exactly (`no-layout-shift-under-pointer`). A long sentence wraps inside a fixed two-line slot and is cut with an ellipsis, never grown.
- **Delivery-time patterns.** The learned cutoff can drift if the carrier changes route. 90 days of trips limit that drift.

### Owner decisions (recommended answer first)
1. Add `mailChecks` to the saved state? **Yes:** one append-only list with undo flags.
2. Day boundary? **04:00 local time.**
3. How does an unchecked weekday count? **As a mail day.** It never pauses a clock.
4. When does an empty check count? **Only after the learned cutoff.** Before it, the sentence says "Nothing yet" and records nothing.
5. Should the lost warning count mail days? **Yes, from slice 3**, after 30 trips, showing both counts.
6. Where do holidays come from? **The owner enters them once a year.** Nothing is fetched.
7. Should the sentence ever show money? **No.** Cost stays in Tally.
8. Should an orphan-only trip make a mail day? **Only through the owner's "Mail came" tap**, never from the orphan itself.
