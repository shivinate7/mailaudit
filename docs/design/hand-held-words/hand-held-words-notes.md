# Held card words: notes

Mockup: `docs/design/hand-held-words/hand-held-words.html`. Open it from disk. Deep links: `#s=keep-both`, `#s=one-word`, `#s=one-word-no-title`, `#s=folded`. With no hash, every state shows. Each option has a Hide button; "Show hidden options" brings them back.

Waiting page item 80, `hand-held-words`. Decision `duo-card-in-hand` (Card in Hand on the Duo). The held line is part 5 of `docs/design/duo-hand-gaps.html` (Card in Hand gaps mockup, PR 237).

Designer kind: informed. The brief named no kind.

## Frame

- `layout.py devices` prints `unknown` for this repo. The open Duo is drawn at 951 x 669 pt, the size the brief and the earlier `duo-hand-*` mockups use. Fold 40 pt at 455.5 pt; keys panel from y 405 pt (`duo-fold-and-keyboard`). The folded frame comes first and is drawn as "no change", because Card in Hand opens only on two pages (`PackagesTab.twoPages`).
- Light theme only: the native app is held to light (`UIUserInterfaceStyle: Light`). There is no `t=dark`.
- Tokens from `shared/tokens.json`. Cochin sets words and Menlo sets numbers (`typography-cochin-and-mono`).
- Apple pages read on 2026-11-18, each answered 200 through `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`: typography (iOS default 17 pt, minimum 11 pt), accessibility (controls 44x44 pt by default, 28x28 pt at least), layout (respect the safe areas). No control is added; no new text is under 11 pt.
- `python3 ~/.claude/lint/check_ios_mockup.py` exits 1 with one fault, `system-font`, on the Cochin declarations. The same fault shows on main's `duo-hand-gaps.html`. Cochin is the app's ruled face, so the page keeps it. See Out of scope.

## Built words today (`native/Manifest/HandScreen.swift`)

- Chip in the search field: "1 held" (`heldChip`).
- Box: title "Suspense", the card name, "Not checked in." (`notice(id: "hand-held", ...)`).
- Offer: "Your held card came with this envelope. Nothing is checked in until you post." and "Post N cards here, M held" (`offerContent`).
- The held line has no mark today. Part 5 of the gaps mockup adds a manila tint and "on the Suspense line".

## Choices

1. **Keep both words, fix their roles.** State `keep-both`, focus `#focus-keep-both` (the right page).
   - What: "held" names the state (chip, offer, Post). "Suspense" names the place (box, line). The line reads "on the Suspense line". The box keeps its built title "Suspense".
   - Gain: the tint is never the only sign, and the line still says where the card waits when the box is under the keys.
   - Loss: two words on screen for one card.
   - Pick: this option. It keeps the built strings and adds only part 5.
   - Owner grant: yes (the item asks the owner).

2. **One word only.** The option text does not name the word that goes. Its loss names two forms, so both are drawn:
   - 2a, state `one-word`, focus `#focus-one-word` (the right page): the line loses its words and keeps the tint only. The box keeps "Suspense". This is the option's card picture.
   - 2b, state `one-word-no-title`, focus `#focus-one-word-no-title` (the box): the line keeps "on the Suspense line" and the box drops its title.
   - Gain: the label shows once.
   - Loss: 2a leaves the tint as the only sign on the line. 2b leaves the box with no name.
   - Neither form changes the chip, the offer or Post, which keep "held". The item's goal covers the line and the box only.
   - Owner grant: yes.

3. **Box title "Suspense line".** Not drawn. One name per thing would retitle the box from "Suspense" to "Suspense line".
   - Departs from: the built title "Suspense" (`HandScreen.swift`, `notice(id: "hand-held", title: "Suspense", ...)`).
   - Gain: the box and the line use the same name for the place. Loss: a longer title in a 10.5 pt label.
   - Pick: keep "Suspense". Not blocking.
   - Owner grant: yes.

## Out of scope, for the orchestrator

- The first option says the repo glossary records each word's role. The repo has no glossary file. A record must hold it.
- `check_ios_mockup.py` faults the repo's Cochin face (`system-font`). It may be a false alarm for a repo with a ruled custom face.
- The built micro labels are 10.5 pt (`HandScreen.micro`), under the 11 pt iOS minimum. The critique's detector flags them here too.
