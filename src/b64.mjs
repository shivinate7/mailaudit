/* UTF-8-safe base64, for the GitHub Contents API (which takes and returns
   base64 only).

   This is its own module for one reason: it is the only part of the remote
   backup that can fail by producing *plausible-looking corrupted data* rather
   than an error, and entry.jsx is unreachable from the test harness (it mounts
   on import). The harness imports these two functions directly, so the app-level
   push/pull tests exercise the real codec rather than a mock of it.

   Do not "simplify" this to btoa(JSON.stringify(payload)). btoa throws
   InvalidCharacterError on any codepoint above U+00FF, and the ledger is full
   of them: card names carry Æ/ö/é (see the decodeEntities comment in app.jsx)
   and normName exists precisely because iOS smart punctuation puts ’ (U+2019)
   into hand-typed envelope entries. One envelope typed on the phone and Push
   would throw. */

/* 0x8000 because `String.fromCharCode(...bytes)` spread over a ~350KB ledger
   blows the argument limit; chunking keeps each spread small. */
const CHUNK = 0x8000;

export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += CHUNK)
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  return btoa(bin);
}

export function base64ToUtf8(b64) {
  /* GitHub returns base64 wrapped at 60 columns. atob is specced to ignore
     ASCII whitespace, but leaning on forgiving-base64 for data integrity is
     the sort of thing that breaks on one engine — strip it ourselves. */
  const bin = atob(String(b64).replace(/\s+/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
