# Ten times the volume

Premises, from the brief. Their status is unknown because the brief forbids reading the code.
- Brief: today's volume is hundreds of cards a month and the lens multiplies it by ten. Unknown.
- Brief: a seller ships each order separately in a plain envelope. Unknown. A lot may arrive in a box or across several envelopes.
- Brief: check-in works card by card, and a mail flag marks a package that may be lost. Unknown. I did not see how a package gets flagged.
- Brief: a small private server syncs copies of the data. Unknown. I do not know its payload size or storage limits.

## Doorstep pass, then bench pass
Idea: split arrival into two steps. In the doorstep pass, one tap logs each envelope by seller. In the bench pass, the collector opens envelopes and checks the cards later, whenever there is time.
Who and why now: at forty envelopes a day, card-by-card check-in at the mailbox takes an hour. Only the envelope's arrival matters for lost mail, and that signal must not wait for a free evening.
Shape: the doorstep screen lists the sellers due, with large rows. Typing "crim" narrows the list to Crimson Binder Co., and one tap logs it as arrived. The bench screen holds every envelope that is logged but not opened, oldest first. Each opens to its card list. Data needed: one new arrival state and its date on each package, separate from the card states.
Risks: two states can drift. An envelope logged but never opened hides a short shipment for weeks. Three sellers can share one name.
Owner decides: should an unopened envelope count as received for cost and tally? After how many days should the bench nag?

## Seller rhythm
Idea: learn each repeat seller's real transit time. The ship-to-arrival median and spread come from past check-ins. That history drives a list of envelopes due today and a lost-mail flag sized to each seller.
Who and why now: with many repeat sellers, a fixed lost threshold gives dozens of false flags. A slow seller in another state trips it every week. The collector stops reading flags, and real losses slip past.
Shape: each package shows "usually 4–6 days; day 9". A flag fires only past that seller's spread. A seller with no history falls back to today's rule. The doorstep pass sorts its list by this forecast. Data needed: order date, arrival date and seller key, all already present.
Risks: a small sample per seller, holiday surges, and a seller who changes shipping method.
Owner decides: how many arrivals make a seller "known"? Should the flag be quieter for cheap orders?

## Count, then spot-check
Idea: check a bulk lot by count and value, not card by card. Only cards above a value line, say $2, get their own tick. The commons are confirmed with one count ("147 of 150").
Who and why now: a lot of 150 commons at $0.08 each takes 150 taps to check, for $12 of value. At ten times the volume, lots are the bulk of the cards but little of the money.
Shape: an order above N cards opens in lot mode. Cards above the line show as a short checklist, and one field takes the rest as a count. A short count asks which cards were missing, or records "3 commons short, $0.24".
Risks: the tally view loses per-card certainty for commons. A wrong count hides a missing playset card. The cost basis per card needs a rule for "short by count".
Owner decides: the value line, and whether a count-confirmed card counts as received for each card name in tally.

## Claim clock
Idea: turn lost mail into money recovered. Each flagged package starts a countdown to the marketplace's claim deadline. A weekly list shows what to file, with prepared text: order ORD-48213-K, seller, cards, total.
Who and why now: even 1% loss across forty envelopes a day is a dozen claims a month. Most of them are only worth a few dollars, so they get filed late or never.
Shape: a "To file" list sorted by deadline. A copy button copies the claim text. The collector marks each claim filed, refunded or arrived late. A running total shows the refunds won.
Risks: marketplace rules are not in the CSV, so the deadline is a setting the owner keeps current. A late arrival after a refund needs a clear state.
Owner decides: the deadline in days, whether a claim under $1 is worth listing, and whether refund amounts count against cost basis.

## Close the month
Idea: once a month, settle the orders that are fully received or refunded. Fold them into a compact archive. The working set then holds only open mail.
Who and why now: thousands of cards a month mean tens of thousands of rows within a year. The size of phone storage, the sync payload and render time grow with them. Phone storage quotas break first and silently.
Shape: a "Close October" button. First it shows a reconcile summary: received, short, lost, refunded and cost. Then it archives. Tally and search still read the archive. Check-in reads only the open set. Data needed: an archive store that merges, never replaces, and that is synced like the rest.
Risks: archiving must never drop a row. A late import that touches an archived order must reopen it. Two devices might close the same month at once.
Owner decides: can an archived row still be edited? Should closing be manual or automatic after N days?

Strongest: Doorstep pass, then bench pass — the forty-envelope moment is what breaks first. Splitting a two-second arrival log from slow card checking keeps the lost-mail signal current without costing the collector an hour a day.

## Phase 2: Doorstep pass, then bench pass (fleshed out)

**The point.** Logging that an envelope reached the house is a two-second job, so do it at the door. Checking its cards is a ten-minute job, so do it at the bench. The lost-mail signal then depends only on the fast step. This takes in the household planner's split between "in the house" and "opened and counted".

### Flow
1. **Doorstep.** The collector brings in a stack, for example 38 envelopes. They open Packages and switch it to Doorstep mode. Doorstep is a mode of Packages, not a fourth view.
2. The screen lists the sellers due, oldest order first. If the mail forecast from round 1 is built, it sets the order; if not, the order date does.
3. For each envelope, they type 2–4 letters of the return name, such as "pal". The list narrows to "Pale Moon Cards · 6 cards · $4.10 · ordered 9 days ago".
4. One tap logs the package as arrived. The row stays where it is, greys out and shows "In the house 10:42". An undo chip appears, and the tap goes into the existing recent-checks log with undo.
5. If the envelope has no return address, they tap **No sender**. This creates an Orphaned item, which decides nothing.
6. **Bench.** Later, they open Packages in Bench mode. It lists every package that is in the house but not yet opened, oldest first.
7. They open one. It is the existing card checklist. Ticking cards works as it does today. A package leaves the bench when every card is ticked or marked missing. Opened is derived from those card states and needs no stored field.
8. If the packing slip shows a different order, they tap **Not this order**. The arrival moves to the order they pick, and the move is logged with undo.

### Screen states
**Doorstep**
- Empty: "No mail expected today." Below it is a search box over all open packages, because mail can arrive early.
- Normal: the search box sits at the top. The due list sits below it, with logged rows greyed in place. A counter reads "14 logged · 24 due".
- Edge: one seller with two open orders. An inline chooser opens under the row, showing each order's date, card count and total, plus a "Can't tell" button. "Can't tell" sends the envelope to Orphaned, noted with the seller name.
- Edge: a package already logged. The row reads "Logged 10:42 — another envelope for this order?" and offers [Same order] [Different order]. A split shipment does not log twice.
- Edge: a seller who is not due. The search falls through to every open package, with the result marked "not expected yet".
- Error: the save fails. The row shows "Not saved — tap to retry" and stays marked pending, never logged.
- Error: the device is offline. The arrival saves locally and a small note reads "will sync".
- Error: an import or sync lands during a pass. New rows appear only when the search box clears, never under the thumb.

**Bench**
- Empty: "Bench clear."
- Normal: rows read like "Pale Moon Cards · in the house 2 days · 6 cards · $4.10".
- Edge: a package partly checked stays on the bench as "4 of 6".
- Edge: a package waiting longer than the nag limit shows "waiting 9 days" in the row text. It gets no badge that would make the row taller.
- Edge: an envelope with no cards in it goes to the existing missing-card flow.
- Error: a sync from another device ticks cards. The row updates in place. It leaves the list only after the collector moves the pointer off it or refreshes.

**Layout under the pointer.** No row reflows, collapses or reorders while the pointer is on it. Logged rows grey out in place. The list compacts only when the search box clears or the mode changes (`no-layout-shift-under-pointer`). Every chooser and confirm is inline, never a native dialog (`no-native-dialogs`).

### Data
- **New field `arrivedAt` on a package.** It holds the time the package was logged arrived and is optional. It touches `saved-state-shape` and needs an owner ruling. It adds no storage key (`storage-keys-are-frozen`) and lives inside the existing state.
  - Merge: it follows the existing later-change-wins rule. An undo writes a cleared value, not a deleted key, so a merge cannot resurrect a cleared arrival. Unknown: how the current merge spells a cleared value.
  - Imports never touch `arrivedAt`, so an import cannot clear it (`imports-merge-never-replace`).
- **Opened is derived** from the existing card states, so it needs no new field.
- **Recent-checks log** gains an "arrived" entry kind. Unknown: whether the log is part of saved state. If it is, this entry is a second shape change under the same ruling.
- **Orphaned with a seller note** ("Can't tell" between two orders). Unknown: whether an Orphaned item already has a free-text note. If it does not, this is a third shape change. In both cases the item decides nothing (`orphaned-mail-never-decides`). It never sets `arrivedAt` and never silences a lost warning until the collector assigns it.
- **Untouched:** the parser (`parser-filters`) and the device key (`the-token-is-a-credential`). If a mailbox deputy (round 1) runs Doorstep on a second phone, that lane decides how the key reaches that device. This plan does not.

### Smallest slices
- **Slice 0 ships alone with no ruling: the Doorstep finder.** It adds Doorstep mode with the search-first list. A tap opens that package's checklist, as Packages does today. It adds no fields and saves the hunt for each package.
  - Done check: time a 40-envelope stack. Target: under 4 minutes to reach every package, against about 9 minutes today (both invented figures).
- **Slice 1, after the `arrivedAt` ruling.** It adds the one-tap arrival, the undo chip, Bench mode, and the lost-warning handover (see decision 2).
  - Done check: 40 envelopes logged in under 2 minutes, with zero layout shift under the pointer in a recorded pass.
- **Slice 2.** It adds the "in the house" count in Tally, the bench nag, "No sender" and "Can't tell" sending envelopes to Orphaned, "Not this order", and the forecast sort.

### Risks
- **Drift.** A package logged and never opened hides a short shipment past the marketplace's claim window. The bench nag and the recovery ledger (round 1) must read `arrivedAt`.
- **Wrong tap at speed.** The collector logs the wrong seller. The undo chip and the in-place rows contain this. A bench check of the packing slip catches the rest.
- **Two devices.** Two phones can log the same envelope, or log it and then undo it. Later-change-wins settles it, but a cleared value that is spelled wrong could bring an arrival back.
- **The ruling blocks Slice 1.** If the owner refuses a new field, only Slice 0 ships.
- **Proof at the door (round 1) overlaps this step.** If both ship, a photo attaches to the arrival tap. It must not add a second tap per envelope.

### Owner decisions (recommended answer first)
1. **Add `arrivedAt` to the saved state?** Yes. It is one optional field, merged by later-change-wins, and undo writes a cleared value.
2. **Does an arrival silence the lost-mail warning?** Yes. The bench nag replaces it, because once the mail is in the house it is no longer lost.
3. **Does "in the house" count as received in Tally and cost basis?** No. Tally shows it as a third count, for example "2 received · 1 in the house · 1 out", and cost basis moves only when a card is ticked.
4. **After how many days should the bench nag?** 7, to leave room before a marketplace claim window closes.
5. **Where does "Can't tell" between two orders from one seller go?** To Orphaned, noted with the seller. Never to the oldest order, because a guess must not decide.
6. **Does ticking a card with no doorstep log set `arrivedAt`?** Yes, on the first tick, when the field is empty. Days with no doorstep pass then still feed arrival dates.
7. **Is Doorstep a fourth view or a mode of Packages?** A mode of Packages. This keeps the three views, and Packages is already the mail-day view.
