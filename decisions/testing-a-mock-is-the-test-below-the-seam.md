# A mock is the test below the seam

Below the seam an app-level test cannot reach, the mock stands in for the real defect. A real sha-ordering bug lived in the entry-point adapter. No app-level test could catch it, and none can catch its return. The mock had mirrored that same bad ordering and disabled the one failure that could expose it. Keeping the mock honest is the only protection that layer gets.

## See also

- `testing-when-a-mock-field-stops-being-decorative` — another way a mock can hide a real defect
- `b64-fails-by-producing-plausible-data` — the module family this seam sits below
