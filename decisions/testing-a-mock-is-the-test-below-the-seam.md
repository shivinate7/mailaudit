# A mock is the test below the seam

Below the seam an app-level test cannot reach, the mock stands in for the real defect. A real sha-ordering bug lived in the entry-point adapter. No app-level test could catch it, and none can catch its return. The mock had mirrored that same bad ordering and disabled the one failure that could expose it. Keeping the mock honest is the only protection that layer gets.

## The argument, as recorded

```
That gap has a cost worth naming, because it was paid: the `pushForce` sha bug
lived in `entry.jsx`, so **no app-level test could catch it, and none can catch
its return.** Restoring the bad ordering leaves the suite green — verified. What
the suite pins instead is the *mock's* faithfulness (35.6–35.7), which is only
as good as the mock. When a rule matters and lives below this seam, the mock is
the test, so keep it honest: this one had mirrored the bug and disabled the only
failure that could expose it.
```

## See also

- `testing-when-a-mock-field-stops-being-decorative` — another way a mock can hide a real defect
- `b64-fails-by-producing-plausible-data` — the module family this seam sits below
