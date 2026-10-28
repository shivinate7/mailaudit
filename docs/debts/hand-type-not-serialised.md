# Card in Hand does not serialise typed names

**What.** `HandModel.type()` asks the view rules for a reply and then sets the held card. Two quick calls, or a call that races a post, can apply a stale reply. The held card can then come back after a post cleared it, and the next card can offer a copy the user never held. The user still has to tap post, so nothing saves on its own.

**Status:** open. Serialise type calls in the duo-hand-screen lane, with a test that interleaves type and post.

**Decision:** `new-envelope-ends-an-envelope`.
