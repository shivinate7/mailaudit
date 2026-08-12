/* The two decisions in the GitHub adapter that are worth being sure about,
   pulled out as pure functions so they can actually be asserted on.

   Everything else in entry.jsx is unreachable from the test harness — it mounts
   React on import, and the harness mocks window.remote wholesale, exactly as it
   mocks window.storage and window.photos. That's the right trade for fetch
   plumbing. It is NOT the right trade for these two, because both fail quietly:
   a mis-mapped status code tells the user their key is broken when GitHub is
   merely throttling, and a wrongly-included sha turns the whole
   optimistic-concurrency scheme into last-writer-wins. */

/* GitHub overloads its status codes badly. Two that are easy to get wrong:

   - 403 means insufficient permission, primary rate limit AND secondary rate
     limit. Split on the rate headers, or a throttled user is told their token
     is bad and goes and regenerates it for nothing.
   - a MISSING sha on a file that already exists is 422, not 409. That's what a
     second device sees on its first push, and the advice ("pull first") is the
     same as for a real conflict, so it maps to the same code. */
export function classifyStatus(status, message = "", opts = {}) {
  const { retryAfter = null, remaining = null } = opts;
  const msg = String(message || "");
  if (status === 401) return "auth";
  if (status === 429) return "rate-limit";
  if (status === 403) return retryAfter || remaining === "0" ? "rate-limit" : "forbidden";
  if (status === 409) return "conflict";
  if (status === 422) return /sha/i.test(msg) ? "conflict" : "server";
  if (status === 404) {
    /* the branch missing and the file missing are different problems with
       different fixes, and only one of them is normal */
    if (/No commit found for the ref/i.test(msg)) return "no-branch";
    return "missing";
  }
  if (status >= 500) return "server";
  return "server";
}

/* The sha sent here must be the one THIS DEVICE last saw — never one fetched
   moments earlier. Re-fetching would make every push win, silently discarding
   whatever the other device wrote; sending the remembered sha is what turns
   "someone else pushed since you pulled" into a 409 you can act on.
   Omitting it entirely is correct in exactly one case: the file does not exist
   yet, which is a create rather than an update. */
export function pushBody({ text, branch, sha, message, encode }) {
  const body = { message, content: encode(text), branch };
  if (sha) body.sha = sha;
  return body;
}
