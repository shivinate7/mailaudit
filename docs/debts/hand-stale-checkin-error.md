# A good post leaves an old check-in error showing

**What.** On Card in Hand, a failed line check-in shows `hand-checkin-error` on the envelope page. A later successful line check-in clears it, but a successful Post does not. Post writes to the store directly, and the Packages reload does not reset the error. So the old failure stays over the envelope page, and over the past-transit page, until a line check-in succeeds. The gap closes when any successful write clears the error, and a test pins a failed line tap followed by a good Post.

**Status:** open.

**Decision:** `ux-house-rules-govern`.
