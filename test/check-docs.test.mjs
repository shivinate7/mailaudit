// Claim-3 cases for check-docs.mjs: the comment stripper, and the code roots
// that the names are judged against. The last cases are claim 1's: the suite
// count summed over one log per part.
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
import { join, dirname, resolve, delimiter } from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { failLine } from "./fail-line.mjs";

// CHECK_DOCS_SCRIPT lets a run point the cases at another copy of the script,
// such as an older one, to prove a case red. The copy must sit inside the repo
// tree so its imports resolve. Unset, the cases run the repo's own script.
const CHECK =
  process.env.CHECK_DOCS_SCRIPT ??
  resolve(dirname(fileURLToPath(import.meta.url)), "..", "check-docs.mjs");

let failures = 0;
let checks = 0;
function expect(label, cond, detail = "") {
  checks++;
  if (cond) {
    console.log(`ok   ${label}`);
  } else {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n     ${detail}` : ""}`);
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
  "docs/decisions/.keep": "",
  "invariants/.keep": "",
  "measurements/.keep": "",
};

// Writes a temp corpus, runs check-docs.mjs in it, returns status and output. `logs` is a list of
// suite log texts, written in order and named in CHECK_DOCS_SUITE_LOG joined with the path delimiter,
// as CI names one log per part. Unset, one log holds a count of 1.
function runCorpus(files, { logs = ["1 passed, 0 failed\n"] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "check-docs-strip-"));
  try {
    const all = { ...BASE, ...files };
    for (const [p, text] of Object.entries(all)) {
      const full = join(dir, p);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, text);
    }
    // Claim 1 reads the suite's count from these logs, so the suite never runs here.
    const logPaths = logs.map((text, i) => {
      const p = join(dir, `suite-${i}.log`);
      writeFileSync(p, text);
      return p;
    });
    // Claim 2 calls `git ls-files`, which needs a repo to answer.
    execFileSync("git", ["init", "-q"], { cwd: dir });
    const r = spawnSync(process.execPath, [CHECK], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, CHECK_DOCS_SUITE_LOG: logPaths.join(delimiter) },
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
const fixture = runCorpus({ "docs/decisions/strip-cites.md": CITES, "src/fixture.jsx": FIXTURE });
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
  "docs/decisions/none.md": "# None\n\nNo code names are cited here.\n",
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

// Rule-file links. A link in a rule file resolves from that rule's own folder,
// as a markdown reader does, so ../../README.md from .claude/rules/ is the repo
// README. The front matter is blank, so its lines do not shift the count.
{
  const ruleLinks = runCorpus({
    ".claude/rules/x.md": [
      "---",
      "paths:",
      '  - "src/x.mjs"',
      "---",
      "",
      "# Fixture rule links",
      "",
      "Good: [readme](../../README.md). Bad: [gone](missing-r.md).",
      "",
    ].join("\n"),
  });
  expect(
    "rule links: a bad link fails at the rule's own line, and the good link is not flagged",
    ruleLinks.status !== 0 &&
      ruleLinks.out.includes(".claude/rules/x.md:8") &&
      ruleLinks.out.includes("missing-r.md") &&
      !ruleLinks.out.includes("../../README.md"),
    `exit ${ruleLinks.status}: ${ruleLinks.out.trim().split("\n").slice(-2).join(" | ")}`
  );
}

// Debts. check-docs.mjs reads debts/ as well as the records. A corpus with no
// debts/ folder reads as empty, and a debt names its paths like a record, so a
// missing one fails at the debt's own line.
{
  const none = runCorpus({ "docs/decisions/none.md": "# None\n\nNo code names are cited here.\n" });
  expect(
    "debts: a corpus with no debts/ folder exits 0 and finishes its normal run",
    none.status === 0 && /the corpus's numbers and paths check out/.test(none.out)
  );

  const present = runCorpus({
    "src/present.mjs": "export const ok = 1;\n",
    "docs/debts/fixture-debt-present-path.md": [
      "# Fixture debt names a path that exists",
      "",
      "The gap cites `src/present.mjs`, which is in the repo.",
      "",
      "**Status:** open.",
      "",
      "**Decision:** none",
      "",
    ].join("\n"),
  });
  expect(
    "debts: a debt naming an existing path exits 0 and finishes its normal run",
    present.status === 0 && /the corpus's numbers and paths check out/.test(present.out)
  );

  const missing = runCorpus({
    "docs/debts/fixture-debt-missing-path.md": [
      "# Fixture debt names a path that is gone",
      "",
      "The gap cites `src/missing-file.mjs`, which is not in the repo.",
      "",
      "**Status:** open.",
      "",
      "**Decision:** none",
      "",
    ].join("\n"),
  });
  expect(
    "debts: a debt naming a missing path fails at the debt's own line",
    missing.status !== 0 &&
      missing.out.includes(
        "docs/debts/fixture-debt-missing-path.md:3 names `src/missing-file.mjs`, which does not exist in this repo"
      )
  );
}

// Path-scoped rule files. check-docs.mjs judges the paths a rule file names, as
// it does for a record. The rule's valid path on line 8 must not be flagged. The
// missing path on line 9 must fail at its own line.
{
  const rule = runCorpus({
    "src/present.mjs": "export const ok = 1;\n",
    ".claude/rules/x.md": [
      "---",
      "paths:",
      '  - "src/**"',
      "---",
      "",
      "# Fixture rule names paths",
      "",
      "The rule cites `src/present.mjs`, which is in the repo.",
      "The rule cites `src/missing-rule-file.mjs`, which is not in the repo.",
      "",
    ].join("\n"),
  });
  expect(
    "rules: a rule file naming a missing path fails at the rule's own line, and its valid path is not flagged",
    rule.status !== 0 &&
      rule.out.includes(
        ".claude/rules/x.md:9 names `src/missing-rule-file.mjs`, which does not exist in this repo"
      ) &&
      !rule.out.includes("src/present.mjs"),
    `exit ${rule.status}: ${rule.out.trim().split("\n").slice(-2).join(" | ")}`
  );
}

// Claim-3 code roots. CODE_ROOTS names six folders by hand, so a name that
// lives only in worker/ or extension/ is reported as occurring nowhere. Each
// name below lives in exactly one file, and one record cites all of them. A
// is red today and green once the roots come from git. B is green today and
// must stay green: prose, a dependency, a generated file or no file at all is
// still reported. The control sits in src/, which is walked today, so it shows
// that a name found in a walked folder is kept.
{
  const ROOTS_RECORD = [
    "# Derived code roots",
    "",
    "The record cites `WORKER_ONLY_LIMIT`, `extensionOnlyTimeout`, `LANE_ONLY_CAP`, `ctrlOnlyNote`, `neverWrittenAnywhere`, `pkgOnlyHelper`, `WORKER_README_NOTE`, `mockOnlyMarkup`, `LOCKFILE_ONLY_PIN` and `generatedOnlyBundle`.",
    "",
  ].join("\n");
  const roots = runCorpus({
    "docs/decisions/derived-roots.md": ROOTS_RECORD,
    "src/ctrl.mjs": "export const ctrlOnlyNote = 0;\n",
    "worker/x.mjs": "export const WORKER_ONLY_LIMIT = 1024;\n",
    "extension/x.mjs": "export const extensionOnlyTimeout = 30;\n",
    "lanes/x.mjs": "export const LANE_ONLY_CAP = 4;\n",
    "worker/README.md": "Prose in a code folder names WORKER_README_NOTE.\n",
    "node_modules/pkg/x.js": "export const pkgOnlyHelper = 1;\n",
    "docs/design/mock.html": '<div data-mock="mockOnlyMarkup"></div>\n',
    "package-lock.json": '{ "name": "fixture", "LOCKFILE_ONLY_PIN": true }\n',
    "lanes/bundle.js": "/* Generated by extension/build.mjs. Do not edit. */\nexport const generatedOnlyBundle = 2;\n",
  });
  const judged = Number(/(\d+) code name\(s\) judged against the code/.exec(roots.out)?.[1] ?? 0);
  const flagged = flaggedNames(roots.out);
  // The output line that names a flagged name: the one cause a red case prints.
  const lineFor = (name) =>
    roots.out.split("\n").find((l) => l.includes(`\`${name}\``)) ?? `no output line names \`${name}\``;

  expect(
    "roots: the corpus judges all ten names, so the checks below are not vacuous",
    judged >= 10,
    `judged ${judged} code name(s); check-docs may have stopped before claim 3`
  );
  expect(
    "control: ctrlOnlyNote in src/, a walked folder, is found in the code and not reported",
    !flagged.has("ctrlOnlyNote"),
    lineFor("ctrlOnlyNote")
  );

  // Kind A: a name that lives only in a folder the roots do not list yet.
  const KIND_A = [
    ["A1", "worker/x.mjs", "WORKER_ONLY_LIMIT"],
    ["A2", "extension/x.mjs", "extensionOnlyTimeout"],
    ["A3", "lanes/x.mjs", "LANE_ONLY_CAP"],
  ];
  for (const [id, where, name] of KIND_A) {
    expect(
      `${id}: ${name} lives only in ${where}, so it is found in the code and not reported`,
      !flagged.has(name),
      lineFor(name)
    );
  }

  // Kind B: a name that must still be reported, wherever it lives.
  const KIND_B = [
    ["B1", "no file but the record", "neverWrittenAnywhere"],
    ["B2", "node_modules/pkg/x.js", "pkgOnlyHelper"],
    ["B3", "worker/README.md (prose)", "WORKER_README_NOTE"],
    ["B4", "docs/design/mock.html", "mockOnlyMarkup"],
    ["B5", "package-lock.json", "LOCKFILE_ONLY_PIN"],
    ["B6", "lanes/bundle.js (generated header)", "generatedOnlyBundle"],
  ];
  for (const [id, where, name] of KIND_B) {
    expect(
      `${id}: ${name} lives only in ${where}, so it is reported as occurring nowhere`,
      flagged.has(name),
      "check-docs found the name in the code, so it was not reported"
    );
  }
}

// Claim 1 with part logs. CI runs the app suite as three parts on three runners, so
// CHECK_DOCS_SUITE_LOG names one log per part, joined with the path delimiter. The count is the
// sum, and the logs must be parts 1 to 3 once each, so a lost log cannot lower the total. The
// counts are the parts' real ones (TZ=America/New_York): 296 + 516 + 866 = 1678. The record claims
// 1678, so a total that is not the sum fails the claim, and the first case shows it passes.
{
  const CLAIM = { "docs/decisions/count-claim.md": "# Count claim\n\nThe suite runs 1678 assertions.\n" };
  const part = (n, of, count) => `app suite: part ${n} of ${of}\n\n${count} passed, 0 failed\nlive handles: none\nall green\n`;
  const whole = (count) => `\n${count} passed, 0 failed\nlive handles: none\nall green\n`;
  const P1 = part(1, 3, 296);
  const P2 = part(2, 3, 516);
  const P3 = part(3, 3, 866);
  const REFUSED = "the suite logs must hold parts 1 to 3 once each";
  const tail = (r) => `exit ${r.status}: ${r.out.trim().split("\n").slice(-2).join(" | ")}`;
  const passes = (name, logs) => {
    const r = runCorpus(CLAIM, { logs });
    expect(name, r.status === 0 && /real total \(1678\)/.test(r.out), tail(r));
  };
  const refuses = (name, logs, message) => {
    const r = runCorpus(CLAIM, { logs });
    expect(name, r.status !== 0 && r.out.includes(message), tail(r));
  };

  passes("parts: logs for parts 2, 1 and 3 sum to 1678 and pass, in any order", [P2, P1, P3]);
  passes("parts: one whole-run log of 1678, with no part line, still passes", [whole(1678)]);
  refuses("parts: parts 1 and 2 only are refused, so a lost log cannot lower the total", [P1, P2], REFUSED);
  refuses("parts: part 1 alone is refused", [P1], REFUSED);
  refuses("parts: part 1 twice, with parts 2 and 3, is refused", [P1, P1, P2, P3], REFUSED);
  refuses("parts: part 1 twice and part 3 are refused, though three logs match the count", [P1, P1, P3], REFUSED);
  refuses("parts: a whole-run log beside a part log is refused", [whole(1678), P1], REFUSED);
  refuses("parts: two logs and no part line are refused", [whole(800), whole(878)], "several suite logs, and none names its part");
  refuses(
    "parts: a part log with no count is refused, not read as zero",
    [P1, "app suite: part 2 of 3\n", P3],
    "could not read a pass/fail count"
  );
}

if (failures) {
  console.log(failLine(failures, checks));
  process.exit(1);
}
console.log("check-docs stripper: all green");
