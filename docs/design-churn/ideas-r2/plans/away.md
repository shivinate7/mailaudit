# Away from home
Premises (source: brief; each checked: unknown, blind by brief): one collector, hundreds of cheap cards a month; each seller ships one plain envelope; orders come in by CSV import; the app flags mail that may be lost; web and phone copies sync through a small private server.
Not covered: the brief gives no claim-window lengths, hold-mail limits or lost-flag thresholds, so every number below is invented and the owner sets it.

## Trip mode
**Idea:** The collector enters "away from Nov 3 to Nov 17" before leaving. The lost-mail clock stops for the trip. Before departure the app lists every order whose marketplace claim window closes while they are away.
**Who/why now:** The collector. Today a two-week trip comes back as dozens of false lost flags. A real claim deadline can also pass unseen in the middle of the trip.
**Shape:** On the day they leave: a sheet that says "4 orders, $11.40 total, lose their claim window on Nov 9–14. File now, or accept the risk." No order gets a lost flag during the trip. The day they get back opens the catch-up. Data needed: trip start and end, each order's expected-by date, and the claim window per order (an invented example: 30 days from ship).
**Risks:** Stopping the clock can hide a parcel that really is lost. A wrong window length can give false comfort. If the collector forgets to end the trip, flags stay paused forever, so the trip must end itself on its end date.
**Owner decides:** Where the claim window length comes from (one fixed setting, or per order). Whether the trip pauses the lost clock or only stretches its thresholds.

## Neighbour tally
**Idea:** A share link that tracks no card. The neighbour who collects the mail taps "+1 envelope" each day and can add a photo of the stack.
**Who/why now:** The collector, from wherever they are. "Did anything come?" gets an answer with no phone call and no list handed over.
**Shape:** The neighbour sees one counter per day and a camera button. No prices, no card names, no seller names. The collector's phone shows "Tue 3, Wed 0, Thu 5 (12 so far, 31 expected)." Data needed: daily counts and photos, held apart from the orders.
**Risks:** A count must never mark an order received, because an envelope from a bank counts too. The link is a credential: it must expire and be revocable. Photos may show the neighbour's home address.
**Owner decides:** Whether counts may change the lost flags at all, or only show beside them. How long the link lives. Whether photos sync or stay only on the neighbour's device.

## Envelope count first
**Idea:** The catch-up starts with one number. "How many envelopes are in the pile?" 58 against 72 expected tells the collector 14 are missing before they open one.
**Who/why now:** The collector on return day, facing a held-mail tub. Opening 58 envelopes one by one against a list of 72 open orders is the worst part of being away.
**Shape:** Step 1: enter the pile count. Step 2: for each envelope, type a few letters from the return address or the first card name. The app narrows the open orders to the closest 3 (for example seller "Gilded Moth", order 4471-B). A tap marks it received. Step 3: leftovers split into "in pile, no match" and "expected, not in pile." Data needed: open orders with seller name, city and card names.
**Risks:** Seller names often differ from return addresses, so the match can be wrong. A wrong pile count throws off the missing figure. Each step must allow undo.
**Owner decides:** Whether the pile count is kept as a record or only used for that day. Whether "expected, not in pile" goes straight to the lost list or waits a grace period.

## Arrival windows, not arrival days
**Idea:** Mail that piled up during the trip gets an arrival range (Nov 3–17), not the return date.
**Who/why now:** Every future lost flag. Logging 58 envelopes as "arrived Nov 18" makes each seller look 10 days slower. That skews per-seller transit times, which pushes later lost flags too late, or claims too late.
**Shape:** Any check-in during the catch-up carries a range automatically. Seller transit statistics skip ranges, or use them only as bounds. The order history shows "arrived during trip." When the neighbour tally has a dated count, the range can narrow. Data needed: an optional earliest and latest arrival date per check-in.
**Risks:** It adds one more state to the saved data. Old tools that read a single date may mishandle a range. The extra rigour could confuse more than it helps if transit times are never shown.
**Owner decides:** Whether the app learns transit times per seller at all. If it does not, this direction shrinks to one label.

## Travel copy
**Idea:** The phone keeps a full working copy for the flight and abroad. Edits made offline are timestamped in UTC, held in a queue, and reported on landing.
**Who/why now:** The collector on a plane or a foreign SIM. A seller asks "did it arrive?". The collector wants to check, or to log an order they bought on the road.
**Shape:** An offline badge with "3 changes waiting." On reconnect: "While you were offline: 3 changes sent; the neighbour tally added 4 envelopes; 1 conflict (order 5520-C marked by two devices)." Dates are kept in UTC and shown in home time, so the time-zone change does not move an arrival to a different day. Data needed: the queued edits with UTC time and device id.
**Risks:** A device clock that is wrong abroad can pick the wrong winner in a conflict. If the queue is lost before sync, edits vanish without a trace. Orders bought on the road may need a CSV the phone cannot produce offline.
**Owner decides:** Whether to show dates in home time or local time while away. Whether an order may be logged by hand before its CSV import exists.

Strongest: Trip mode — it is the one piece that protects money, because claim deadlines pass silently during a trip, and every other direction assumes the app knows the collector is away.

## Phase 2: Trip mode (fleshed out)

**Point:** The collector tells the app "I'm away from Nov 3 to Nov 17". While they are away, late orders get a quiet "held" label instead of the lost-mail warning, because held post is not lost post. Claim deadlines stay live throughout. On return, one catch-up flow clears the pile. It starts with an envelope count.

### Flow
1. **Set the trip.** In the Packages menu, the collector picks "Going away". An in-app sheet opens with two date fields (no native picker dialog) and a "Leave" button. Both dates are calendar days in the home time zone, so a phone abroad cannot shift them.
2. **Departure sheet.** It opens in the same sheet after "Leave":
   - "31 orders ($48.20) may arrive while you're away." This uses the mail forecast if it is built. Otherwise it uses each order's existing expected-by date.
   - "4 orders lose their claim window on Nov 6–14." This reads the claim clock and does not compute deadlines itself.
   - Each of those 4 rows offers "File now", which sets the existing dated "claim filed" stamp, or "Leave it", which does nothing.
   - "Done" closes the sheet.
3. **Away.**
   - Packages shows a strip at the top: "Away until Nov 17 · 31 due in the pile". It appears only when the view loads, never mid-session.
   - A late order shows a grey "held" label in place of the red lost-mail warning.
   - The claim clock stays red where it is red, since a claim can be filed from abroad.
   - If the mailbox deputy is built, the strip adds "12 envelopes so far". That count is never matched to an order.
4. **On the plane or abroad.**
   - Check-ins and imports work offline as they do now.
   - A CSV import of orders bought on the road merges as usual. Any new order whose expected-by date falls inside the trip gets "due in the pile".
   - The trip ends on its own on the end date, by the device's calendar, even with no network.
5. **Return.** The end date passes, or the collector taps "I'm home" in the strip. The strip changes to "Welcome back · start catch-up".
6. **Catch-up, step 1: count.** "How many envelopes are in the pile?" The answer gives "58 in the pile, 31 expected → up to 27 not here yet". The step can be skipped.
7. **Catch-up, step 2: match.**
   - Packages filters to orders due during the trip and the ones still open.
   - A find field narrows by seller, city or card name. For example, "moth" leaves "Gilded Moth · order 4471-B".
   - Each tap is an ordinary check-in. It goes into the recent-checks log, and its undo works there.
8. **Catch-up, step 3: leftovers.**
   - "In the pile, no match: 3". Each gets one "Send to Orphaned" tap. There is no bulk action, because the count may be wrong.
   - "Expected, not in the pile: 9". These stay outstanding with the held label until the grace period ends.
   - "Close catch-up" ends the flow.
9. **After.** Lost-mail warnings come back when the grace period ends. The trip remains as one line in the history: "Away Nov 3–17 · 49 checked on return".

### Screen states
- **Trip sheet.**
  - Empty: no trip yet. Shows the two date fields and a disabled "Leave".
  - Normal: dates valid.
  - Edge: an end date before the start keeps "Leave" disabled and shows inline text. A start date in the past is allowed (for someone who forgot to set it).
  - Error: none at the local level. If sync is down, a "not synced yet" note shows; nothing blocks.
- **Departure sheet.**
  - Empty: "Nothing due while you're away", and Done.
  - Normal: the totals plus the claim rows.
  - Edge: the claim clock is not built yet, so the claim block is hidden and nothing replaces it.
  - Error: an order with no expected-by date counts as "date unknown". It is listed, never dropped.
- **Away strip.**
  - Normal: as in step 3.
  - Edge: a trip of 0 days, or a trip set on another device, shows the same strip after sync.
  - Edge: two devices disagree on the end date. The existing merge order picks one, and the strip shows the result.
  - Error: the strip never appears under the pointer. It takes a fixed slot reserved at load, so it causes no layout shift.
- **Catch-up.**
  - Empty: nothing was due, so the flow ends with "Nothing to catch up".
  - Normal: steps 6 to 8.
  - Edge: pile count below matched count (58 counted, 61 checked) shows "count looks low", with no block.
  - Edge: leaving mid-flow keeps the place. "Resume catch-up" shows in the strip.
  - Error: an undo after Close still works through the recent-checks log.

### Data (each new field needs an owner ruling under saved-state-shape)
- `trips: [{id, start, end, endedAt?, pileCount?, catchUpClosedAt?}]`.
  - One new optional field, inside the existing saved state. **Storage keys:** untouched, since no new key is added.
  - It syncs through the existing Worker. **Device key:** not touched.
- **Per check-in:** no new field in the first slices. "Checked during catch-up" is derived: the check-in time falls between `endedAt` and `catchUpClosedAt`.
- **"Held" and "due in the pile":** derived from the trip dates and each order's expected-by date. Nothing new is stored.
- **Imports merge, never replace:** trip mode reads orders only. A merge during the trip is unchanged.
- **Parser filter:** untouched.
- **Orphaned mail never decides:** the pile count and deputy counts never mark an order received or lost. Only a one-tap "Send to Orphaned" creates an orphan, as it does today.
- **No native dialogs:** every prompt here is an in-app sheet.

### Smallest first slice (ships alone)
- What it includes:
  - the `trips` field (start, end and `endedAt` only);
  - the trip sheet without the departure list;
  - the away strip;
  - "held" in place of the lost-mail warning during the trip, plus a grace period;
  - the trip ending on its end date;
  - "I'm home".
- What it fixes: the wave of false lost warnings, the main harm.
- Slice 2: the departure sheet, using the claim clock once it ships.
- Slice 3: catch-up with the envelope count, adding `pileCount` and `catchUpClosedAt`.
- Slice 4 (only if the owner wants transit statistics): an arrival range per check-in.

### Risks
- "Held" could hide an order that really is lost. Mitigations: the claim clock stays live, and the grace period has a fixed end.
- A trip nobody ends would keep warnings held forever. The trip ends on its own date.
- Check-ins made on return day could skew any later per-seller transit figures. Slice 4 fixes this, or those figures skip catch-up check-ins.
- Two devices could set different trips. The existing merge order settles it, with no new conflict logic.
- An early return home with the post office still holding mail would end the held period too soon. "I'm home" offers "Mail still held? Keep held until [date]".

### Owner decisions, each with a recommendation
1. **Pause the lost-mail warning, or stretch its threshold?** Recommended: hold it, and show it grey as "held". Stretching makes each order's deadline harder to explain.
2. **Add `trips` to the saved state?** Recommended: yes, as one optional array. Older copies ignore it.
3. **Grace period after return?** Recommended: until the catch-up closes, plus 3 days (invented). With no catch-up, 5 days after the trip ends.
4. **Keep past trips?** Recommended: keep them all. They are a few bytes each and give the history line.
5. **Is the pile count required?** Recommended: optional, with one tap to skip.
6. **Leftover envelopes to Orphaned: bulk or one at a time?** Recommended: one tap per envelope, because the count may be wrong.
7. **Does the trip pause the claim clock too?** Recommended: no. A claim can be filed from anywhere, and the money is the point.
8. **May any device set or end a trip?** Recommended: yes, synced. The phone is the device on the trip.
