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
