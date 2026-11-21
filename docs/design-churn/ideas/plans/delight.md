# Mail Day, Made Worth Opening: five directions for joy and habit

Lens: joy and the habit loop, without nagging. Premises from the brief only, unchecked against code:
- Mail day is already a small thrill, and the tool feels like a ledger (brief, owner framing): unknown
- The website and the phone app stay in sync, so one ritual can span both (brief): unknown
- The person is a grown-up whose time matters, so anything that nags fails (brief): holds as a design constraint

All card names are invented.

## mail-forecast
**Idea.** A calm look at the week ahead, like a weather forecast: which days envelopes will likely land, and how many. The guesses come from ship dates and how long past orders took.
**Who it helps and why now.** It helps the buyer who orders in bursts and forgets what is coming. Anticipation is half the fun, and right now that half is hidden in a list.
**Shape.** A strip of seven days, each showing a few small envelope icons. The likely day is solid, and a fuzzy edge shows the spread ("2–4 envelopes, Thu–Sat"). Tap a day to see the cards inside, such as "Lantern Wyrm, foil" or "Tidecaller Apprentice ×4". A late envelope drifts off the strip into a gentle "running late" shelf. That shelf feeds the may-be-lost flag but uses softer words.
**Risks.** False precision: a confident wrong date reads worse than no date, so always show a range. Forecasting from a thin history is noise, so stay hidden until about 20 deliveries exist. This must not become a daily push notification.
**Owner decisions.** Show ranges or a single best guess? Should the late shelf start the may-be-lost timer, or only mirror it? Should the forecast be the app's opening screen on mail days?

## the-reveal
**Idea.** Make checking a card in feel like opening the envelope, not ticking a box. Each tick gets a short flip, a soft paper sound and a light haptic tap. A day's check-in ends with a small "today's pulls" spread.
**Who it helps and why now.** It helps the person standing at the counter with a stack of envelopes. The physical moment is already happening, and the screen should echo it rather than interrupt it.
**Shape.** Ticking a row flips its card face-up in place. The row keeps its size, so nothing moves under the thumb. After the last tick of the session, a tray shows today's cards laid out. An optional photo slot holds the actual pull. One tiny surprise: when an envelope that was flagged as maybe lost finally arrives, it gets its own stamp: "Found its way home."
**Risks.** Fun at four cards, a chore at forty. It needs a fast path (bulk tick with no motion) and must respect reduce-motion and mute. Sound in a quiet house at 7 a.m. is rude, so sound is off by default. Confetti is tacky; stay with paper, ink and stamps.
**Owner decisions.** Sound on or off by default? Keep photos on the device only, or let them sync? Does bulk tick get the reveal too, or skip it?

## postmark-book
**Idea.** A habit record that cannot be broken. Each day you check in mail adds an ink postmark to a calendar page. Gaps stay blank paper and never count as failure. You cannot control the mail, so a streak that punishes a quiet day is unfair.
**Who it helps and why now.** It helps the regular who likes proof of the routine but would quit a tool that scolds.
**Shape.** A monthly page of stamps. The ink grows darker with more cards that day. Small marks show milestones: the 500th card, the first month with nothing lost. No counter of consecutive days, no "don't lose your streak", no badges screen. A "caught up" state (nothing due, nothing late) gets one quiet line, never a reward.
**Risks.** Gamification creep: every later request ("add levels!") moves it toward a dark pattern. Write the no-streak, no-nag rule down before building. Milestones can feel babyish, so keep them sparse and dry.
**Owner decisions.** Can a milestone ever trigger a notification (recommend never)? What counts as a mail day: any check-in, or only a day with one or more cards received?

## year-in-cards
**Idea.** A wrap-up at month end and year end, made like a printed almanac, not a slideshow.
**Who it helps and why now.** It helps the collector who wants the story of the hobby: what they chased, what it cost, which envelope took the scenic route. The data already exists, and nobody has told the story yet.
**Shape.** One scrolling page. Cards received, average cost per card, the most-bought set, the fastest and slowest delivery, "the envelope that took 41 days", the busiest mail day, and a grid of the year's postmarks. Spend is shown, but behind a fold the person opens on purpose.
**Risks.** Spend totals can sting and turn joy into guilt, so frame them as cost basis and never as judgment. Naming sellers in superlatives (slowest!) is unkind and a privacy leak if shared, so call them "Seller A". An auto-playing story format would be the tacky version.
**Owner decisions.** Show money in the wrap at all, or only on request? Monthly, yearly, or both? Is it generated on demand only (recommend yes), or announced?

## haul-postcard
**Idea.** Share one mail day's haul with a friend as a postcard image: the cards that came today, laid on a table.
**Who it helps and why now.** It helps the collector whose joy grows when someone else says "nice pull". Today they screenshot a spreadsheet-looking row.
**Shape.** From today's pulls tray, tap "Make postcard". The postcard shows card art or the person's photo, a postmark with the date, and an optional one-line note. It has no prices, no sellers and no order numbers by default. The person exports an image and sends it through their own messages. The app adds no accounts, feeds or likes.
**Risks.** Privacy: one stray price or seller name leaks, so the default is to strip both and any opt-in must be explicit. Feature creep toward a social network. Card artwork may carry rights questions when posted publicly.
**Owner decisions.** Image only, or also a private link? May prices ever appear, even by opt-in? Does sharing belong on the web, the phone, or both?

Top pick: the-reveal — it adds joy at the one moment the person is already in the app, needs no new data or social surface, and if the bulk path and the no-shift rule hold, it makes the daily check-in itself something to look forward to.

---

# Phase 2: mail-forecast and the-reveal, fleshed out

## mail-forecast (phase 2)

**Builds on / differs.** It reads the existing lost-mail warning's late threshold and adds no second lost-mail rule. The "running late" shelf is the warning, worded softly. A package stamped "claim filed" or "refunded" leaves the forecast. Orphaned mail never matches an expected envelope, but the orphaned count can appear under "today". The browser extension can later supply fresher ship dates; the forecast works without it.

**Flow**
1. Open the app any morning. A seven-day strip sits above the working list in a fixed-height band, so it never pushes rows.
2. Each day shows an envelope count and a range: solid for likely days, faded for the spread.
3. Tap a day to see its expected packages: seller placeholder, card count, cost.
4. Check mail in as today. The day's count drops in place.
5. A package past its range moves to the "running late" shelf. Past the lost threshold it carries the existing warning.
6. Done: today reads "All in", or "2 still out, due by Sat".

**Screen states**
- Week strip: Mon 0, Tue 1–2, **Wed 3**, Thu 2–4 (faded), Fri 1, Sat 0, Sun 0. Below: "14 cards on the way, $38.20".
- Day opened (Wed): Seller A, 6 cards, "Lantern Wyrm ×1, Tidecaller Apprentice ×4…"; Seller B, 2 cards; Seller C, 1 card.
- Late shelf: "Seller D, 3 cards, expected Nov 3–7, 9 days late", one row with the lost warning, stamped "claim filed".
- Too little history: "Forecast starts after 20 deliveries (12 so far)".
- Two-screen fold: strip and late shelf on the left, the opened day on the right.

**Data**
- Order date and, if present, ship date: the imported order files. Unknown whether the export carries ship dates.
- Received date per package: the recent-checks log or check-in times.
- Transit spread, global first: computed from past order-to-received gaps, recomputed on read, nothing stored.
- Late and lost: the existing warning threshold.

**Smallest first slice.** Web only. A read-only "Due this week" list grouped by day, ranges from the 25th to 75th percentile of all past transit times, no per-seller model, no shelf. Shows once about 20 deliveries exist.

**Owner decisions**
- Range or single date? Recommend: range.
- Per-seller or global model? Recommend: global first; per-seller once a seller has 5 or more deliveries.
- Push notifications? Recommend: never.
- Band above the list or its own view? Recommend: fixed-height band, collapsible, remembered per device.
- A soft "running late" step before the lost warning? Recommend: yes, shown only on the shelf.

## the-reveal (phase 2)

**Builds on / differs.** A check-in stays one tap; the reveal only changes how the tick looks. The card flips in place inside a fixed box, so the no-layout-shift rule holds. "Today's pulls" is a filtered view of the recent-checks log, and its undo is that log's undo. The optional pull photo is the existing package photo. "Found its way home" appears once when a package with a lost warning or a "claim filed" stamp is checked in; it is derived, not a new stamp. Orphaned arrivals reveal too, with no seller.

**Flow**
1. Mail arrives. Tap a card row.
2. The row's face flips once (about 250 ms) to "received", with a soft haptic. Sound off by default. Reduce-motion swaps the flip for a fade.
3. Multi-select or "all in this package" ticks without motion, one haptic at the end.
4. After the last tick, or on "Today", the pulls tray opens: today's received cards in a grid.
5. Optional: "Add photo of the pull" attaches the package photo.
6. A package that was flagged lost shows a one-time "Found its way home" postmark.
7. Undo from the tray reverses through the recent-checks log; the card flips back.

**Screen states**
- Mid-flip: "Tidecaller Apprentice ×4, Seller A" half-turned, neighbours unmoved.
- Pulls tray: "Today, 9 cards from 3 envelopes". Grid: Lantern Wyrm (foil), Tidecaller Apprentice ×4, Ashgrove Sentry ×2, Mirelight Totem, Quiet Harbor. "$11.40" folded shut.
- Found: one tile stamped "Found its way home, 23 days".
- Two-screen fold: the list ticking on the left, the tray filling live on the right.

**Data**
- Received events and times: the recent-checks log.
- Card name, quantity, foil, cost: the order rows.
- Photo: the existing package photo.
- Lost or claimed before arrival: warning state and stamps, read at tick time.
- Card artwork: no known source.
- Sound and motion settings: per device, not synced.

**Smallest first slice.** The in-place flip with reduce-motion support, plus a "Today" tray built from the recent-checks log, with undo. No sound, photos, art or found stamp. Web and iPhone together.

**Owner decisions**
- Sound on by default? Recommend: off.
- Card art? Recommend: a text face (name, set, foil sheen) first.
- Reveal on bulk ticks? Recommend: no motion, one haptic, full reveal in the tray.
- Does "Found its way home" persist? Recommend: derived and shown once; it never clears the claim stamp.
- Tray shows the day's spend? Recommend: folded shut, opened on purpose.
