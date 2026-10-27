# Mail day on the iPhone Duo: five blind concepts

Open `index.html` from disk. It shows all five, open flat, side by side.
Each concept page also draws the closed outer screen and the laptop pose.

Designed blind on 2026-10-26. The only inputs were the Duo device notes in
degen's plan, section 4.6.2, and this repo's `shared/tokens.json`.

## The five

1. **Card in Hand.** The card you hold is the search; the envelope is the answer.
2. **Account Book.** Each seller is an account that owes you cards; balance the book to zero.
3. **Sorting Frame.** Find an envelope by thickness and age, in a wall of pigeonholes.
4. **The Letter.** Today's mail is written as a letter; you answer by touching its words.
5. **Fold to Seal** (wild). The phone is the envelope; closing it seals what came.

## Ranking

1. **Card in Hand.** It solves the hardest job, matching, with one typed name per envelope. Blank envelopes mostly stop being special.
2. **Sorting Frame.** Its fold splits in transit from past usual transit. Thickness is a weak signal when sellers pack differently.
3. **Account Book.** It answers the money question best. It reads as accounting, not as opening mail.
4. **The Letter.** It is warm and clear for a small day. Prose does not scale to 40-card orders.
5. **Fold to Seal.** It is memorable but slow: one fold per envelope, with cards in hand.

## Pick

**Card in Hand.** Two parts are worth taking from the others.
Take the Sorting Frame's past-transit page for lost mail.
Take the Account Book's Suspense line for a blank envelope that no card decides yet.

## Deep links

Each concept page takes `#pose=flat`, `#pose=closed` or `#pose=laptop`.
`#embed` shows the flat pose alone. `index.html#hide=the-letter,fold-to-seal` hides concepts.

## Choices

1. **One shared mail day.** All five draw the same six sellers and one blank envelope. Gain: you compare ideas, not data. Loss: no concept shows a 300-card day. Pick: shared.
2. **Light only.** `tokens.json` holds one palette. Gain: no invented colours. Loss: no dark check. Pick: light. Owner word: yes, if a dark theme ships.
3. **Claim window.** "Claim closes Friday" assumes a window of about 28 days. Gain: lost mail has a deadline. Loss: the length is invented. Pick: owner sets it. Owner word: yes.
4. **Usual transit, 10 days.** The Sorting Frame's fold sits at 10 days. Gain: late reads at a glance. Loss: invented. Pick: owner sets it. Owner word: yes.
5. **Fold strip and hinge sensor.** The fold strip width and a hinge-angle reading are unmeasured. They are drawn as labelled sketches. Pick: measure on the simulator before a build.
6. **The pick.** Which concept goes forward, alone or with the borrowed parts. Owner word: yes.

Data is invented. Seller names, order ids and prices are not real.
