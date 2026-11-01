---
paths:
  - "src/app.jsx"
  - "src/view-rules.mjs"
---

# Screens

Holds the screen rules: the views, stamps, house UX, the ruled head, motion, and the masthead and palette.

## The three views

Packages, Tally and Orphaned read one check-in map. These records say what each view may and may not decide.

- `cost-basis-excludes-ship-and-tax` — Cost basis excludes shipping and tax.
- `unit-rate-is-not-the-position` — Unit rate and position differ on purpose.
- `tally-pools-on-the-exact-name` — Tally pools by exact product name.
- `search-filters-inside-package` — A search result needs a way back.
- `a-reveal-ignores-hidedone-too` — A reveal ignores hideDone too.
- `order-id-button-stops-propagate` — Order id controls stop their clicks.
- `lost-mail-flags-use-order-date` — Lost-mail flags count from the order date.
- `orphaned-colours-by-meaning` — Orphaned uses colour for the same meanings.
- `undo-removes-only-its-delta` — Undo subtracts its own delta, not a snapshot.
- `three-views-share-one-switch` — The bar's working views share one check-in state.
- `search-hide-keep-tally-counts` — Search and hide-received never change shown Tally counts.
- `tally-row-lists-its-copies` — A Tally row lists every copy it counts.
- `tally-sort-keys-are-six` — The Tally view sorts on six keys.
- `package-sort-swaps-with-view` — Package sort swaps with the view.
- `packages-group-by-order-seller` — Packages group by order and seller.
- `outstanding-value-per-level` — Each level states what is still outstanding.
- `canceled-orders-leave-the-list` — Canceled orders leave the list, not the record.
- `orphan-entry-takes-one-input` — Recording an envelope takes one input.
- `new-envelope-ends-an-envelope` — The New envelope control ends the current envelope.
- `candidates-skip-date-filter` — Candidates ignore the date filter and canceled orders.
- `assign-checks-recorded-cards` — Assigning an envelope checks in only its recorded cards.
- `shrunk-envelope-gets-fresh-stamp` — A partial assignment restamps the envelope.
- `envelope-names-match-normname` — Envelope names match after normalizing.
- `csv-import-shows-a-summary` — A CSV import shows a summary.

## Order stamps

One stamp per package, set by hand. A refund takes the package out of every count.

- `one-stamp-per-package` — One stamp per package, latest wins.
- `stamp-removal-writes-a-tombstone` — Removing a stamp writes a tombstone.
- `a-refund-leaves-every-count` — Refunded packages leave every count.
- `stamped-package-hides-lost-flag` — A stamp hides the lost-mail warning.
- `stamp-band-opens-the-editor` — The stamp band is the control.
- `stamped-filter-on-the-pipeline` — The stamped filter sits on the normal pipeline.

## House UX

House UX rules that govern the screens. Read these before changing a screen.

- `ux-house-rules-govern` — MANIFEST screens follow the house UX rules.
- `spacing-on-4px-grid` — Spacing moves to a 4px grid with an 8px card radius.
- `phone-nav-is-bottom-bar` — Phone navigation is a bottom glass bar, built in L11a.
- `ledger-tab-holds-options` — The Ledger tab holds the options, built in L11b.

## The ruled head

The control region is the masthead's own vocabulary continued. Read these before changing a control there.

- `ruled-head-resume-is-reopening` — A resume counts as reopening.
- `ruled-head-masthead-vocabulary` — The ruled head continues the masthead.
- `ruled-head-one-advisory-entrance` — One advisory line leads to the Sync group.
- `ruled-head-panels-carry-no-fill` — Overlay panels take the paper fill.
- `ruled-head-showing-unreceived` — Showing starts on unreceived every load.
- `ruled-head-hand-elapsed-forward` — Hand the elapsed time forward, never re-derive it.
- `ruled-head-range-picked` — The custom date range is picked, not typed.
- `ruled-head-stale-clock-agreement` — The staleness clock measures agreement, not writes.
- `date-filter-spans-ledger-views` — The date filter applies to both ledger views.
- `action-row-is-ruled-cells` — The action row is retired, and its cells are ruled rows.
- `armed-reset-takes-the-row` — An armed Reset arms in place.
- `disclosure-cells-underline-value` — Cells that open something underline their value.
- `history-sync-close-each-other` — History and Sync close each other.
- `upload-zone-opens-when-empty` — The upload zone opens only on an empty ledger.
- `sync-line-toggles-its-panel` — The sync line is also the panel's way out.
- `merge-is-the-primary-sync-action` — Retired 2026-10-12: Merge left the UI.
- `sync-panel-is-two-column-grid` — The sync panel is server status, last sync and a key box.
- `sync-particulars-ruled-values` — Sync particulars are ruled label and value pairs.
- `token-field-is-sixteen-pixels` — The key field is 16px to stop iOS zoom.

## Motion

The register is stationery, not software. One rule governs all of it: nothing may reflow.

- `motion-a-card-opens-in-order` — A card lays its rows down in order.
- `motion-completed-package-gilded` — A completed package is gilded, not badged.
- `motion-collapse-not-animated` — Collapsing a card runs with no animation.
- `motion-disclosure-panels-arrive` — Disclosure panels overlay the list and do not push it.
- `motion-stationery-not-software` — Motion reads as stationery, not software.
- `motion-method-side-by-side-proof` — Each motion was chosen by looking, not by reading.
- `motion-nothing-may-reflow` — No animation can cause a reflow.
- `motion-reduced-leaves-it-drawn` — Reduced motion leaves every animation at its final frame.
- `motion-remeasure-not-rereason` — Motion timing claims need a real browser, not a test.
- `motion-the-check-tick-is-written` — The check tick is written, not popped in.
- `motion-letterhead-composes-once` — The letterhead composes itself once per load.
- `motion-masthead-bar-sweeps-once` — The masthead bar turns green a beat late.
- `motion-the-stamp-lands` — The RECEIVED stamp lands, it does not appear.
- `motion-the-switch-is-one-object` — The active view moves one object, not three lights.
- `motion-use-just-became` — useJustBecame guards every celebration animation.

## The masthead, the cards and the palette

Where the page holds its shape, and where every colour comes from.

- `card-tally-row-counts-first` — The Tally row degrades sets first, never counts.
- `card-the-action-row-is-reserved` — The card action row reserves its tallest height.
- `card-the-bar-is-out-of-flow` — The package progress bar sits out of flow.
- `design-form-controls-no-inherit` — Form controls need their own font rule.
- `design-parchment-ledger` — The palette is parchment ledger.
- `design-view-switch-equal-thirds` — The view switch is retired. Its chrome rules still hold.
- `masthead-is-one-letterhead` — The masthead is one letterhead, not stacked boxes.
- `masthead-sizing-by-clamp` — Masthead sizing uses clamp, never breakpoints.
- `masthead-tallies-unequal-thirds` — The tally cells are not sized equally.
- `masthead-running-head-sticky` — The running head pins by opacity, never by height.
- `masthead-save-slot-reserved` — The save indicator sits in a reserved, fixed-size slot.
- `palette-gold-is-ornament-only` — Gold is ornament only, never text.
- `palette-inksoft-and-manilaink` — inkSoft and manilaInk are checked against the right surface.
- `palette-silver-stays-cool` — Silver must stay a cool grey.
- `palette-theme-color-tracks-paper` — The browser chrome colour must track the paper token.
- `palette-tokens-contrast-floor` — Every colour token meets a contrast floor.
- `audit-skips-measured-flags` — The native audits skip only named, owner-ruled findings.
- `progress-bar-accent-then-green` — The progress bar is accent, then green at 100%.
- `typography-cochin-and-mono` — Cochin sets words, monospace sets numbers.
