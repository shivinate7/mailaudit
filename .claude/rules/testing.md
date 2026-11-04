---
paths:
  - "test/**"
---

# Testing

Holds the testing method, and the test harness lessons.

## Testing method

Lessons this repo paid for. Each one came from a green suite that hid a real defect.

- `testing-green-suite-hides-break` — A green suite can hide a broken feature.
- `testing-mock-is-test-below-seam` — A mock is the test below the seam.
- `testing-pull-payload-eq-void` — After a pull, payload equality proves nothing.
- `testing-unfailable-assert-decor` — An assertion that cannot fail is decoration.
- `testing-throwing-assert-bad-kill` — An assertion that throws is a worse kill.
- `testing-check-something-rereads` — Check that something re-reads the value.
- `testing-jsdom-has-no-layout` — jsdom has no layout.
- `testing-isolate-each-tier` — One tier must not decide another.
- `testing-chokepoint-two-branches` — When a chokepoint has two branches.
- `testing-mock-field-stops-decor` — When a mock field stops being decorative.
- `testing-mutant-dies-check-cause` — When a mutant dies, check the cause.
- `testing-surviving-mutant` — When a mutant survives, find the unreached state.
- `testing-deps-caught-by-edit` — A missing dependency shows only on an edit.
- `testing-partial-qty-needs-case` — Assignment needs a partial-quantity case.
- `claims-and-tests-change-together` — A changed behaviour changes its test in one commit.
- `newer-features-test-proof-only` — Newer features have only test proof.

## Test harness

- `harness-boot-seeds-remote-late` — Boot seeds the remote after the mount.
- `harness-drives-resume-by-event` — Drive a resume by event, not by waiting.
- `harness-drives-the-controls` — Tests drive the controls by their labels.
- `harness-drop-feeds-the-csv` — Tests feed files through the drop handler.
- `harness-jsdom-setup-gotchas` — The harness supplies what jsdom lacks.
- `harness-push-race-one-shot` — A push conflict needs a one-shot failure.
- `harness-waits-past-debounces` — Tests wait past the debounces.

## Measurements

- `suite-size` — Test suite assertion count and run time.
