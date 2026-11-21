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
