# Mail Day at the Table: five directions

Lens: the physical moment — twelve envelopes, scissors, sleeves, a phone propped on a mug. Premises from the brief, unchecked because the planner worked blind: the collector imports CSV order history; orders are many, cheap, each from a small seller; the app runs on web and phone, synced; envelopes are plain, with smudged or missing return addresses and packing slips that may be missing.

All seller names are invented.

## outside-in
**Idea:** match the envelope before the scissors touch it. With the phone propped on the mug, hold each envelope up. The camera reads whatever is printed on the outside: a postage label, a typed sender line, the origin ZIP or the postmark city.
**Who / why now:** with twelve envelopes on the table, the slow step is deciding which one is which. Today that happens after opening, with cards in hand and the slip possibly missing.
**Shape:** "Count in" first: tap once per envelope, so the app knows today's batch is 12. Each scan shows the two or three likeliest orders, for example "Seller Kestrel-7, 3 cards, shipped 9 days ago". Pick one, then open. If nothing is readable, the app ranks by oldest outstanding order and by card count, which you can feel through the paper.
**Risks:** handwriting and smudges beat the reader. A wrong early guess biases the match. Address photos are personal data, so read them and throw them away.
**Owner decides:** keep envelope images or never store them. Is "count in" worth the extra taps.

## card-speaks-for-itself
**Idea:** forget the envelope. The cards are the one identifier every package has. Slide each card, sleeved or in a toploader, under the propped phone. The camera reads the name and collector number. The app ticks the line in whichever open order holds that card.
**Who / why now:** it fixes the missing slip and the blank return address in one move, and no fingers touch the screen.
**Shape:** a live camera strip at the top, with the current envelope's expected cards below it. Each card it sees ticks with a soft click. If two open orders both hold the same card, the app asks "which envelope?" once. After that, the envelope is pinned to that order until you say "next envelope". If the read fails, a type-ahead on the card name is one tap away.
**Risks:** glare through toploaders and foils. Tiny set numbers. Look-alike printings with different costs. Phone battery and heat over a long session. An auto-tick that is wrong is worse than a slow one.
**Owner decides:** auto-tick or confirm each card. Which games and printings to support first. On-device recognition only (the sketch assumes yes).

## hands-off-loop
**Idea:** the person's hands are full of scissors and sleeves, so the app works by sound and voice, with screen targets big enough for a knuckle.
**Who / why now:** every unlock and every precise tap costs a put-down and a pick-up. Over many cards, that is most of the fiddle.
**Shape:** one card fills the screen at a time, with a tick target the size of the bottom half. A distinct sound for each outcome: card ticked, envelope complete (a short chord), "not in any order" (a low buzz), "already ticked" (a double tap). Optional voice: say "got it", "missing", "damaged", "next". The app reads back what is still expected: "two more: a land and a rare".
**Risks:** a noisy kitchen. Card names that speech engines mishear. Sounds that annoy anyone else in the room. The screen sleeping mid-envelope.
**Owner decides:** voice in scope, or sound and big targets only. The fixed list of spoken commands.

## pile-sorter
**Idea:** the moment after ticking is where cards go: binder, deck box, trade pile, sell pile. The app names the pile while the card is still in hand.
**Who / why now:** after a fast check-in comes a second slow pass to sort the cards. Folding sorting into the tick removes that pass.
**Shape:** the owner defines three to five piles once, with simple rules: by price band, by a tag set at import, or by "wanted for a deck". On each tick a large coloured label shows the pile, for example "TRADE". The session summary shows each pile's count and total cost, so the trade pile already carries its cost basis.
**Risks:** scope creep from a receiving ledger into collection management. Rules need upkeep. A wrong pile is a quiet error.
**Owner decides:** is "where it goes next" this tool's job at all. Where pile rules live, and whether they sync.

## problem-tray
**Idea:** catch every exception at the table, while the evidence is in hand: a wrong card, a missing card, the wrong condition, a bent corner, an envelope with no way to match it.
**Who / why now:** a claim against a seller needs a photo, the order's age and the cost. Days later, the envelope is in the bin and the card is in a binder.
**Shape:** one "problem" button, then a choice of four: wrong, missing, damaged, unknown sender. The app takes one photo of the card and keeps it. It saves a short note with days since shipped, cost, and what was expected. An unknown-sender envelope goes to the tray with its card photos. It ticks nothing until someone matches it. At session end: "1 damaged, 1 unmatched envelope, 4 orders past 21 days". The last group becomes the lost-mail list.
**Risks:** photos have to be stored and synced, which costs space. The overdue threshold differs by seller and by season. The tray fills up and nobody empties it.
**Owner decides:** how long photos are kept. The overdue threshold (one global number or per seller). Whether the app drafts claim text.

Top pick: card-speaks-for-itself. It is the only direction that works when the slip and the return address are both missing, which is the hard case in the brief. It also makes outside-in optional and feeds the problem tray for free. Ship its type-ahead fallback first, so a weak camera read never slows the table.

---

# Phase 2: card-speaks-for-itself, fleshed out

**What it builds on and where it differs.** A new way to enter check-ins. It writes the same check-ins as today and does not replace the package list. Its ticks feed the existing lost-mail warning and the per-product cost total, unchanged. Each tick lands in the recent-checks log, and that log's undo is what makes an auto-tick safe. A card that matches no open order goes to the existing orphaned pile, and a scan only proposes a match there (invariant `orphaned-mail-never-decides`, orphaned mail never decides). A wrong or damaged card opens the existing photo and stamp tools. The browser extension being built could supply set and collector number where the CSV lacks them; whether the CSV carries those is unknown.

**Flow**
1. On mail day, tap "Scan cards". The camera opens on iPhone or on one half of the folding phone. Web opens a type-ahead box instead.
2. Prop the phone. Open the first envelope and slide a card under the camera.
3. The app reads the name line, plus set and number where legible, and searches only open lines.
4. One match: that order becomes "this envelope"; the app shows the expected cards and ticks the first with a click. Two or more: it asks once "which envelope?" with big buttons. None: it buzzes and offers "orphaned" or "extra card".
5. Further cards from that envelope match the pinned order first and auto-tick.
6. When every expected card is in, a short chord plays and a large "Next envelope" button appears. "Missing one" leaves the line open, so the lost-mail warning keeps counting it.
7. A wrong or damaged card: tap "Problem". One photo, attached to the package, then the stamp picker.
8. Done: a summary shows envelopes closed, cards ticked, cost received, lines still open.

**Screen states for a mockup**
- Live scan, nothing pinned: camera strip on top; "No envelope yet · 214 cards outstanding in 38 orders"; type-ahead fallback at the bottom.
- Envelope pinned: "Seller Kestrel-7 · shipped 9 days ago · 1 of 3", Moss Golem ticked, Ember Wisp and Tidepool Lantern still expected, each with its price.
- Ambiguous read: "Ember Wisp is in 2 open orders", two half-screen buttons, "Seller Kestrel-7" and "Seller Brindle Barn".
- Envelope done or no match: "3 of 3 received · $1.85" with "Next envelope"; or "Glass Heron is in no open order" with "Orphaned" and "Extra card".

**Data**
- Each open line's card name, quantity and price: the CSV import.
- Set code, collector number and printing: unknown in the CSV; the extension may supply them. Without them, matching is by name only.
- Ship date for ranking ambiguous matches: the CSV.
- Text read from the card: on-device text recognition on iPhone and the folding phone. Web camera is unmeasured, so web gets type-ahead only.
- The pinned envelope: local, this session only. Nothing new syncs beyond the ticks.

**Smallest first slice.** Card-first type-ahead on every platform, no camera. Type a few letters, see matches across all open lines. A tick pins the envelope, the next search checks the pinned order first, and the chord sounds when it completes. Camera reading on iPhone is the second slice and uses the same matcher.

**Owner decisions**
- Auto-tick or confirm each card? Recommend: confirm the first card of each envelope, then auto-tick exact matches inside the pinned order. Undo covers mistakes.
- Match on name only, or name, set and number? Recommend: name first, set and number as tie-breakers.
- May a scan assign an orphaned package? Recommend: no. Suggest only; the owner taps.
- Keep camera frames? Recommend: no, unless "Problem" is pressed.
- Camera on web? Recommend: not at first.
- Folding-phone layout? Recommend: camera on one half, expected list on the other, propped like a tent.
- Sound on by default? Recommend: yes, with a remembered mute.
