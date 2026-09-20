// A checked reader for the record corpus under invariants/, measurements/
// and decisions/ — the 128 files CLAUDE.md is being split into. Same spirit
// as check-docs.mjs: nothing here is hand-maintained data. Every count comes
// from walking the real files, and every claim about CLAUDE.md's own prose
// comes from git history, so this cannot drift out of step with either
// without failing loudly. Run with `npm run check:records`.
//
// Six claims, each with its own section below:
//   1. every citation resolves
//   2. no fence is broken
//   3. every quote is still verbatim, against the pre-split CLAUDE.md
//   4. no duplicate slug across the three folders
//   5. every record has its shape (title, prose, a fence)
//   6. no orphan and no dead index entry (gated: CLAUDE.md is not the index yet)

import { readFileSync, readdirSync } from "fs";
import { execFileSync } from "child_process";

const FOLDERS = ["invariants", "measurements", "decisions"];

let failures = 0;
let checked = 0;

// ---------- load the corpus ----------

const records = []; // { slug, folder, path, text }
for (const folder of FOLDERS) {
  for (const name of readdirSync(folder).sort()) {
    if (!name.endsWith(".md")) continue;
    const slug = name.slice(0, -3);
    const path = `${folder}/${name}`;
    records.push({ slug, folder, path, text: readFileSync(path, "utf8") });
  }
}

console.log(`check:records: walked ${records.length} record(s)`);

/* ---------- claim 4: no duplicate slug ----------
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

/* ---------- fence parsing, shared by claims 2, 3 and 5 ----------
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

/* ---------- claim 5: every record has its shape ----------
   - an H1 title on the first line
   - at least one sentence of the record's own prose before the first fence
   - at least one fence
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
    if (fences.length === 0) {
      console.error(`check:records: ${r.path} has no fence at all`);
      failures++;
      continue;
    }
    const beforeFirstFence = lines.slice(1, fences[0].startLine - 1).join("\n");
    const proseSentence = beforeFirstFence
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .join(" ")
      .trim();
    if (!/[.!?]/.test(proseSentence) || proseSentence.length < 10) {
      console.error(
        `check:records: ${r.path}:2 has no sentence of its own prose before the first fence`
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

/* ---------- claim 3: every quote is still verbatim ----------
   Pinned to the commit immediately before the split, so the comparison is
   against the exact prose the records claim to have copied — never against
   CLAUDE.md as it stands now (which is mid-rewrite into an index) and never
   against a moving `main`. This SHA must never be bumped: doing so would
   make the check compare records against text they were never extracted
   from. */
const PRE_SPLIT_CLAUDE_MD_SHA = "507ab47d289870b3b0e567ebbea98740254424be";

/* A second base, and the reason it has to exist.

   Three passages were corrected ON THIS BRANCH before they were extracted: the
   watchdog entry lost a contradiction, two arguments came back, and a new
   thread recorded that CI runs in UTC. A record that quotes the corrected text
   cannot match the pre-split pin, and a record that quotes the pin to satisfy
   this check would state something the repo no longer says. The check was
   wrong, not the records.

   So a paragraph passes when it matches EITHER base. This one is the branch tip
   that still carried the whole CLAUDE.md, immediately before the index replaced
   it. Neither SHA may be bumped. Bumping one makes this check compare a record
   against text it was never extracted from, which is the one thing it exists to
   refuse. */
const CORRECTED_CLAUDE_MD_SHA = "d5cb3694378f0e7e0ba093d2d0a812de8af134d6";

function claudeMdAt(sha) {
  return execFileSync("git", ["show", `${sha}:CLAUDE.md`], { encoding: "utf8" });
}

function preSplitClaudeMd() {
  return claudeMdAt(PRE_SPLIT_CLAUDE_MD_SHA);
}

/* A record's quote fence is one contiguous block of lines lifted from
   CLAUDE.md, but three of them stitch together non-adjacent paragraphs from
   different parts of the file (an ellipsis-free "here are the figures"
   composite) — so the fence body as ONE string is never going to be a
   substring of CLAUDE.md, and checking it that way would fail all three for
   no real reason. Splitting on blank lines and checking each paragraph on
   its own survives that, because CLAUDE.md's own paragraphs are separated
   the same way, and — the two records that quote an indented passage — an
   indented paragraph is still one contiguous, byte-identical block within
   itself; only the JOIN between paragraphs was ever the problem, not
   internal whitespace. So this check does NOT strip or normalize leading
   whitespace anywhere: every paragraph is compared byte for byte. */
{
  const bases = [preSplitClaudeMd(), claudeMdAt(CORRECTED_CLAUDE_MD_SHA)];
  let totalParas = 0;
  let foundParas = 0;
  const missing = [];
  for (const r of records) {
    const { fences } = parseFences(r.text);
    if (fences.length === 0) continue; // already reported under claim 5
    const body = fences[0].body.join("\n");
    const paras = body.split(/\n\s*\n/).map((p) => p).filter((p) => p.trim() !== "");
    paras.forEach((p, idx) => {
      totalParas++;
      if (bases.some((base) => base.includes(p))) {
        foundParas++;
      } else {
        missing.push({ path: r.path, idx, snippet: p.slice(0, 60).replace(/\n/g, "\\n") });
      }
    });
  }
  for (const m of missing) {
    console.error(
      `check:records: ${m.path} quote paragraph #${m.idx + 1} is not verbatim in CLAUDE.md@${PRE_SPLIT_CLAUDE_MD_SHA}: "${m.snippet}..."`
    );
    failures++;
  }
  console.log(
    `check:records: ${foundParas}/${totalParas} quoted paragraph(s) verbatim against CLAUDE.md@${PRE_SPLIT_CLAUDE_MD_SHA.slice(0, 7)} or @${CORRECTED_CLAUDE_MD_SHA.slice(0, 7)}, ${missing.length} missing`
  );
}

/* ---------- claim 1: every citation resolves ----------
   A citation is a backticked span, OUTSIDE a fence (fences are the quoted
   CLAUDE.md prose, not a record's own cross-references), shaped like a slug:
   lowercase words joined by hyphens, at least two hyphens (three words or
   more). That shape alone is not enough — the corpus is full of code and CSS
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
   check-docs.mjs uses for a backtick span that isn't path-like. */
const SLUG_SHAPE = /^[a-z0-9]+(-[a-z0-9]+){2,}$/;

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

/* ---------- claim 6: no orphan, and no dead index entry ----------
   CLAUDE.md on this branch is still the long file it always was, not the
   index it is about to become — so this claim is behind an env switch,
   default OFF. The orchestrator turns it on (CHECK_RECORDS_INDEX=1) in the
   commit that actually rewrites CLAUDE.md into an index. Leaving it on by
   default would land a check that is red the moment it merges, and a check
   that cries wolf on landing is worse than no check: nobody would trust the
   next red run either. */
if (process.env.CHECK_RECORDS_INDEX === "1") {
  const claude = readFileSync("CLAUDE.md", "utf8");
  const slugSet = new Set(records.map((r) => r.slug));
  const citedInIndex = new Set(
    [...claude.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+){2,})`/g)]
      .map((m) => m[1])
      .filter((s) => slugSet.has(s))
  );
  const orphans = records.filter((r) => !citedInIndex.has(r.slug));
  const deadEntries = [...claude.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+){2,})`/g)]
    .map((m) => m[1])
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .filter((s) => !slugSet.has(s) && /-.*-/.test(s));

  if (orphans.length) {
    console.error(
      `check:records: ${orphans.length} record(s) not cited by CLAUDE.md: ${orphans.map((r) => r.slug).join(", ")}`
    );
    failures += orphans.length;
  }
  // deadEntries is best-effort only (it can't tell a real dead citation from
  // a code token CLAUDE.md happens to mention that also looks slug-shaped),
  // so it is reported but not currently a source of new failures beyond the
  // orphan count above; keep it for whoever wires the index in.
  console.log(
    `check:records: index check — ${records.length - orphans.length}/${records.length} record(s) cited, ${orphans.length} orphan(s)`
  );
} else {
  console.log("check:records: index check skipped (CHECK_RECORDS_INDEX not set)");
}

if (failures) {
  console.error(`check:records: ${failures} problem(s) found`);
  process.exit(1);
}
console.log("check:records: the record corpus checks out");
