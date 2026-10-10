# The sweep drops photos no envelope uses

One sweep effect covers every path that orphans a photo. Nothing deletes photos implicitly.

**Holds while:** the sweep effect in `src/app.jsx` drops blobs that no envelope references, and it waits while an undo or a composer is open.

The sweep covers discard, assign-away, restore, and a cancelled composer. It drops any blob that no envelope references.

It is held off while an undo is live, or while a composer is open. Either one can bring photo ids back.

The pile shows a line such as "N photos stored · X of Y used on this device". The figures come from real `navigator.storage.estimate()` numbers.

## See also

- `label-photos-downscale-to-2000px` — the photos the sweep keeps or drops.
- `photos-in-git-are-permanent` — the sweep stops at the device, not at git.
- `photo-rules-fails-quietly` — the photo rules that the sweep relies on.
- `orphaned-mail-never-decides` — the limit on what an orphaned envelope may decide.
