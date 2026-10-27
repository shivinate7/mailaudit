// A checked reader for the record corpus under invariants/, measurements/,
// docs/decisions/ and docs/debts/ — the files CLAUDE.md was split into. Same spirit as
// check-docs.mjs: nothing here is hand-maintained data. Every count comes
// from walking the real files. Records hold current text only; git keeps
// history. Run with `npm run check:records`.
//
// Eight claims, each with its own section below:
//   1. every citation resolves
//   2. no fence is broken
//   3. no duplicate slug across the record folders
//   4. every record has its shape (title, own prose first, sentence-case title)
//   5. no orphan and no dead index entry
//   6. every invariant names the test that pins it, and no record cites an
//      invariant by number
//   7. every decision holds a "Holds while" line, every open thread a
//      "Status" line, and the index lists no slug twice
//   8. every debt holds a "Status" line and a "Decision" line that names an
//      existing non-debt record or says "none", and CLAUDE.md lists docs/debts/

import { readFileSync, readdirSync } from "fs";
import { execFileSync } from "child_process";

const FOLDERS = ["invariants", "measurements", "decisions", "debts"];
const DIR = (f) => (f === "decisions" || f === "debts" ? `docs/${f}` : f); // layout: docs/decisions, docs/debts

let failures = 0;
let checked = 0;

// ---------- load the corpus ----------

const records = []; // { slug, folder, path, text }
for (const folder of FOLDERS) {
  for (const name of readdirSync(DIR(folder)).sort()) {
    if (!name.endsWith(".md")) continue;
    const slug = name.slice(0, -3);
    const path = `${DIR(folder)}/${name}`;
    records.push({ slug, folder, path, text: readFileSync(path, "utf8") });
  }
}

console.log(`check:records: walked ${records.length} record(s)`);

/* ---------- claim 3: no duplicate slug ----------
   A slug is a record's identity — the thing another record or CLAUDE.md
   cites. Two files sharing one slug across the three folders would make a
   citation ambiguous about which it means, silently. */
{
  const bySlug = new Map();
  for (const r of records) {
    if (!bySlug.has(r.slug)) bySlug.set(r.slug, []);
    bySlug.get(r.slug).push(r.path);
  }
  let dupes = 0;
  for (const [slug, paths] of bySlug) {
    if (paths.length > 1) {
      console.error(`check:records: duplicate slug "${slug}": ${paths.join(", ")}`);
      failures++;
      dupes++;
    }
  }
  console.log(`check:records: ${bySlug.size} distinct slug(s), ${dupes} duplicate(s)`);
}

/* ---------- fence parsing, shared by claims 2 and 4 ----------
   A fence opens on a line (indented at most 3 spaces, CommonMark's own
   allowance) that is nothing but a run of 3+ backticks, optionally followed
   by an info string containing no backtick. It closes on the next such
   backtick-only line whose run is AT LEAST as long as the opener's. Content
   in between is inert: a shorter backtick run inside (the 3-backtick
   ```bash block sitting inside one record's 4-backtick quote) is literal
   text, never a fence of its own, exactly as a real Markdown renderer reads
   it. This is why "balance" cannot be counted by grep on `^```` — that
   miscounts the very record that needed 4 backticks to escape a 3-backtick
   block one level in. */
function parseFences(text) {
  const lines = text.split("\n");
  const fences = []; // { startLine, endLine|null, backtickLen, body: [] }
  let open = null;
  lines.forEach((line, i) => {
    const stripped = line.trimStart();
    const indent = line.length - stripped.length;
    const run = stripped.match(/^`+/)?.[0].length ?? 0;
    const rest = stripped.slice(run);
    const isBacktickLine = run >= 3 && indent <= 3;
    if (open === null) {
      // an opener needs no backtick in its info string (a backtick fence
      // rule) — anything else on the line is fine.
      if (isBacktickLine && !rest.includes("`")) {
        open = { startLine: i + 1, backtickLen: run, body: [] };
      }
    } else {
      // a closer is backticks and nothing else, long enough to match.
      if (isBacktickLine && rest.trim() === "" && run >= open.backtickLen) {
        fences.push({ ...open, endLine: i + 1 });
        open = null;
      } else {
        open.body.push(line);
      }
    }
  });
  const unclosed = open ? { ...open, endLine: null } : null;
  return { fences, unclosed };
}

/* ---------- claim 2: no fence is broken ---------- */
{
  let broken = 0;
  for (const r of records) {
    const { unclosed } = parseFences(r.text);
    if (unclosed) {
      console.error(
        `check:records: ${r.path}:${unclosed.startLine} opens a fence that is never closed`
      );
      failures++;
      broken++;
    }
  }
  console.log(`check:records: ${records.length - broken} record(s) with balanced fences, ${broken} broken`);
}

/* ---------- claim 4: every record has its shape ----------
   - an H1 title on the first line
   - at least one sentence of the record's own prose before the first
     section heading or fence
   - the title is sentence case, not Title Case

   "Title Case" is judged the way the corpus itself was written: one lane
   capitalized every word of its titles (including small words like "the"
   and "is"), the other six capitalized only the first word and proper
   nouns/identifiers. So a title counts as Title Case when MOST of its
   alphabetic words start with a capital — a threshold rather than "every
   word", because a legitimate sentence-case title can still capitalize a
   proper noun (GitHub, Tally, Orphaned) or an identifier (pushForce). A
   title of one or two words is never flagged: there is nothing for "case"
   to mean yet. */
function titleIsTitleCase(title) {
  const words = title.split(/\s+/).map((w) => w.replace(/[^A-Za-z]/g, "")).filter(Boolean);
  if (words.length < 3) return false;
  const capped = words.filter((w) => /^[A-Z]/.test(w)).length;
  return capped / words.length > 0.7;
}

{
  let shaped = 0;
  for (const r of records) {
    const lines = r.text.split("\n");
    const h1 = lines[0];
    if (!/^# .+/.test(h1)) {
      console.error(`check:records: ${r.path}:1 has no H1 title on its first line`);
      failures++;
      continue;
    }
    const { fences } = parseFences(r.text);
    const h2 = lines.findIndex((l, i) => i > 0 && /^## /.test(l));
    const end = Math.min(
      fences.length ? fences[0].startLine - 1 : lines.length,
      h2 < 0 ? lines.length : h2
    );
    const beforeFirstFence = lines.slice(1, end).join("\n");
    const proseSentence = beforeFirstFence
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .join(" ")
      .trim();
    if (!/[.!?]/.test(proseSentence) || proseSentence.length < 10) {
      console.error(
        `check:records: ${r.path}:2 has no sentence of its own prose before the first section or fence`
      );
      failures++;
      continue;
    }
    const title = h1.replace(/^#\s*/, "").trim();
    if (titleIsTitleCase(title)) {
      console.error(
        `check:records: ${r.path}:1 title "${title}" reads as Title Case, not sentence case`
      );
      failures++;
      continue;
    }
    shaped++;
  }
  console.log(`check:records: ${shaped}/${records.length} record(s) have the right shape`);
}

/* ---------- claim 1: every citation resolves ----------
   A citation is a backticked span, OUTSIDE a fence (a fence holds code or sample
   text, not a record's own cross-references), shaped like a slug:
   lowercase words joined by hyphens, at least one hyphen (see SLUG_SHAPE
   below). That shape alone is not enough — the corpus is full of code and CSS
   identifiers that also look like that (`theme-color`, `data-view`,
   `apple-touch-icon`, `force-with-lease`), and a hand-written list of them
   would rot the moment a new one is added.

   So a slug-shaped token is only counted as a CITATION ATTEMPT — something
   that must resolve or fail — when it is close to a real record's slug: an
   exact match, or within edit-distance 2 of one (catches a renamed slug or a
   typo without needing to know which). A token that is not close to any real
   slug is refused: printed and counted, never failed, because nothing here
   can tell "this was meant to name a record" from "this is a CSS property"
   without knowing every future slug in advance — the same shape of refusal
   check-docs.mjs uses for a backtick span that isn't path-like.

   THE CEILING: a slug-shaped token more than 2 edits from every real slug
   (a truncated slug such as `no-layout-shift`, say) is refused, not failed.
   Known ceiling. Claim 6 does not close it: it checks only the token right
   after the word "invariant". */
/* One hyphen is enough. This used to demand two, which made every two-word
   slug invisible: parser-filters, feature-map, suite-size, motion-timings and
   six more. The index cited all of them and the check reported them orphaned,
   which is the shape of a guard that fails by being too narrow rather than by
   going quiet. Widening is safe here, because a token only counts once it
   matches a real file name. */
const SLUG_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)+$/;

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function closestSlug(token, slugs) {
  let best = null;
  let bestDist = Infinity;
  for (const s of slugs) {
    if (Math.abs(s.length - token.length) > 2) continue; // cheap prefilter
    const d = levenshtein(token, s);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return { slug: best, dist: bestDist };
}

{
  const slugSet = new Set(records.map((r) => r.slug));
  const slugList = [...slugSet];
  let resolved = 0;
  let brokenCitations = 0;
  const refusedCounts = new Map();

  for (const r of records) {
    const { fences } = parseFences(r.text);
    const fenceLines = new Set();
    for (const f of fences) {
      for (let i = f.startLine; i <= f.endLine; i++) fenceLines.add(i);
    }
    const lines = r.text.split("\n");
    lines.forEach((line, i) => {
      if (fenceLines.has(i + 1)) return;
      for (const m of line.matchAll(/`([^`\n]+)`/g)) {
        const tok = m[1];
        if (!SLUG_SHAPE.test(tok)) continue;
        if (slugSet.has(tok)) {
          resolved++;
          continue;
        }
        const { slug, dist } = closestSlug(tok, slugList);
        if (slug !== null && dist <= 2) {
          console.error(
            `check:records: ${r.path}:${i + 1} cites \`${tok}\`, which does not exist — closest is \`${slug}\` (edit distance ${dist})`
          );
          failures++;
          brokenCitations++;
        } else {
          refusedCounts.set(tok, (refusedCounts.get(tok) ?? 0) + 1);
        }
      }
    });
  }

  const refusedTotal = [...refusedCounts.values()].reduce((a, b) => a + b, 0);
  console.log(
    `check:records: ${resolved} citation(s) resolved, ${brokenCitations} broken, ${refusedTotal} span(s) refused as not slug-like`
  );
  const topRefused = [...refusedCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [tok, n] of topRefused) console.log(`  refused: \`${tok}\` (${n})`);
  if (process.env.CHECK_RECORDS_VERBOSE) {
    for (const [tok, n] of refusedCounts) console.log(`  refused: \`${tok}\` (${n})`);
  }
}

/* ---------- claim 5: no orphan, and no dead index entry ----------
   CLAUDE.md on this branch is still the long file it always was, not the
   index it is about to become — so this claim is behind an env switch,
   default OFF. The orchestrator turns it on (CHECK_RECORDS_INDEX=1) in the
   commit that actually rewrites CLAUDE.md into an index. Leaving it on by
   default would land a check that is red the moment it merges, and a check
   that cries wolf on landing is worse than no check: nobody would trust the
   next red run either. */
/* This ran behind CHECK_RECORDS_INDEX until the index existed, so it would not
   land red. The index exists now, so the claim is unconditional: an orphaned
   record is one nobody can find, and a dead index entry is a promise the repo
   cannot keep. */
{
  const claude = readFileSync("CLAUDE.md", "utf8");
  const slugSet = new Set(records.map((r) => r.slug));
  const citedInIndex = new Set(
    [...claude.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)+)`/g)]
      .map((m) => m[1])
      .filter((s) => slugSet.has(s))
  );
  const orphans = records.filter((r) => !citedInIndex.has(r.slug));
  const deadEntries = [...claude.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)+)`/g)]
    .map((m) => m[1])
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .filter((s) => !slugSet.has(s) && /-/.test(s));

  if (orphans.length) {
    console.error(
      `check:records: ${orphans.length} record(s) not cited by CLAUDE.md: ${orphans.map((r) => r.slug).join(", ")}`
    );
    failures += orphans.length;
  }
  // deadEntries stays best-effort and never fails on its own: it cannot tell a
  // dead citation from a code token the index happens to mention in backticks,
  // and `data-view` and `theme-color` are both real examples. It is printed so
  // a reader can judge, which is the honest half of a check that cannot decide.
  if (deadEntries.length) console.log(`check:records: index mentions ${deadEntries.length} slug-shaped token(s) that are not records: ${deadEntries.join(", ")}`);
  console.log(
    `check:records: index check — ${records.length - orphans.length}/${records.length} record(s) cited, ${orphans.length} orphan(s)`
  );
}

/* ---------- claim 6: invariants name their tests; numbers are retired ----------
   Owner ruling 2026-10-10: invariants are cited by slug, never by number, and
   each one names the test that pins it. Every invariants/*.md holds a line
   starting "**Pinned by:**" that names at least one test id ("44.5" or
   "group 44") that exists in test/app.test.mjs, or a script that runs tests that exists in package.json:
   `npm run test:*` or `npm run check:screens` may stand alone, but bare
   `npm test` counts only beside a named id or "group N". "nothing yet" is not an answer: a Pinned-by line with no
   real test fails (owner ruling 2026-10-10). A cited id that does not exist
   fails. Any numbered cite of an invariant fails, in records and in
   src/, test/ and build.mjs comments. So does a token right after the word
   "invariant"/"invariants" (a backticked span, or a bare kebab-case word with
   2+ hyphens) that is not one of the invariant slugs fails:
   `invariant storage-keys-frozen` fails, "invariant pre-existing" passes.
   Ceiling: only the token directly after the word is read.
   */
{
  const tests = readFileSync("test/app.test.mjs", "utf8");
  // ids only from the assertion form: a label that opens with the id
  // (`ok(x, "44.5 ...")`, `ok("44.5 ...", x)`, or the label alone on its own line). A fixture
  // price like "2.50" is not followed by a space and has no comma before it.
  const ids = new Set([...tests.matchAll(/(?:[(,]|^)\s*["'`](\d+[a-z]?\.\d+[a-z]?) /gm)].map((m) => m[1]));
  const groups = new Set([...tests.matchAll(/^\/\* (?:──|-{4}) (\d+[a-z]?)\./gm)].map((m) => m[1]));
  const scripts = new Set(Object.keys(JSON.parse(readFileSync("package.json", "utf8")).scripts));
  let bad = 0;
  // numbers are retired: no record, test or source file may cite one. Spans
  // line breaks and hyphens/underscores ("invariant-6", "invariants 2 and 5").
  const numbered = [
    ...records.map((r) => [r.path, r.text]),
    ...["src", "test"].flatMap((d) =>
      readdirSync(d).filter((n) => /\.(mjs|jsx)$/.test(n)).map((n) => [`${d}/${n}`, readFileSync(`${d}/${n}`, "utf8")])),
    ["build.mjs", readFileSync("build.mjs", "utf8")],
  ];
  const invSlugs = new Set(records.filter((r) => r.folder === "invariants").map((r) => r.slug));
  for (const [path, text] of numbered) {
    for (const m of text.matchAll(/\binvariants?[\s\-_]*\d/gi)) {
      console.error(`check:records: ${path}: cites an invariant by number ("${m[0].replace(/\s+/g, " ")}"); cite the slug`);
      bad++;
    }
    for (const m of text.matchAll(/\binvariants?\s+(`[^`]+`|[a-z0-9]+(?:-[a-z0-9]+){2,})/gi)) {
      const tok = m[1].replace(/`/g, "").toLowerCase();
      if (!invSlugs.has(tok)) {
        console.error(`check:records: ${path}: "invariant ${tok}" is not an invariant slug`);
        bad++;
      }
    }
  }
  for (const r of records) {
    if (r.folder !== "invariants") continue;
    const line = r.text.split("\n").find((l) => l.startsWith("**Pinned by:**"));
    if (!line) {
      console.error(`check:records: ${r.path}: no "**Pinned by:**" line`);
      bad++;
      continue;
    }
    const cited = [
      ...[...line.matchAll(/\b(\d+[a-z]?\.\d+[a-z]?)\b/g)].map((m) => ["id", m[1]]),
      ...[...line.matchAll(/\bgroup (\d+[a-z]?)\b/gi)].map((m) => ["group", m[1]]),
      ...[...line.matchAll(/npm (?:run )?(test(?::[\w-]+)?|check:screens)\b/g)].map((m) => ["script", m[1]]),
    ];
    if (!cited.some(([k, v]) => k !== "script" || v !== "test")) {
      console.error(`check:records: ${r.path}: "Pinned by" names no real test (a test id or "group N"; bare npm test does not count alone)`);
      bad++;
    }
    for (const [kind, id] of cited) {
      if (!(kind === "id" ? ids : kind === "group" ? groups : scripts).has(id)) {
        console.error(`check:records: ${r.path}: pinned by ${kind} ${id}, which does not exist in ${kind === "script" ? "package.json" : "test/app.test.mjs"}`);
        bad++;
      }
    }
  }
  failures += bad;
  console.log(`check:records: pins check — ${bad} problem(s)`);
}

/* ---------- claim 7: decisions hold while something; open threads carry a status; the index lists a slug once ----------
   Every docs/decisions/*.md holds a "**Holds while:**" line (the fact that dates it,
   see records-name-what-dates-them). Every record CLAUDE.md lists under
   "## Open threads" holds a "**Status:**" line. CLAUDE.md lists no slug twice. */
{
  let bad = 0;
  const claude = readFileSync("CLAUDE.md", "utf8");
  for (const r of records) {
    if (r.folder === "decisions" && !/^\*\*Holds while:\*\*/m.test(r.text)) {
      console.error(`check:records: ${r.path}: no "**Holds while:**" line`);
      bad++;
    }
  }
  if (!/^## Open threads$/m.test(claude)) {
    console.error('check:records: CLAUDE.md has no "## Open threads" heading, so no status line can be judged');
    bad++;
  }
  const open = (claude.split(/^## Open threads$/m)[1] ?? "").split(/^## /m)[0];
  for (const m of open.matchAll(/^- `([a-z0-9-]+)`/gm)) {
    const r = records.find((x) => x.slug === m[1]);
    if (r && !/^\*\*Status:\*\*/m.test(r.text)) {
      console.error(`check:records: ${r.path}: open record has no "**Status:**" line`);
      bad++;
    }
  }
  const seen = new Set();
  for (const m of claude.matchAll(/^- `([a-z0-9-]+)`/gm)) {
    if (seen.has(m[1])) {
      console.error(`check:records: CLAUDE.md lists \`${m[1]}\` more than once`);
      bad++;
    }
    seen.add(m[1]);
  }
  failures += bad;
  console.log(`check:records: holds-while, status and index-once check - ${bad} problem(s)`);
}

/* ---------- claim 8: debts point at their decision ----------
   Owner ruling 2026-10-14: each known gap is one file under docs/debts/, and it
   points at the decision it belongs to (global rule roles-holes-are-debts).
   A debt holds a "**Status:**" line and one or more "**Decision:**" lines, all
   outside any fence. Every Decision line backticks the slug of a record in invariants/,
   measurements/ or docs/decisions/ (never another debt, never itself), or says
   "none" for a gap with no decision. Claim 1 cannot judge this: it refuses a
   slug that is far from every real one. CLAUDE.md lists the docs/debts/ folder. */
{
  let bad = 0;
  const debts = records.filter((r) => r.folder === "debts");
  const targets = new Set(records.filter((r) => r.folder !== "debts").map((r) => r.slug));
  for (const r of debts) {
    const { fences } = parseFences(r.text);
    const fenced = new Set();
    for (const f of fences) for (let i = f.startLine; i <= f.endLine; i++) fenced.add(i);
    const prose = r.text.split("\n").filter((_, i) => !fenced.has(i + 1));
    if (!prose.some((l) => /^\*\*Status:\*\*/.test(l))) {
      console.error(`check:records: ${r.path}: no "**Status:**" line`);
      bad++;
    }
    const lines = prose.filter((l) => /^\*\*Decision:\*\*/.test(l));
    if (!lines.length) {
      console.error(`check:records: ${r.path}: no "**Decision:**" line`);
      bad++;
      continue;
    }
    for (const line of lines) {
      // Only a slug-shaped span is a citation; `# note` is prose in a span.
      const cited = [...line.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
      if (!cited.length && !/^\*\*Decision:\*\*\s*none\b/i.test(line)) {
        console.error(`check:records: ${r.path}: "Decision" names no record and does not say "none"`);
        bad++;
      }
      for (const slug of cited) {
        if (!targets.has(slug)) {
          console.error(`check:records: ${r.path}: Decision cites \`${slug}\`, which is not a record in invariants/, measurements/ or docs/decisions/`);
          bad++;
        }
      }
    }
  }
  if (!/\bdebts\//.test(readFileSync("CLAUDE.md", "utf8"))) {
    console.error("check:records: CLAUDE.md does not list the docs/debts/ folder");
    bad++;
  }
  failures += bad;
  console.log(`check:records: debts check - ${debts.length} debt(s), ${bad} problem(s)`);
}

if (failures) {
  console.error(`check:records: ${failures} problem(s) found`);
  process.exit(1);
}
console.log("check:records: the record corpus checks out");
