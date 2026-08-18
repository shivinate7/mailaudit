/* The photo-sync decisions worth being sure about, pulled out as pure functions
   so they can actually be asserted on — the same trade `remote-rules.mjs` and
   `b64.mjs` make, and for the same reason: entry.jsx mounts React on import and
   is unreachable from the harness, so anything that lives there is untested by
   construction. Fetch plumbing is fine to leave uncovered. These are not,
   because every one of them fails *quietly*.

   The naming half is imported only by entry.jsx. app.jsx imports `photoPlan`
   and nothing else, so it never learns what a photo file is called — the same
   split that keeps the string "ledger.json" out of app.jsx today. */

/* A photo id carries no extension (see newPhotoId in app.jsx) and the stored
   blob is not reliably a JPEG: shrinkImage resolves the ORIGINAL File on three
   paths — already small enough, no canvas context, and decode failure — so a
   PNG screenshot really can reach IndexedDB unmodified. The type therefore has
   to survive in the filename; it cannot be recovered from the response, whose
   Content-Type is GitHub's media type rather than the file's own. */
const EXT = [
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/heic", "heic"],
  ["image/heif", "heif"],
  ["image/gif", "gif"],
];
const FALLBACK = ["application/octet-stream", "bin"];

export function photoName(id, mime) {
  const hit = EXT.find(([m]) => m === String(mime || "").toLowerCase());
  return `${id}.${(hit || FALLBACK)[1]}`;
}

/* Returns null for anything that isn't one of ours, so a stray README or a
   file some other tool dropped in the directory is ignored rather than
   mistaken for a photo whose blob is missing. */
export function photoIdFromName(name) {
  const m = /^(pho-[A-Za-z0-9-]+)\.([A-Za-z0-9]+)$/.exec(String(name || ""));
  if (!m) return null;
  const known = EXT.some(([, e]) => e === m[2].toLowerCase());
  return known || m[2].toLowerCase() === FALLBACK[1] ? m[1] : null;
}

export function mimeFromName(name) {
  const ext = String(name || "").split(".").pop()?.toLowerCase();
  const hit = EXT.find(([, e]) => e === ext);
  return (hit || FALLBACK)[0];
}

/* A photo path is written exactly once and never updated, so a PUT that lands
   on an existing path is SUCCESS, not a conflict — the bytes are already where
   we wanted them.

   Keyed on the raw status and message, NOT on the code classifyStatus returns.
   That function folds 409 and any sha-mentioning 422 into the same "conflict",
   and the two mean opposite things here: 422 "sha wasn't supplied" is "already
   there, carry on", while 409 is GitHub telling us we are writing too fast and
   must back off. Collapsing them would either re-upload forever or silently
   treat a throttle as a completed upload. */
export function isAlreadyThere(status, detail) {
  return status === 422 && /["']?sha["']? wasn't supplied/i.test(String(detail || ""));
}

/* The whole sync algorithm: a set difference over ids. Photo files are
   immutable and content-addressed by id, so there is nothing to merge and no
   sha to track — whoever holds a photo is the only one who ever writes it.

   `remote` is three-valued on purpose. A 404 on the photo directory means "not
   there yet" on a public repo and "your token cannot see this" on a private
   one — entry.jsx already documents that trap for the ledger. Collapse it to an
   empty set and a device that has merely not been given a key concludes that
   every photo it owns is LOST. So when the remote set is unknown we report
   nothing lost and push nothing; we only ever act on what we actually know. */
export function photoPlan({ referenced, local, remote }) {
  const known = !!remote && remote.known !== false;
  const there = new Set(known ? remote.ids || [] : []);
  const here = new Set(local || []);
  const want = [...new Set(referenced || [])];

  return {
    known,
    /* referenced, not merely present: a blob left behind by a discarded
       envelope is not ours to publish.

       The pull reads this same set for a different question — "what is held on
       this device and nowhere else", i.e. what a full-replace pull is about to
       sweep away for good. Same formula, so it stays one field; computing it
       twice under two names is how the two drift apart. */
    toPush: known ? want.filter((id) => here.has(id) && !there.has(id)) : [],
    toPull: known ? want.filter((id) => !here.has(id) && there.has(id)) : [],
    lost: known ? want.filter((id) => !here.has(id) && !there.has(id)) : [],
  };
}
