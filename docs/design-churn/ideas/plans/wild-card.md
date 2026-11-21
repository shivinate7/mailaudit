# Wild card: four directions outside the other lenses

Lens: none. The planner was told to avoid money, sellers, loss claims, speed of opening, the collection, automatic import, data trust, accessibility and delight. Premises unchecked; the planner worked blind. No order numbers, seller names or brand names are used.

## mailbox-deputy
**Idea.** The buyer is often not the person who empties the mailbox. A partner, roommate, parent or house-sitter brings the envelopes in. Give that person a small, limited view: "Is this envelope one of theirs? Put it in the tray." They need no account and see no prices or card lists.
**Who and why now.** Households where mail piles up on a counter, and buyers who travel. Sync between web and phone already exists, so a second viewer is the next step.
**What they see and do.** A share link or QR on the fridge opens one screen with today's expected count ("about 6 small white envelopes"). There is one button: "I brought in 4." The buyer sees "4 waiting in the tray" before they get home. A printed weekly sheet works the same way for someone who will not use a phone.
**Risks.** A shared link leaks that a parcel is expected. A wrong count from the deputy could look like lost mail. Too much setup kills it.
**Owner decides.** Should the deputy's count be advisory only, never changing a card's state? And is a link enough, or does it need a second login?
**Practicality.** Modest (planner's guess, unmeasured). Distinct from opening speed: the deputy never opens anything; the point is a second person's handoff.

## mail-weather
**Idea.** The hobby and the post both have seasons: set-release weeks, holiday peaks, postal holidays, summer heat for foil cards. The buyer's own history can show how slow each season is. Turn that into a forward calendar for planning purchases and time away.
**Who and why now.** A buyer who orders in bursts and then travels. December is the obvious first test.
**What they see and do.** A strip of the next six weeks shaded by expected mail delay, drawn from their own past arrivals. Two questions get answers: "What is the last day to order if I leave on the 20th?" and "When will the mailbox be fullest?" Holidays and release weeks are entered by hand once a year.
**Risks.** Thin history gives noisy shading. If it mainly retunes lost-mail alerts, it duplicates existing work.
**Owner decides.** Should it inform buying and travel only? Or should it also feed the lost-mail warning?
**Practicality.** Small for the strip, larger with the travel planner (planner's guess, unmeasured). It plans ahead and files nothing.

## postmark-atlas
**Idea.** Untracked letter mail has almost no public data on transit times. Every check-in records "sent from region X, arrived day N." Pooled anonymously across many buyers, those records form a community map of postal routes by season.
**Who and why now.** Other small-order buyers, and small sellers who ship untracked and never learn when a letter lands. Hobby forums already trade guesses on this.
**What they see and do.** An opt-in "share arrival times" switch. The share sends only origin region, destination region, week and days in transit. A public map shows median days from region to region, season by season.
**Risks.** Privacy: a region pair plus dates could identify a buyer in a small town. Few users means no useful map. It needs a server the owner must run, and moderation.
**Owner decides.** Is the side project willing to become a public service at all? And how coarse must regions be before it is safe?
**Practicality.** Speculative. Nothing is scored per seller, only per route.

## many-small-envelopes
**Idea.** The five-year view. The core problem is "dozens of tiny shipments from many strangers, each a few items." That problem is not unique to cards. Seed swaps, stamp collecting, miniature parts, sample-size cosmetics and yarn destash buyers all live it. Separate the general ledger from the card-specific layer.
**Who and why now.** The owner, if they ever pick up a second hobby, or one friend in another hobby. It is also the strongest test of which parts of the design are truly about mail and which are about cards.
**What they see and do.** The same checklist and late-mail flags. Item names and units change per hobby ("packet", "sheet", "skein"), and each hobby gets a small entry form in place of a file reader.
**Risks.** Generalizing too early slows the card tool the owner actually uses. One person cannot support other hobbies' quirks.
**Owner decides.** Should the code keep a clean seam between "mail" and "cards" now, at low cost, with no promise of a second hobby?
**Practicality.** The seam is cheap; beyond that, speculative.

Top pick: mail-weather. It uses only the buyer's own history and answers a question the tool cannot answer today: when to stop ordering before a trip or the holiday crunch.

---

# Phase 2: mailbox-deputy, fleshed out

**How it relates to what exists.**
- Device key: the deputy never gets it. The sync server issues a separate deputy pass that allows one act only — report a count. It expires and the buyer can revoke it.
- Lost-mail warning: the deputy count never changes it.
- Orphaned pile holds opened mail with no known sender; the tray holds unopened mail someone else brought in. Like the orphaned pile, the tray decides nothing.
- Recent-checks log: each deputy report is one entry, with undo.
- Platforms: the deputy page is plain web on any phone, no install.

**Flow**
1. In settings, the buyer taps "Add a deputy" and types a label, such as "Sam".
2. The server makes a deputy pass. The buyer's device shows a QR code, a share link and "Print fridge sheet".
3. The QR code goes on the fridge, or the link is sent.
4. Sam brings in the mail, scans the code, and sees the expected count for the week — no card names, prices or sellers.
5. Sam sets a stepper to the number of envelopes, adds an optional note ("one padded mailer"), and taps Done.
6. Sam sees a confirmation with Undo for 10 minutes.
7. The buyer's devices show a tray banner: count, who, when.
8. Each check-in lowers the tray count; the banner clears at zero.
9. The pass expires or is revoked: "This link is no longer active."

**Screen states for a mockup**
1. Buyer settings: "Deputy: Sam, active until 6 Dec", QR code, Print fridge sheet, Revoke.
2. Deputy page: "Expected this week: about 5 to 7 small envelopes", stepper at 4, note field, large Done.
3. Deputy confirmation: "Logged 4 envelopes, Thu 18:10. Thanks, Sam." with Undo (9 min left).
4. Buyer home: banner "Tray: 4 envelopes from Sam, Thu 18:10, 1 checked in", the usual package list below.

**Data**
- Deputy pass: id, label, expiry, revoked flag. A credential, kept apart from the device key.
- Tray report: time, count, note, pass id. Stored beside the check-in records, not inside them, so the saved-state shape keeps its form.
- Expected-count range: the buyer's device computes it and posts only the rounded range. The server never needs the item list.
- Tray decrement: computed locally from check-ins after the report.

**Smallest first slice.** One deputy pass, fixed 30-day expiry and Revoke. Deputy page has the stepper and Done only. The buyer sees the tray banner; each report is one undoable log entry.

**Owner decisions**
1. Should the deputy see the expected count? Recommend: yes, as a rounded range, in slice 2.
2. May a deputy report change a package's state or the lost-mail warning? Recommend: never.
3. Pass life and count? Recommend: 30 days, revocable, one per named person.
4. May the deputy add a photo of the stack? Recommend: not now; mail shows names and addresses.
5. Deputy reports in the recent-checks log with undo? Recommend: yes.
6. Paper fridge sheet before the link? Recommend: no; the link is the product.
