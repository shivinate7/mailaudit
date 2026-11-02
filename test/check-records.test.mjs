// Cases for the debts/ record kind in check-records.mjs.
//
// check-records.mjs runs its whole check on import, so each case runs the CLI
// against a temp corpus: a small base corpus plus the debt files under test.
// A defect case must exit non-zero and name the debt it breaks. A green case
// must exit 0. The empty-folder case and the clean case are the controls: if
// either goes red, the defect cases prove nothing.
//
// Rule-file cases: CLAUDE.md and every .claude/rules/*.md file are index
// sources. A slug bulleted in a rule file counts as cited, a slug bulleted in
// CLAUDE.md and a rule file counts twice, and a rule file's "## Open threads"
// bullets need a Status line.
//
// Scanner cases: the fence-quoted case covers a comment opener inside a
// backtick span, a /* that opens no comment in a fence, a multi-line template
// literal inside a fence, a lone quote in prose, and a # opener in a quoted
// string and in a backtick span on the Status and Decision lines.
//
// Run: npm run test:check-records. Exits 1 on any failure.
// CHECK_RECORDS_SCRIPT points the cases at another copy of the checker, such as
// main's, to prove a case red. Unset, the cases run the repo's own script.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CHECK =
  process.env.CHECK_RECORDS_SCRIPT ??
  resolve(dirname(fileURLToPath(import.meta.url)), "..", "check-records.mjs");

let failures = 0;
function expect(label, cond, detail = "") {
  if (cond) {
    console.log(`ok   ${label}`);
  } else {
    failures++;
    console.log(`FAIL ${label}${detail ? `\n     ${detail}` : ""}`);
  }
}

const DECISION = [
  "# Fixture decision holds a rule",
  "",
  "A decision the fixture debts cite as their decision.",
  "",
  "**Holds while:** the fixture corpus keeps this record.",
  "",
].join("\n");

const MEASURE = [
  "# Fixture measurement holds a figure",
  "",
  "A measurement a debt may cite as its decision.",
  "",
].join("\n");

// A decision that only a path-scoped rule file cites. CLAUDE.md never names it.
const RULE_RECORD = "docs/decisions/fixture-rule-decision.md";
const RULE_DECISION = [
  "# Fixture rule-only decision holds a rule",
  "",
  "A decision that only a path-scoped rule file in .claude/rules/ cites.",
  "",
  "**Holds while:** the fixture corpus keeps this record.",
  "",
].join("\n");

// A path-scoped rule file: YAML front matter with `paths:`, then the body.
const RULE_PATH = ".claude/rules/x.md";
function ruleFile(body) {
  return ["---", "paths:", '  - "src/**"', "---", "", "# Fixture rules for src", "", body, ""].join("\n");
}
const RULE_PROSE_ONLY = ruleFile("Prose only, with no index bullet in it.");
const RULE_CITES_ONE = ruleFile(
  "## Decisions\n\n- `fixture-rule-decision` — A decision only this rule file cites.\n"
);
const RULE_CITES_CLAUDE_TOO = ruleFile(
  "## Decisions\n\n- `fixture-decision-holds` — A decision CLAUDE.md also cites.\n"
);
const RULE_OPEN_THREAD = ruleFile(
  "## Open threads\n\n- `fixture-rule-decision` — An open thread this rule file tracks.\n"
);
// The bullet sits in a fence, so it is a sample, not an index entry. The prose
// holds a lone quote and a comment opener inside a code span.
const RULE_FENCE_ONLY = ruleFile(
  [
    "Don't count the sample below, nor `/* this */`.",
    "",
    "````markdown",
    "- `fixture-rule-decision` — A sample bullet, not an index entry.",
    "````",
  ].join("\n")
);

// A debt in the house form: an H1 title, a Status line, a Decision line. Pass
// null or "" for a part to leave that part out.
function debt(parts = {}) {
  const d = {
    title: "Fixture debt is a known gap",
    prose: "A known gap the fixture tracks.",
    status: "**Status:** open.",
    decision: "**Decision:** `fixture-decision-holds`",
    tail: "",
    ...parts,
  };
  return [d.title && `# ${d.title}`, d.prose, d.status, d.decision, d.tail]
    .filter(Boolean)
    .join("\n\n") + "\n";
}

// Prose holds a lone quote, a /* and a // inside code spans. The fence holds a
// /* that never closes, a three-backtick block, and a multi-line template
// literal that carries a fake Decision line. Only the Decision after the fence
// is real.
const SCANNER_STRINGS = [
  "# Fence-quoted decision lines do not count",
  "",
  "Prose with a lone quote, don't, and the owner's word, plus `/* not a comment` and `// nor this`.",
  "",
  '**Status:** open; a "# sign" in a string and `# note` in a span.',
  "",
  "````markdown",
  "A quoted sample, not a rule:",
  "**Decision:** `fixture-no-such-decision`",
  "/* an unterminated comment opener",
  "```bash",
  'echo "a three-backtick block inside a four-backtick fence"',
  "```",
  "const note = `",
  "**Decision:** `fixture-no-such-decision`",
  "`;",
  "````",
  "",
  '**Decision:** `fixture-decision-holds`, with a "# note" in a string.',
  "",
].join("\n");

const CLEAN = debt({});

// The fence holds both lines. Neither is a real Status or Decision.
const FENCE_ONLY = debt({
  status: null,
  decision: null,
  tail: [
    "````markdown",
    "**Status:** open.",
    "",
    "**Decision:** `fixture-decision-holds`",
    "````",
  ].join("\n"),
});

// The base corpus, with the debts and index for one case written on top.
function baseFiles(claude) {
  return {
    "CLAUDE.md": claude,
    "docs/decisions/fixture-decision-holds.md": DECISION,
    "measurements/fixture-measure-geometry.md": MEASURE,
    "invariants/.keep": "",
    "docs/debts/.keep": "",
    "src/.keep": "",
    "test/app.test.mjs": "// fixture\n",
    "build.mjs": "// fixture\n",
    "package.json": '{"name":"fixture","private":true,"scripts":{}}\n',
  };
}

// The index lists each cited debt once. It names the debts/ folder unless told
// not to, so one case can prove the folder must be listed. `prose` lines sit
// under the Debts heading as plain paragraphs, never as index bullets.
function claudeMd(cited, { folderListed = true, prose = [] } = {}) {
  return [
    "# Corpus",
    "",
    "Fixture index for the records checker.",
    "",
    "## Decisions",
    "",
    "- `fixture-decision-holds` — A decision the fixture cites.",
    "",
    "## Measurements",
    "",
    "- `fixture-measure-geometry` — A measurement the fixture cites.",
    "",
    "## Debts",
    "",
    folderListed
      ? "The `debts/` folder holds one known gap per file."
      : "One known gap per file.",
    "",
    ...cited.map((slug) => `- \`${slug}\` — A fixture debt.`),
    "",
    ...prose.flatMap((line) => [line, ""]),
    "## Open threads",
    "",
    "No open threads in this fixture.",
    "",
  ].join("\n");
}

// Writes a temp corpus, runs check-records.mjs in it, returns status and output.
// `records` adds record files by path, and `rules` adds .claude/rules/ files by
// path. Both default to none.
function runCorpus(
  debts,
  { cited = Object.keys(debts), folderListed = true, prose = [], rules = {}, records = {} } = {}
) {
  const dir = mkdtempSync(join(tmpdir(), "check-records-debts-"));
  try {
    const files = { ...baseFiles(claudeMd(cited, { folderListed, prose })), ...records, ...rules };
    for (const [slug, text] of Object.entries(debts)) {
      files[`docs/debts/${slug}.md`] = text;
    }
    for (const [p, text] of Object.entries(files)) {
      const full = join(dir, p);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, text);
    }
    const r = spawnSync(process.execPath, [CHECK], { cwd: dir, encoding: "utf8" });
    return { status: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const tail = (out) => out.trim().split("\n").slice(-2).join(" | ");

// Controls. Both must be green, or the red cases below prove nothing.
{
  const r = runCorpus({ "fixture-debt-clean": CLEAN });
  expect(
    "control: a well-formed debt, cited in the index, exits 0",
    r.status === 0,
    `exit ${r.status}: ${tail(r.out)}`
  );
  expect(
    "control: ...and the checker reports the corpus checks out",
    /the record corpus checks out/.test(r.out),
    tail(r.out)
  );
  const empty = runCorpus({});
  expect(
    "control: an empty debts/ folder exits 0",
    empty.status === 0,
    `exit ${empty.status}: ${tail(empty.out)}`
  );
  // A rule file with front matter and no index bullet must not break the corpus,
  // so the rule-file defect cases below fail for their own reason only.
  const ruleProse = runCorpus({}, { rules: { [RULE_PATH]: RULE_PROSE_ONLY } });
  expect(
    "control: a rule file with front matter and no index bullet exits 0",
    ruleProse.status === 0,
    `exit ${ruleProse.status}: ${tail(ruleProse.out)}`
  );
}

// Red cases. Each carries one defect and must exit non-zero, naming the debt.
const RED = [
  ["no H1 title line", { "fixture-debt-no-title": debt({ title: null }) }, {}, "fixture-debt-no-title"],
  ["no Status line", { "fixture-debt-no-status": debt({ status: null }) }, {}, "fixture-debt-no-status"],
  ["no Decision line", { "fixture-debt-no-decision": debt({ decision: null }) }, {}, "fixture-debt-no-decision"],
  [
    "Decision cites a slug that does not exist",
    { "fixture-debt-bad-cite": debt({ decision: "**Decision:** `fixture-no-such-decision`" }) },
    {},
    "fixture-debt-bad-cite",
  ],
  [
    "Decision cites its own slug",
    { "fixture-debt-self-cite": debt({ decision: "**Decision:** `fixture-debt-self-cite`" }) },
    {},
    "fixture-debt-self-cite",
  ],
  [
    "a second Decision line cites a slug that does not exist",
    {
      "fixture-debt-two-decisions": debt({
        tail: "**Decision:** `fixture-no-such-decision`",
      }),
    },
    {},
    "fixture-debt-two-decisions",
  ],
  [
    "Decision cites another debt, not a decision",
    {
      "fixture-debt-clean": CLEAN,
      "fixture-debt-cites-debt": debt({ decision: "**Decision:** `fixture-debt-clean`" }),
    },
    {},
    "fixture-debt-cites-debt",
  ],
  [
    "debt is not cited in CLAUDE.md",
    { "fixture-debt-uncited": CLEAN },
    { cited: [] },
    "fixture-debt-uncited",
  ],
  [
    "Status and Decision exist only inside a fence",
    { "fixture-debt-fence-only": FENCE_ONLY },
    {},
    "fixture-debt-fence-only",
  ],
  [
    "record cited in neither CLAUDE.md nor any rule file",
    {},
    { records: { [RULE_RECORD]: RULE_DECISION }, rules: { [RULE_PATH]: RULE_PROSE_ONLY } },
    "fixture-rule-decision",
  ],
  [
    "index bullet only inside a fence in a rule file does not cite the record",
    {},
    { records: { [RULE_RECORD]: RULE_DECISION }, rules: { [RULE_PATH]: RULE_FENCE_ONLY } },
    "fixture-rule-decision",
  ],
];

for (const [label, debts, opts, slug] of RED) {
  const r = runCorpus(debts, opts);
  expect(
    `red: ${label} exits non-zero and names ${slug}`,
    r.status !== 0 && r.out.includes(slug),
    `exit ${r.status}: ${tail(r.out)}`
  );
}

{
  const r = runCorpus({ "fixture-debt-clean": CLEAN }, { folderListed: false });
  expect(
    "red: CLAUDE.md does not list the debts/ folder, exits non-zero and names debts/",
    r.status !== 0 && /debts\//.test(r.out),
    `exit ${r.status}: ${tail(r.out)}`
  );
}

// Claim 8's no-record branch. Its message is pinned, so a red here is that branch
// and no other. A mutant that cites any span still exits non-zero, but it
// prints a different message, and only the pinned text catches it.
const noRecord = (path) => `${path}: "Decision" names no record and does not say "none"`;
{
  const plain = runCorpus({
    "fixture-debt-no-record": debt({ decision: "**Decision:** the owner's word, with no record named." }),
  });
  expect(
    'red: a Decision line naming no record and not "none" exits non-zero with the branch message',
    plain.status !== 0 && plain.out.includes(noRecord("docs/debts/fixture-debt-no-record.md")),
    `exit ${plain.status}: ${tail(plain.out)}`
  );

  const spansOnly = runCorpus({
    "fixture-debt-spans-only": debt({
      decision: "**Decision:** the owner's word, `# note`, `/* not a slug` and `// nor this`.",
    }),
  });
  expect(
    'red: a Decision line whose spans are not slugs, beside a lone quote, exits non-zero with the branch message',
    spansOnly.status !== 0 && spansOnly.out.includes(noRecord("docs/debts/fixture-debt-spans-only.md")),
    `exit ${spansOnly.status}: ${tail(spansOnly.out)}`
  );
}

// Green cases. A valid shape must pass, including the forms the checker must
// not mistake for a defect.
{
  const none = runCorpus({ "fixture-debt-none": debt({ decision: "**Decision:** none" }) });
  expect(
    "green: Decision: none exits 0",
    none.status === 0,
    `exit ${none.status}: ${tail(none.out)}`
  );

  const measure = runCorpus({
    "fixture-debt-measure-cite": debt({ decision: "**Decision:** `fixture-measure-geometry`" }),
  });
  expect(
    "green: Decision citing a measurement record exits 0",
    measure.status === 0,
    `exit ${measure.status}: ${tail(measure.out)}`
  );

  const scanner = runCorpus({ "fixture-debt-scanner-strings": SCANNER_STRINGS });
  expect(
    "green: fence-quoted Decision lines, a lone quote and code-span comment openers do not break the scan",
    scanner.status === 0,
    `exit ${scanner.status}: ${tail(scanner.out)}`
  );

  // A non-slug code span on a Decision line is prose, not a citation. Only the
  // slug beside it counts. Under a regex that takes any span, `# note` is
  // cited, is not a record, and this case goes red.
  const span = runCorpus({
    "fixture-debt-note-span": debt({
      decision: "**Decision:** `fixture-decision-holds`, with a `# note` span beside the slug.",
    }),
  });
  expect(
    "green: a non-slug code span beside a valid slug on a Decision line exits 0",
    span.status === 0,
    `exit ${span.status}: ${span.out.match(/.*Decision cites.*/)?.[0] ?? tail(span.out)}`
  );

  // A one-word slug is a record too. The index cites it in backticks, so the
  // index claim must count it: no "not cited by CLAUDE.md" line may appear.
  const notes = runCorpus({ notes: CLEAN });
  expect(
    "green: a one-word debt slug cited in the index exits 0 with no not-cited line",
    notes.status === 0 && !/not cited by CLAUDE\.md/.test(notes.out),
    `exit ${notes.status}: ${notes.out.match(/.*not cited by CLAUDE.*/)?.[0] ?? tail(notes.out)}`
  );
}

// A one-word slug in prose is no index cite. The index cites a record only by
// an index bullet, so `notes` named in a sentence must go red as not cited.
{
  const proseOnly = runCorpus(
    { notes: CLEAN },
    {
      cited: [],
      prose: ["A prose aside names `notes` in backticks, and no index bullet does."],
    }
  );
  expect(
    'red: a one-word debt slug named only in CLAUDE.md prose exits non-zero with "not cited by CLAUDE.md"',
    proseOnly.status !== 0 && /not cited by CLAUDE\.md: notes\b/.test(proseOnly.out),
    `exit ${proseOnly.status}: ${proseOnly.out.match(/.*not cited by CLAUDE.*/)?.[0] ?? tail(proseOnly.out)}`
  );
}

// Path-scoped rule files. The index is CLAUDE.md plus every .claude/rules/*.md.
// Each case names the record it judges, so a red line can only be that record.
{
  // An index bullet in a rule file cites the record, so no orphan line may appear.
  const ruleCites = runCorpus(
    {},
    { records: { [RULE_RECORD]: RULE_DECISION }, rules: { [RULE_PATH]: RULE_CITES_ONE } }
  );
  expect(
    "rules: a record cited by an index bullet only in .claude/rules/x.md exits 0",
    ruleCites.status === 0,
    `exit ${ruleCites.status}: ${ruleCites.out.match(/.*not cited by CLAUDE.*/)?.[0] ?? tail(ruleCites.out)}`
  );

  // A slug bulleted in CLAUDE.md and in a rule file is listed twice in the index.
  const twice = runCorpus({}, { rules: { [RULE_PATH]: RULE_CITES_CLAUDE_TOO } });
  expect(
    "rules: a slug bulleted in CLAUDE.md and a rule file exits non-zero and is named as listed more than once",
    twice.status !== 0 &&
      twice.out.split("\n").some((l) => l.includes("fixture-decision-holds") && /more than once/.test(l)),
    `exit ${twice.status}: ${tail(twice.out)}`
  );

  // A rule file's Open threads bullet needs a Status line on the record it cites.
  const openThread = runCorpus(
    {},
    { records: { [RULE_RECORD]: RULE_DECISION }, rules: { [RULE_PATH]: RULE_OPEN_THREAD } }
  );
  expect(
    'rules: a record under a rule file\'s "## Open threads" with no Status line exits non-zero and names the Status defect',
    openThread.status !== 0 &&
      openThread.out.split("\n").some((l) => l.includes(RULE_RECORD) && /\*\*Status:\*\*/.test(l)),
    `exit ${openThread.status}: ${tail(openThread.out)}`
  );
}

if (failures) {
  console.log(`check-records debts: ${failures} failure(s)`);
  process.exit(1);
}
console.log("check-records debts: all green");
