# The doMerge comment says an apply strips photo ids

**What.** The comment above `pullPhotos` in `doMerge` (`src/app.jsx`, lines 4319 to 4322) says that an apply before the photo download would strip every id the other device sent. The decision says a merge and a server apply keep every id, and that the order only serves the photo. The comment contradicts the decision.

**Status:** open. A builder rewrites the comment to match the decision. The fix is a code comment, so it is not a record change.

**Decision:** `pull-fetches-photos-before-apply`.
