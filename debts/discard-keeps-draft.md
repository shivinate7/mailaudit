# Discard does not end a composer draft

**What.** `discardEnvelope` in `src/app.jsx` never clears the draft. The draft keeps its own photos until a reload. The gap closes when Discard ends the draft and a test pins it.

**Status:** open.

**Decision:** `orphan-entry-takes-one-input`.
