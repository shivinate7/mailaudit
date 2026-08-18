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

/* The shared core. Extracted so the photo path cannot drift from the ledger
   path — they are the same operation on different bytes, and having two copies
   of a loop whose only failure mode is silent corruption is asking for it. */
export function bytesToBase64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += CHUNK)
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  return btoa(bin);
}

export function utf8ToBase64(str) {
  return bytesToBase64(new TextEncoder().encode(str));
}

/* Photos, for the Contents API, which takes base64 only.

   This must NOT go through utf8ToBase64. A JPEG is arbitrary bytes, not UTF-8;
   decoding it as text and re-encoding mangles every byte that isn't valid UTF-8
   and silently changes the length. Measured before writing this: 300KB of
   high-byte data survives this function byte-identical and does not survive the
   text path. That is the whole reason this file exists — it is the one piece
   here that fails by producing plausible corrupted data rather than an error.

   Only an encoder is needed. The pull asks GitHub for the raw media type and
   reads res.arrayBuffer(), so photo bytes never round-trip through base64 on
   the way back. */
export async function blobToBase64(blob) {
  return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
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
