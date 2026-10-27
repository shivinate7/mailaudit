# Assignment needs a partial-quantity case

Every assignment in groups 1 to 19 takes a card's full quantity. So the mutation that makes assign mark the whole line received passed all 101 of them. Group 20 catches it. It records one copy of a quantity-2 line, and it checks that exactly one copy lands. Do not delete group 20.

**Holds while:** group 20 in `test/app.test.mjs` records one copy of a quantity-2 line and expects the line at 1.

## See also

- `testing-mutant-dies-check-cause`, the lesson on a kill for the wrong reason.
- `orphaned-mail-never-decides`, the rule that assignment checks in only what was recorded.
