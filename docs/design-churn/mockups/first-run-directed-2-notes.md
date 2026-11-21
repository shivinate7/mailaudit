# First card guide: notes (directed designer 2)

Designer kind: directed. Direction: guided first card: walk through one real card, then step away.

Mockup: `docs/design/first-run-directed-2.html`. It opens from disk. Each state has a deep link:
`#c=<margin|hand>&r=<code|file>&s=<state>`. The states are `empty`, `bring`, `route`, `arriving`, `failed`,
`summary`, then `m1`, `m2`, `m3` (Margin note) or `h1`, `h2`, `tie`, `none`, `h3` (Envelope in hand), then
`away`, `ledger` and `day`. Each state draws four frames at once: Duo folded, Duo open, the large phone,
and Duo folded at AX5. A tap in any frame moves all four.

## Sources and sizes

- Duo folded: 466 x 678 pt, from the brief. `layout.py devices` printed `unknown` for this repo.
  Measurement `duo-fold-and-keyboard` gives 382 x 644 pt of safe content for the outer screen, so it
  does not match the brief. Drawn at the brief's size.
- Duo open: 951 x 669 pt, hinge strip x 455.5 to 495.5, from the brief. Nothing sits across the strip.
  The keys draw from y 405 (`duo-fold-and-keyboard`; debt `duo-keyboard-gap-unmeasured`).
- Large phone: 402 x 874 pt. **No record gives this size.** The brief, `layout.py devices`,
  `measurements/` and `scripts/screen-check.sh` name none. I chose it, so the size is unsourced.
- Status bar foot: 20 pt on the Duo (the floor in `DuoHandUITests.statusBarFloor`) and 54 pt on the
  phone (an estimate). Tab bar height: 64 pt, an estimate under the 76 pt cap in a `DuoShellUITests`
  comment. Folded and phone keyboard heights (264 pt and 291 pt) are estimates.
- Apple pages read 2026-11-21, as JSON under `developer.apple.com/tutorials/data/`, each returned 200:
  typography (the Large (default) table and the AX5 table, labelled by the page's own tab titles),
  accessibility (44x44 pt default control size, 17 pt default text size, enlarge to 200 percent),
  buttons, sheets (Cancel on the leading edge), tab-bars (it floats above content) and layout (safe
  areas). Onboarding also returned 200 and is the source of this design's spine: "Teach through
  interactivity ... people can safely test an action", and "If you let people skip ... don't present it
  again ... make sure it's easy for people to find."
- Type: chrome uses the system font. Content uses Cochin for words and Menlo for numbers, as the native
  app does (`typography-cochin-and-mono`; `Font.cochin`, `Font.mono` in `native/Manifest/Theme.swift`).
  AX5 sizes come from the AX5 table: Body 53, Large Title 60, Footnote 44, Caption 1 43. The masthead
  scales relative to Large Title (`MastheadView`, `title.text("Manifest", size: 31, relativeTo: .largeTitle)`).
- One theme, light. The native app is held to light (`design-parchment-ledger`). Colours come from
  `shared/tokens.json`. The keyboard greys are iOS chrome, kept outside the tokens as in `duo-hand-post-sender.html`.

## Items

1. **The empty first screen.** One sentence says what the app does and what fills it ("It starts with
   your order file"). One control: Bring in orders. No filters show and no tab is disabled
   (`ux-unknown-is-not-empty`). Gain: the "I don't know what this wants from me" question gets an answer
   in one line. Loss: Tally and Orphaned are empty behind their tabs until the import. Pick: yes.
   Departs from: today's native screen before a ledger exists (`RootView`, `Placeholder(title: failure ?? "Opening the ledger")`), which offers no way in. Not blocking.

2. **How orders reach the phone: the option set.** The native app has no CSV import
   (`csv-import-stays-web`). It takes its key only by URL, from `scripts/send-key.mjs --native`
   (`native-key-via-url-scheme`). So today a newcomer has **no route from their file to the phone**, and
   neither option below is today's behaviour. Each option has a row in the Bring in orders sheet and a
   hide control.
   - **Code from the computer** (id `opt-route-code`). Drop the file on the web page, which imports it as
     today (`UploadZone` in `src/app.jsx`), and which then shows a code the phone's Camera reads.
     Gain: one importer, so `parser-filters` keeps one home. Loss: it needs the computer, and the web page
     must show the device key as a code on screen. The code drawn here is a placeholder that holds no key.
     Owner grant: yes. Departs from: `native-key-via-url-scheme` (the key comes from a script) and
     `the-token-is-a-credential` (a key on screen). Not blocking.
   - **Open the file here** (id `opt-route-file`). The phone opens the file from Files or AirDrop.
     Gain: no computer step after the export. Loss: a second importer in Swift, with its own proof of
     `imports-merge-never-replace` and `parser-filters`. Owner grant: yes. Departs from:
     `csv-import-stays-web`. Not blocking.
   - Pick: Code from the computer. It keeps one importer.

3. **The reading and failed states.** Reading shows a ruled progress line and a running count. It is a
   state of its own, never empty (`ux-unknown-is-not-empty`). Failed says what happened, says nothing
   changed, and has one control that leads on ("Pick another file" or "Scan again"). The file's raw first
   row sits in a closed disclosure (`ux-machine-text-hidden`). Gain: a wrong file reads as harmless.
   Loss: none. Pick: yes.

4. **The import summary.** "412 cards came in: 63 packages from 41 sellers. Nothing was removed.
   Bringing the file in again only adds what is new." Gain: it answers "nothing in the first minute may
   erase anything" right where the person looks. Loss: the copy differs from today's web string.
   Owner grant: yes. Departs from: `csv-import-shows-a-summary` ("Imported N lines across your
   orders."). Not blocking. The "only adds" claim is true under `imports-merge-never-replace`.

5. **Three words, one meaning each.** Package: one seller's order. Card: one line in it. Envelope: the
   mail in your hand, which goes to Orphaned when it shows no sender. That matches Card in Hand's "This
   envelope" and "New envelope" (`duo-card-in-hand`) and Orphaned's "Save envelope" (`OrphanedView`).
   The repo is mixed: CLAUDE.md says Orphaned "holds a package", and `OrphanedNotice.emptyLine` says
   "record a package here". Gain: the guide teaches each word once. Loss: the Orphaned empty line still
   says "package", which the guide does not change. Owner grant: yes (one word for the Orphaned thing).
   Not blocking.

6. **Concept: Margin note** (id `opt-margin`; hide control on the page). The guide is a manila slip
   tucked into the real Packages list. It has three steps, and each moves on only through the real act:
   tap the ringed package to open it, then tick the ringed card. Step 1 picks the oldest package, because
   its mail is the most likely to be in. "Not here yet: show another" moves the ring to the next package.
   The guide never ticks a card the person does not have. On the open Duo the slip becomes the left page
   (a letter with the three words), and the live list stays on the right page. Gain: the person learns on
   the screen they will use every day, and no practice data ever exists. Loss: on the folded Duo the slip
   covers about 40 percent of the list for three taps. Pick: this concept.

7. **Concept: Envelope in hand** (id `opt-hand`; hide control). The person picks up one envelope and
   types a card from it. The answer shows its package, rings the card, and lists the cards that should
   travel with it. This brings the Card in Hand idea (`duo-card-in-hand`) to the folded Duo and the phone,
   for the first card only. A shared name draws the tie state: both packages, with no emphasis and no
   pick (`orphaned-mail-never-decides`; the shared-name rule in `duo-card-in-hand`). "Type another card"
   holds the first name as a chip. No match draws the envelope branch: nothing is ticked or filed.
   Gain: it starts from the mail in hand, which is the real job. Loss: it needs mail on day one, and on
   the folded Duo the keys leave room for only one answer line. Departs from: Card in Hand opens only on
   two pages (`PackagesTab.twoPages`). Not blocking.

8. **Fixed slot, no reflow.** The slip (188 pt) and the guide line (128 pt) keep one height across
   their steps. The ring is an inset outline, so it takes no space. A tick redraws nothing else and keeps
   the list's scroll (`no-layout-shift-under-pointer`). Gain: no row moves under the thumb. Loss: the
   slip has some empty space on short steps. Pick: yes.

9. **Step away.** Done ends the guide. The slip tucks itself toward the Ledger tab in one 520 ms
   motion, its one orchestrated moment. Reduced motion skips it and leaves the slip gone
   (`motion-reduced-leaves-it-drawn`). The ticked card stays ticked. Skip, on every step, also steps away
   and ticks nothing. Gain: the guide leaves for good after one card, as the HIG onboarding page asks.
   Loss: the tuck is a new motion, outside the `motion-timings` set. Owner grant: yes (new motion).
   Not blocking.

10. **Guide again, in the Ledger tab.** A Help group with one row, "First card guide", sits above Reset.
    It ticks nothing by itself. Gain: a person who skipped can find the guide again. Loss: one more row
    on a tab that holds the options (`ledger-tab-holds-options`). Owner grant: yes (a new Ledger row).
    Not blocking.

11. **The open Duo title page.** Before the guide, the left page shows the masthead and the three
    words, dimmed. The right page holds the empty state and the sheets, under the tab bar
    (`duo-card-in-hand`, tab bar under the right page). Gain: the left page is not blank. Loss: after the
    guide steps away, the left page shows only the masthead. I did not read how today's Packages fills
    the left page on the open Duo, so that layout is unknown here.

12. **AX5.** The bar labels stop growing at the default size, as ruled (`duo-card-in-hand`, Tab bar
    text). The sheet and guide titles are capped at 22 pt so Cancel and the title never overlap. That
    cap is my own figure, and no Apple page I read gives it. The slip takes the lower half as its own
    scroll area. At a step change, the list scrolls the ring into view only when it is hidden, never
    during a press. In Envelope in hand, the guide line scrolls with the answer. Loss: at AX5 a guide
    step needs a scroll to reach its buttons.

13. **Masthead tallies.** They are today's cells, as `Masthead.swift` builds them: cards have/total,
    packages done/n, value in/all. A tick moves them.

## Input needed

- Items 2, 4, 5, 9 and 10 are `Owner grant: yes`.
- The phone size (402 x 874 pt) is unsourced. What is the 18 Pro's point size for mockups?
- Critique questions: should the guide pick its card (Margin note) or let the mail pick it (Envelope in
  hand)? Should the first screen ask whether mail has come before it chooses the concept?
