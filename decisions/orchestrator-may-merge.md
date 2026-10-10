# The orchestrating session may merge

The owner granted standing merge authority on 2026-10-10. A session that orchestrates work here may merge a pull request to `main` without asking first. Every other rule still applies. The PR must pass the required checks `suite` and `screens`. A change to a gate, a rule or product code needs a fresh reviewer's pass before the merge. Green PRs merge together through one integration branch.

**Holds while:** the owner has not withdrawn the grant, and branch protection on `main` requires `suite` and `screens` for every PR, admins included.

## See also

- `main-moves-only-by-pr` — the protection this grant works inside.
