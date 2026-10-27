# Main moves only by pull request

Every change reaches `main` through a pull request that passes the required `suite` check. Branch protection enforces this for admins too (`enforce_admins`), so the owner cannot push past it either. Before this ruling, 17 of the last 20 commits on `main` were direct pushes, and none of them ran `suite` first. `npm run deploy` already opens a pull request, so deploys need no exception. The owner ruled this on 2026-10-10.

**Holds while:** branch protection on `main` requires the `suite` check and applies to admins. `npm run deploy` opens its pull request with `gh pr create`.

## See also

- `build-and-deploy` — the deploy script that opens the pull request.
- `ci-filters-guarantee-no-rebuild` — what `suite` runs on.
