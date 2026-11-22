# A measurement record can keep an unfilled placeholder

**What.** `npm run check:docs` grades one claim in `measurements/`: a numeric assertion count that disagrees with the suite (`check-docs.mjs`, lines 190 to 213). No check reads a measurement record for an unresolved placeholder, or for a missing total.

- On the PR 350 lane (`reimport-name-style`), `measurements/suite-size.md` held the word `TOTALPLACEHOLDER` on lines 3 and 5. `npm run check:docs` passed, because with no number in that prose it grades nothing. Commit `7a03db8` wrote the measured total (1742) before the merge, so main never held it.

**Harm.** A merged measurement record can state no figure while the check reads green. The next session trusts a figure that is not there.

If a check reads each file in `measurements/` and fails on a placeholder token or a record with no total, the gap closes. It needs a run that goes red on the old text first.

**Status:** open. Caught before merge; no record on main holds a placeholder.

**Decision:** none. `suite-size` is the record at risk.
