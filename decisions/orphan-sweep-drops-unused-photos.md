# The sweep drops photos no envelope uses

One sweep effect covers every path that orphans a photo. Nothing deletes photos implicitly.

**Holds while:** the sweep effect in `src/app.jsx` returns early when `undo`, `composing` or `syncBusy` is set.

The sweep covers discard, assign-away, restore, and a cancelled composer. It drops any blob that no envelope references.

It is held off while an undo is live, or while a composer is open. Either one can bring photo ids back. The sync guards are in `photo-sweep-two-guards`.

The pile shows a line such as "N photos stored · X of Y used on this device". The figures come from real `navigator.storage.estimate()` numbers.

## See also

- `label-photos-downscale-to-2000px` — the photos the sweep keeps or drops.
- `photos-in-git-are-permanent` — the sweep stops at the device, not at git.
- `photo-ids-restore-keep-if-known` — a stripped id lets the sweep delete its blob.
- `orphaned-mail-never-decides` — the limit on what an orphaned envelope may decide.
