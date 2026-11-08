// The line a red suite prints at its red exit: `FAIL: <failed> of <total> failed`, at column 0.
// The mutation report counts a kill only on a line the classifier's FAIL_LINE matches, and this
// summary is the one line that states the counts. A load error prints no such line, so a crash
// never reads as a kill. The cases are in test/fail-line.test.mjs.
export function failLine(failed, total) {
  return `FAIL: ${failed} of ${total} failed`;
}
