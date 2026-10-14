// Cases for the debts/ record kind in check-records.mjs.
//
// check-records.mjs runs its whole check on import, so each case runs the CLI
// against a temp corpus: a small base corpus plus the debt files under test.
// A defect case must exit non-zero and name the debt it breaks. A green case
// must exit 0. The empty-folder case and the clean case are the controls: if
// either goes red, the defect cases prove nothing.
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
    "decisions/fixture-decision-holds.md": DECISION,
    "measurements/fixture-measure-geometry.md": MEASURE,
    "invariants/.keep": "",
    "debts/.keep": "",
    "src/.keep": "",
    "test/app.test.mjs": "// fixture\n",
    "build.mjs": "// fixture\n",
    "package.json": '{"name":"fixture","private":true,"scripts":{}}\n',
  };
}

// The index lists each cited debt once. It names the debts/ folder unless told
// not to, so one case can prove the folder must be listed.
function claudeMd(cited, { folderListed = true } = {}) {
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
    "## Open threads",
    "",
    "No open threads in this fixture.",
    "",
  ].join("\n");
}

// Writes a temp corpus, runs check-records.mjs in it, returns status and output.
function runCorpus(debts, { cited = Object.keys(debts), folderListed = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "check-records-debts-"));
  try {
    const files = baseFiles(claudeMd(cited, { folderListed }));
    for (const [slug, text] of Object.entries(debts)) {
      files[`debts/${slug}.md`] = text;
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
}

if (failures) {
  console.log(`check-records debts: ${failures} failure(s)`);
  process.exit(1);
}
console.log("check-records debts: all green");
