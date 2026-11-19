# Orphaned composer skips: mockup notes

Mockup: `orphaned-composer-skip.html`, for owner page item 84 (decision `audit-skips-measured-flags`, the audit skips only measured false flags). Deep links: `#s=today`, `#s=named-skips`, `#s=skip-nothing`; no hash shows all three. Light only: `native/project.yml` sets `UIUserInterfaceStyle: Light`.

## Ratios (computed from `shared/tokens.json`, WCAG relative luminance)

| Part | Paint (`OrphanedPaint`) | Pair | Ratio | Floor |
|---|---|---|---|---|
| "1 card" count, Menlo 11 | `note` = inkSoft | #6E6379 on card #FCF6EA | 5.24:1 | 4.5:1 |
| Ready Save text, Menlo 11.5 bold | `saveReadyText` = card | #FCF6EA on ink #332E3F | 12.17:1 | 4.5:1 |
| Ready Save fill against the card around it | `saveReadyFill` = ink | #332E3F on #FCF6EA | 12.17:1 | 3:1 |

Floors: Apple HIG Accessibility, contrast table (4.5:1 text, 3:1), read 2026-11-18 as JSON, answered 200.

## Items

1. **Every picture draws the same composer pixels.** Neither option changes a colour, size or frame, so only the audit overlay and the verdict differ. Gain: the picture tells the truth. Loss: the two option pictures differ only in the overlay. Pick: keep.
2. **Named skips: the count gets an id.** Drawn as `orphaned-count`. The debt gives that name only as an example. Gain: a skip can name it. Loss: none on screen. Pick: `orphaned-count`, owner or builder may rename.
3. **Named skips: where the skip lives.** `testAccessibilityAuditOrphanedComposerReady` passes the shared `skipMeasuredContrastFlags` (`native/ManifestUITests/AuditSkippingTabBarUITests.swift`, `isMeasuredContrastFlag`), where `orphaned-cancel` already sits. The item says "the composer audit". Adding the two ids to the shared list skips them in any audit, but both ids exist only on the composer. Gain: one home, as `building-one-home-per-capability` asks. Loss: the scope is wider on paper than the item text. Pick: the shared list. Owner grant: yes (the item's own grant covers adding the skips; this names where).
4. **Skip nothing.** No change. The debt `orphaned-composer-contrast` stays open. Pick: none; the item's coordinator pick is named skips.
5. **Drawn at 390 pt.** `layout.py devices` prints `unknown` for this repo, so the picture is drawn at the page's default width, `drawn` unset. The audit ran on the iPhone 18 Pro (402 pt); the 12 pt does not change any colour or ratio.
6. **Fixed picture height, 840 pt.** Cochin and Menlo are missing off a Mac, so the box has a fixed height and the card's reserved `size` holds. It fits the card's 480 px box at the 221.8 px card width.

## Unsettled by the code

- Whether the audit still names the flagged count's element once it carries an id, so the skip matches it. Unmeasured.
- The id name for the count (item 2).

## Checks

- `check_ios_mockup.py` exits 1: no Duo frames (no Duo size is written for this repo), and Cochin in the composer. Cochin is the app's content font (`native/Manifest/Theme.swift` `cochin`), so that second finding is a possible false alarm.
