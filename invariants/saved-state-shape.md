# Saved-state shape is fixed

The saved ledger has one named shape, with items, received, envelopes, stamps, and view preferences as its fields. A new persisted key must be optional and defaulted, so an older save keeps loading. Adding a persisted key means touching five sites in the app, plus a sixth in the merge rules. Miss one of these sites, and a stale value silently survives a save or a merge, then gets pushed to the other device.
