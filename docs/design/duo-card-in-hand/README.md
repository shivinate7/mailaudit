# Card in Hand on the iPhone Duo, round 2

Open `index.html` from disk. One page draws every screen and pose.

The owner picked Card in Hand on 2026-10-27 12:25 CDT. Two parts come from round 1's other concepts. The past-transit page comes from Sorting Frame. The Suspense line comes from Account Book. This is an informed lane, directed by that pick. On the open Duo, Card in Hand is the Packages tab.

Inputs: round 1 (`docs/design/duo-blind/` on PR #139), `shared/tokens.json`, the house UX rules, and degen's plan, section 4.6.2 (iPhone Duo).

## The screens

1. **Open flat.** The query is on the left page. The envelope and its envelope-mates are on the right. The owner's taps check each card in.
2. **Stray.** A name in two open envelopes goes on the Suspense line, not checked in. The two envelopes show as a tie, with equal weight. The next card from the same envelope names one envelope. The app then offers "Post 2 held cards here". It never posts by itself.
3. **Suspense.** A blank envelope whose every card is in two envelopes. Its named cards wait on the Suspense line. The right page ranks the accounts it fits by named copies. Post checks in the named cards only.
4. **Past transit.** Envelopes past 14 days, oldest last. Amber at 14 days, red at 30, both from the order date. Each row has Claim filed and Refunded. A press offers Undo, and the row keeps its place.
5. **End of mail day.** Left: today's envelopes. Right: only what is not normal. A name that matches no open envelope gets one sentence and one control.
6. **Closed.** The outer screen keeps the right page, with the query on top. The tab bar sits at the bottom.
7. **Laptop.** The top page only shows, in large type. Every touch is on the bottom page.
8. **Held tall.** The same stack, but the top page has buttons again.
9. **Other tabs.** Tally, Orphaned and Ledger each spread. Ledger full width is drawn as an option.
10. **Keys.** Case A and case B, flat and laptop.
11. **Tab bar.** Three places, drawn while typing.

## Deep links

`index.html#pose=flat`, `stray`, `suspense`, `past-transit`, `end`, `closed`, `laptop`, `tall`, `tabs`, `keys`, `tabbar`.

Each option has a Hide button, and the hidden set is in the hash: `#hide=b2,bar-b`. Option ids: `tally`, `orphaned`, `ledger-spread`, `ledger-full`, `a`, `b1`, `b2`, `lap-a`, `lap-b`, `bar-a`, `bar-b`, `bar-c`. "Show hidden options" brings back those of one section.

## Choices

1. **Keyboard, case B.** Case A needs no fix. If the system keys span the fold, B1 draws in-app keys on the left page, and B2 lets the system keys span and moves the query down onto them. Gain of B1: the whole right page stays in view, and its top row offers open-order names. Loss of B1: no autocorrect, dictation, swipe typing or other keyboards. Each key needs a VoiceOver label. Keys are 42 pt wide, under the 44 pt floor. Loss of B2: the right page keeps only 3 lines, and a key row sits on the crease. Pick: build for A. If B is real, take B1 with a System keys key that switches to B2. Which case is real is unmeasured. Owner grant: yes.
2. **Keyboard, laptop pose.** About 256 pt of keys fits the 465 pt bottom page, so B probably does not happen there. The keyboard height is unmeasured. Pick: A, with B1's pad as the fallback.
3. **Tab bar.** a: under the right page, always. b: under the left page, on top of the keys. c: under the left page, under the keys, as degen does. Gain of a: it never moves, and it shows while you type. Loss of a: degen puts it on the left, so the two apps differ. Loss of b: it jumps 256 pt each time the keys move. Loss of c: you must drop the keys to change tabs. Pick: a. Owner grant: yes, because it departs from degen's ruling.
4. **Other tabs.** One rule: a tab spreads when it has a list and a thing you open from it. The list goes left and the opened thing right. Tally, Orphaned and Ledger all spread. Gain: one rule, and no text under the hinge. Loss: degen keeps Settings full width, and Ledger is MANIFEST's settings. Full width puts every Ledger row across the fold. Pick: spread. Owner grant: yes.
5. **Lost button.** The brief names Lost and Refunded. No Lost stamp exists. The stamp kinds are Claim filed, Refunded, Seller contacted, Reshipped, Partial refund and Other. Gain of Claim filed: no new kind, and the stamp rules hold as they are. Loss: "Lost" is the plainer word. Pick: Claim filed. Owner grant: yes, if you want a Lost kind.
6. **Envelope boundary.** A stray is decided by "the next card from that envelope". So the app must know when an envelope ends. "New envelope" ends it, one tap per envelope. Gain: the stray rule works. Loss: one more tap per envelope. Pick: New envelope. Owner grant: yes, because it adds a control.
7. **Suspense at day end.** A line still on Suspense at the end of the day becomes an envelope on the Orphaned tab. Gain: no new place to look. Loss: the cards wait a day longer. Pick: move to Orphaned. Owner grant: yes.
8. **Stack order.** Degen puts the left page on top when the pages stack. Here the answer goes on top and the keys below, because the keys need the bottom. Pick: answer on top. Owner grant: yes.
9. **Claim dates.** "Claim by" is the order date plus 30 days. TCGplayer counts from the delivery estimate, which the CSV lacks. So the real window can close later. The page says so in one line. Pick: keep the order date, as the lost-mail ruling does.
10. **Gold.** Gold is only the rule under each envelope header, and a double rule under a complete envelope. It is never text.
11. **Sizes and theme.** The repo lists no devices (`layout.py devices` gives `unknown`). Sizes come from the brief: inner 951×669 pt, outer 466×678 pt. The fold strip width and the keyboard heights are drawn, not measured. `tokens.json` holds one palette, so only light is drawn.

## Data

Invented. Mail day is Tue 27 Oct. 8 sellers. Seven envelopes bring 40 ordered cards, and 39 arrive. Kestrel's 14 Oct envelope is 1 Lightning Bolt short. After the pile, 19 cards ($11.07) are still out in 6 envelopes. 4 of them are past 14 days: 16 cards, $9.55. Every figure is cost only. Shipping and tax stay out.
