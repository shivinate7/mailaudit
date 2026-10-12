// Claim-3 comment-stripper cases for check-docs.mjs.
//
// check-docs.mjs runs its whole check on import, so its stripper cannot be
// imported here. Each case runs the CLI against a temp corpus: a source file
// with the fixture, and a record that cites each name in backticks. A name the
// stripper keeps is found in the code and is not reported. A name it removes
// is reported as occurring nowhere, so comment-only names are expected to be
// reported.
//
// Run: npm run test:check-docs. Exits 1 on any failure.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// CHECK_DOCS_SCRIPT lets a run point the cases at another copy of the script,
// such as an older one, to prove a case red. The copy must sit inside the repo
// tree so its imports resolve. Unset, the cases run the repo's own script.
const CHECK =
  process.env.CHECK_DOCS_SCRIPT ??
  resolve(dirname(fileURLToPath(import.meta.url)), "..", "check-docs.mjs");

let failures = 0;
function expect(label, cond) {
  if (cond) {
    console.log(`ok   ${label}`);
  } else {
    failures++;
    console.log(`FAIL ${label}`);
  }
}

// Valid JSX, so a parsing stripper accepts it. Each case is on one line with
// its name, or on the next line.
const FIXTURE = [
  'export const A = <input accept="image/*" />; export const nameA = 1;',
  "export const B = <a>https://x</a>; export const nameB = 2;",
  "export const C = <p>Don't</p>;",
  "export const nameC = 3;",
  "export const D = /\\/\\*/; export const nameD = 4;",
  "// comment nameE",
  "export const F = 5; /* nameF */",
].join("\n") + "\n";

const CITES = [
  "# Stripper cites",
  "",
  "Each name is cited here for the stripper test.",
  "Names: `nameA` `nameB` `nameC` `nameD` `nameE` `nameF`.",
  "",
].join("\n");

const BASE = {
  "CLAUDE.md": "# Corpus\n",
  "README.md": "# Readme\n",
  "decisions/.keep": "",
  "invariants/.keep": "",
  "measurements/.keep": "",
};

// Writes a temp corpus, runs check-docs.mjs in it, returns status and output.
function runCorpus(files) {
  const dir = mkdtempSync(join(tmpdir(), "check-docs-strip-"));
  try {
    const all = { ...BASE, ...files };
    for (const [p, text] of Object.entries(all)) {
      const full = join(dir, p);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, text);
    }
    // Claim 1 reads the suite's count from this log, so the suite never runs here.
    writeFileSync(join(dir, "suite.log"), "1 passed, 0 failed\n");
    // Claim 2 calls `git ls-files`, which needs a repo to answer.
    execFileSync("git", ["init", "-q"], { cwd: dir });
    const r = spawnSync(process.execPath, [CHECK], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, CHECK_DOCS_SUITE_LOG: join(dir, "suite.log") },
    });
    return { status: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// The names claim 3 reports as occurring nowhere in the code.
function flaggedNames(out) {
  return new Set([...out.matchAll(/names `([^`]+)`, which occurs nowhere/g)].map((m) => m[1]));
}

// Cases a to e.
const fixture = runCorpus({ "decisions/strip-cites.md": CITES, "src/fixture.jsx": FIXTURE });
const flagged = flaggedNames(fixture.out);

expect(
  "sanity: all six names are judged, so the checks below are not vacuous",
  /6 code name\(s\) judged against the code/.test(fixture.out)
);
expect('a: accept="image/*" opens no comment, so nameA is kept', !flagged.has("nameA"));
expect("b: https:// in JSX text does not eat nameB on the same line", !flagged.has("nameB"));
expect("c: Don't in JSX text does not eat nameC on the next line", !flagged.has("nameC"));
expect("d: regex /\\/\\*/ opens no comment, so nameD is kept", !flagged.has("nameD"));
expect("e1: a // comment is removed, so nameE is reported", flagged.has("nameE"));
expect("e2: a /* */ comment is removed, so nameF is reported", flagged.has("nameF"));

// A source that does not parse must fail the check and name the file. The
// record cites no names, so a non-zero exit can only come from the parse.
const broken = runCorpus({
  "decisions/none.md": "# None\n\nNo code names are cited here.\n",
  "src/broken.jsx": "export const = <div>;{{\n",
});
expect("unparseable source makes check:docs exit non-zero", broken.status !== 0);
expect("...and the failure names src/broken.jsx", broken.out.includes("src/broken.jsx"));

// Link check: a lone backtick must not hide a link on the lines after it. The
// closing `plain` span gives the lone backtick a partner to pair with, which is
// what let the old span regex cross lines and hide the link.
const loneTick = runCorpus({
  "README.md": "# Readme\n\nA lone ` on this line\n[x](missing-a.md) on the next line\nand a closing `plain` span.\n",
});
expect(
  "link-flagged: a lone backtick does not hide a link on the next line (exit non-zero)",
  loneTick.status !== 0
);
expect(
  "link-flagged: ...and the output names missing-a.md",
  loneTick.out.includes("missing-a.md")
);

// Link check: a code span on one line hides a link inside it, as sample text.
const spanSkipped = runCorpus({
  "README.md": "# Readme\n\nSample text: `[x](missing-b.md)` is shown, not linked.\n",
});
expect(
  "link-span-skipped: a [x](y) inside a code span on one line is not reported",
  !spanSkipped.out.includes("missing-b.md")
);

if (failures) {
  console.log(`check-docs stripper: ${failures} failure(s)`);
  process.exit(1);
}
console.log("check-docs stripper: all green");
