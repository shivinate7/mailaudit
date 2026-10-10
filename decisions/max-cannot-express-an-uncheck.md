# `max` on received cannot express an un-check

**Status:** open.

The merge takes the higher received count per key, on purpose, so two devices never lose a check-in by racing. That same rule cannot express clearing a check-in. Clearing on one device, while the other device still holds a stale higher count, brings the card back checked after a merge. It is visible and one tap to fix, and the alternative costs a schema change that a phone-only workflow rarely needs.

## See also

- `merge-rules-only-add` — the design rule this gap is a known exception to
- `stamp-removal-writes-a-tombstone` — the pattern that would fix this if adopted
- `imports-merge-never-replace` — the wider merge philosophy this sits inside
