# A New envelope control ends the current envelope

Kind: build

Plan: docs/decisions/duo-card-in-hand.md#ruled (native)

The New envelope control ends the current envelope. It belongs to the iPhone Duo view in `duo-card-in-hand`. Source: owner, round 2 item 26 (option a), 2026-10-27 14:26 CDT, on the waiting page.

## Ruled

- The New envelope control ends the current envelope.
- A name held because two envelopes share it is decided by the next card from the same envelope.
- Nothing is checked in until the user taps to post.
- A held name still undecided when New envelope is tapped moves to a visible strays list. It saves nothing and no longer decides. Default, not owner, the same as held cards staying held when Card in Hand closes.
- Default, not owner: a name posted after it was released as a stray leaves the strays list. A stray checked in by a line tap stays listed as released.

**Holds while:** `HandModel.newEnvelope` moves the held name to `strays`, and the round 2 answer on item 26 stands.

## See also

- `duo-card-in-hand` — the Duo view that holds this control.
