# Ask clear of the Find band: notes

Mockup: `docs/design/step8-fix-ask-clear.html`. Step 8 fix, PR 238, on `step8-amend` at e7769bd5. Designer kind: informed.

Deep links: `#o=flip`, `#o=scroll`, `#o=margin`, `#o=clamp`, `#o=today`; `s=stamp`, `s=bulk`; `d=375`, `d=fold`, `d=duo`; `x=normal`, `x=ax3`, `x=ax5`; `t=light`, `t=dark`. Join them with `&`, for example `#o=flip&s=bulk&x=ax5&t=dark`. With no hash, every option shows, and `prefers-color-scheme` sets the theme. Hide controls: "Hide hang above", "Hide scroll on arm", "Hide end margin", "Hide clamp" and "Hide today". Focus ids: `focus-flip`, `focus-scroll`, `focus-margin`, `focus-clamp` and `focus-today`. Each one is the armed ask in that option's first 375 pt frame. The end margin's first frame arms the last card, so its picture differs from today's.

## Sources

- Code on e7769bd5:
  - `native/Manifest/StampViews.swift`: `HangingAsk` at lines 108 to 118, `AskPanel`, `StampSection.buttons` at line 354, the 4 s lapse at line 197, and the focus-only `scrollTo` at lines 275 to 278.
  - `native/Manifest/BulkViews.swift`: `BulkRow` at line 53, with its lapse at line 59.
  - `PackagesView.swift:73`, `TallyView.swift:75`, `DuoSpine.swift:78` and `MastheadScreen.swift`.
  - The tests: `ScreenKit.tap` at `ScreenKit.swift:47-51`, `PackageStampUITests` and `PackageBulkUITests`.
- Run logs in the session scratchpad:
  - `e_a_full.txt` and `e_d_full.txt` are jobs a and d of run 43894310154.
  - `c_full.txt` is a run of 2026-11-16 14:17Z. That is after 070ad699 (the band) and before e7769bd5.
  - `b/b.txt` is a run of 2026-11-15 22:40Z, before the band.
- The invariant `no-layout-shift-under-pointer`, and notes item 17 in `step8-packages-tally-filters-notes.md`.
- Apple pages, read 2026-11-16. Each JSON answered 200.
  - `accessibility`: the 44x44 pt default control, the 28x28 pt minimum and the 11 pt minimum text.
  - `buttons`: a hit region of at least 44x44 pt.
  - `layout`: respect the safe areas.
  - `typography`: Caption 1 is 12 pt at Large, 32 pt at AX3 and 43 pt at AX5. Body is 17, 40 and 53 pt.

## Items

1. **The cause, from the code.** Found, not a choice.
   - `HangingAsk` draws the ask as an overlay offset by the row's height plus 4 pt (`StampViews.swift:116`). The ask takes no layout space.
   - Nothing scrolls when an ask arms. `scrollTo` runs only when the note field takes focus (`StampViews.swift:275-278`).
   - So with the row near the list's bottom edge, the ask hangs past that edge. It stays in the tree, but it is not hittable.
   - `ScreenKit.tap` then calls `reveal` (`ScreenKit.swift:50`), which drags the list. The 4 s lapse ends the ask during that drag, so the tap meets "No matches" or "Activation point invalid".
   - `c_full.txt` shows both paths:
     - Try 1: a drag at t = 122.2 s, and the ask gone after it.
     - Try 2: the ask found about 4 s after the Remove tap, and invalid about 5 s after it.
   - The brief's premise needs a correction. `b/b.txt`, from before the band, already shows "stamp-ask-confirm:A1::Alpha Cards is missing". Before the band, the ask hung under the pill and the tab bar instead. So the band moved the edge. It did not start this failure class.
   - The b and c job logs of run 43894310154 are not in the scratchpad, so that run's stamp and bulk failures are unknown to me.
   - Job d of that run passed `Step7DesignShotsUITests` "clear armed". That test reveals the whole card before it arms, which fits the edge cause.

2. **What the invariant allows and forbids.** `no-layout-shift-under-pointer` forbids:
   - a row moving under the thumb;
   - a card changing height on the tap;
   - a checked row hiding under the tap;
   - a re-sort while checking;
   - a package auto-collapsing mid-interaction;
   - a remote reply landing under a press.

   It allows the page to scroll to keep a row in place, and it counts hover and scroll as no press. The allowance for a deliberate tap that opens the taller editor is a test reading (`PackageStampUITests.swift:41-44`), not the invariant.

3. **Hang above.** The pick. New.
   - What: the ask hangs below its row when it fits there. When it does not fit, it hangs 4 pt above the row. The side is chosen once, at arm, and kept until the ask disarms.
   - Gain: no scroll and no move. The finger stays on Remove or Clear. One home serves both asks (`building-one-home-per-capability`). It needs no audit skip.
   - Loss:
     - The flipped ask covers the row above it. That is the note field for the stamp ask, and the stamp slot or the across line for the Clear ask. It is drawn over them, as it already covers the bulk row today.
     - At AX5 on Tally, the flipped ask may reach past the card's top.
     - On Tally, the flipped Clear ask covers the row's name. Its confirm, "Tap again to clear 1 check-in", does not name the product. Only its hint does ("of Brainstorm"). See Input Needed.
   - Pick: yes. Owner grant: no. It changes no ruling, and the invariant asks for it.
   - Spec, `native/Manifest/StampViews.swift`, `HangingAsk`:
     - Read the visible rect: `.onGeometryChange(for: CGRect?.self) { $0.bounds(of: .scrollView) } action: { visible = $0 }` on `content`.
     - Read the ask's own height with `onGeometryChange` on `ask`.
     - Free room, in the row's local space:
       - `below = visible.maxY - cover.bottom - (rowHeight + 4)`
       - `above = -visible.minY - cover.top - 4`
     - At arm, once the ask's height is known, set `up = askHeight > below && askHeight <= above`. Clear `up` on disarm. Never change it while armed.
     - Offset the ask: `ask.offset(y: up ? -(askHeight + 4) : rowHeight + 4)`.
     - Until `up` is set, draw the ask at `opacity(0)` and `accessibilityHidden(true)`, so it never shows on the wrong side.
     - With no `visible` (no enclosing scroll view), keep today's below.
   - Spec, the cover:
     - Add `@Entry var askCover: EdgeInsets` next to `HangingAsk`. Its default top is 47, the running-head slot (`MastheadScreen.slot`, `RunningHead.height + 1`), and its default bottom is 0.
     - Set the bottom where a margin already sits:
       - `DuoSpine.swift:78`: `DuoBarMetrics.height` when `custom`.
       - `PackagesView.swift:73`: `FindPillMetrics.duoRoom` when `duoPillShown`.
       - `TallyView.swift:75` (`detail`): `FindPillMetrics.duoRoom`.
     - Use the same expression as the margin on that line, so the two cannot drift.
     - On one page, the bottom is 0, because the scroll view already ends at the band (`findPill`).
   - What it does:

     | Size | Stamp ask | Clear ask |
     | --- | --- | --- |
     | 375 pt, normal | Flips above, over the note field and the chips | Flips above, over Brainstorm's head |
     | AX3 | Both stacks flip, inside the list's free span | Same |
     | AX5 | Both stacks flip, inside the list's free span | Same |

     - The folded Duo flips above the edge at 527.
     - The open Duo's detail flips above 529, the top of the pill's room.
     - The AX heights are drawn to fit and are not measured.
   - Builder checks, all unmeasured:
     - `bounds(of: .scrollView)` returns the visible rect for a row inside a `LazyVStack`.
     - No frame draws the ask on the wrong side.
     - At AX5, a flipped Tally ask that passes the card's top grows the `tally-row` union frame upward. The frame tests would read that as a move.

4. **Scroll on arm.** New. Not picked.
   - What: arming calls `scrollTo(askID, anchor: .bottom)`. The id has to sit on a view at the ask's laid-out place, because `offset` does not move layout.
   - Gain: the ask always shows below.
   - Loss: the list moves under the finger that just tapped, by 58 pt at 375 pt. The ask then lies where Remove or Clear was. On the Clear ask that spot is the confirm, so a quick second tap clears the check-ins. That is the failure the invariant names: "A row moving under the thumb".
   - Pick: no.

5. **End margin.** New. Not picked.
   - What: `contentMargins(.bottom, askHeight)` at the list's end.
   - Gain: the last card's ask has room.
   - Loss: only the last card gains, and only after a scroll. Alpha Cards and Brainstorm are first in the fixture, so the failing asks stay cut off.
   - Pick: no.

6. **Clamp.** New. Not picked.
   - What: the ask slides up just enough to fit above the edge.
   - Gain: no scroll.
   - Loss: it covers its own row, Remove or Clear included. A repeat tap lands on the ask, and on the Clear ask that is the confirm.
   - Pick: no.

7. **Today.** Drawn for comparison. The ask is cut off at the list's edge. On the open Duo it sits under the pill.

8. **Tests the pick changes.** These are outside this folder; a test-author or builder owns them.
   - `PackageStampUITests.swift:242-243` and `PackageBulkUITests.swift:259-260` assert "hangs below its row". Re-point both: below, or above when the edge leaves no room below, and never over its own row.
   - New red case: reveal the row so it ends 8 pt above the band's rule, arm it, and in one snapshot assert the ask is hittable, lies between `listTop` and `listBottom`, and no row frame moved.
   - The 4 s lapse against a slow runner stays a test-side race. `b/b.txt` shows the editor taking about 15 s to appear. This is unmeasured.

## Departs from

- `src/app.jsx`: the web's ask always hangs below. The flip is native only, where the list ends at a band. Not blocking.

## Unmeasured

- Every ask height and every AX type size in the mockup is drawn to fit.
- The 375 pt band figures (edge 719, 720 and 712) are notes item 17's, from the brief.
- The top safe area is a guess of 54 pt.
- Whether the re-pointed stamp and bulk tests go green is unknown. The proof is a run of `PackageStampUITests` and `PackageBulkUITests` on the build.

## Critique

Skill `impeccable` (`critique`) was run on 2026-11-16 as a design review alone. The target is native, so it had no detector and no snapshot. The launcher did not run, and no PRODUCT.md or DESIGN.md exists.

- Fixed: every verdict line read red, because "Nothing moved." matched the colour test. Each verdict now sets its own colour.
- Fixed: the AX frames gave the flip no room above, because their crop was shorter than the list. Room now counts from the list's top under the running head.
- Fixed: the "last tap" ring sat on the ask, not on Remove or Clear. It now reads only the row's own buttons.
- Fixed: "Scroll on arm" said a second tap removes the stamp. On the stamp ask the finger lands on the ask's Cancel. Only the Clear ask puts the confirm there.
- Kept: the AX5 frames are tall. That is the true span the flip needs.
- Fixed: the AX Tally frames showed blank space above the card with no reason given. The captions now say it is the masthead, not drawn.
- Open (P2, outside this folder): the flipped Clear ask covers Brainstorm's name, and its confirm does not name the product. Naming the scope in the confirm ("Tap again to clear 1 check-in of Brainstorm") would change `BulkRow` and the web's wording.

## Input Needed

- Item 3: should the flipped Clear ask name its product, since it covers the row's name? This is a wording change on both clients. Owner grant: yes. Not blocking.
- `check_ios_mockup.py`: one fault, `system-font` on Cochin. Cochin is the app's content font (`typography-cochin-and-mono`), the same fault as the step 8 mockups.
