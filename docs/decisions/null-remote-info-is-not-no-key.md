# A null remote status is not a missing key

A null `remoteInfo` means that the status has not loaded yet. It does not mean that the device has no key.

**Holds while:** `syncBroken` in `src/app.jsx` returns null while `remoteInfo == null` is true.

`remoteInfo` stays null until its effect runs. That is one commit after first paint. If null read as `"no-key"`, a configured device would flash the manila banner on every cold start.

This follows the rule that `peek` and `listPhotos` follow. "I have not looked" is not "all clear". The same holds in the other direction too.

## See also

- `peek-is-three-valued` — the same rule for the remote sha.
- `listphotos-is-three-valued` — the same rule for the photo listing.
- `ruled-head-one-advisory-entrance` — the line that this status feeds.
