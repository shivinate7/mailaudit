# The ledger repo is private, the source repo is public

**Status:** open.

The ledger and photos live in a private repo so a backup store never shares a repo with a public site. That choice costs a fresh device its keyless pull. Every device now needs a token before it can recover anything at all. `classifyLedger` carries the extra request that tells a hidden repo apart from an empty one, and that disambiguation is the ongoing cost of this design.

## See also

- `one-repo-for-both-halves` — why the ledger and photos share this one private repo
- `pull-needs-a-key-too` — the direct consequence of the repo going private
- `listphotos-is-three-valued` — the same 404-ambiguity shape, inherited here
- `nothing-recovers-without-the-key` — the fresh-device cost this decision creates
