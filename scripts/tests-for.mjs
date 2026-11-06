// Names the suites that cover one repo path, for the mutation report.
//
//   node scripts/tests-for.mjs <repo-relative path>
//
// Prints the suites, one per line and narrowest first, and exits 0 even with no match. A suite
// is a file the profile's tests regex names (claude-settings hooks/mutate_guard.py, profile
// "mailaudit"): test/<name>.test.mjs or worker/core.test.mjs.
//
//   Tier 1: a suite that imports the path: a static import, an export from, or a dynamic
//           import of a string literal, resolved from the suite's folder.
//   Tier 2: only when tier 1 names no suite but app. A suite that calls spawn, exec, fork or
//           a read function and holds a string literal naming the path by its final segment.
//   test/app.test.mjs is listed only when no other suite covers the path at any tier.
//
// The scan is a tokenizer, so a comment opener inside a string, a template literal, a lone
// quote in a comment or a regex, and import-looking text inside a string never read as code.
// It imports nothing from npm: the replay checkout has no node_modules.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve, posix } from "node:path";
import { fileURLToPath } from "node:url";

const APP = "test/app.test.mjs";
const SUITE = /^(test\/[^/]+|worker\/core)\.test\.mjs$/;
const CALLS = new Set(["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork", "readFile", "readFileSync"]);

const ID_START = /[A-Za-z_$]/;
const ID_PART = /[A-Za-z0-9_$]/;
// After one of these a "/" opens a regex literal. After an identifier, number, ")" or "]" it divides.
const REGEX_AFTER_WORD = new Set(["return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw", "case", "do", "else", "yield", "await"]);

// tokens(text) -> [{ t: "id"|"str"|"tpl"|"re"|"num"|"p", v }]. Comments are dropped. A string token
// carries its value; a template token carries none, and the code inside its ${ } is scanned too.
export function tokens(text) {
  const out = [];
  scan(text, 0, out, false);
  return out;
}

function regexAllowed(out) {
  const last = out[out.length - 1];
  if (!last) return true;
  if (last.t === "id") return REGEX_AFTER_WORD.has(last.v);
  if (last.t === "str" || last.t === "tpl" || last.t === "re" || last.t === "num") return false;
  return last.v !== ")" && last.v !== "]" && last.v !== "}";
}

// Scans from i. With inTemplate, stops at the "}" that closes a ${ and returns its index.
function scan(s, i, out, inTemplate) {
  let depth = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "/" && s[i + 1] === "/") {
      while (i < s.length && s[i] !== "\n") i++;
    } else if (c === "/" && s[i + 1] === "*") {
      const end = s.indexOf("*/", i + 2);
      i = end < 0 ? s.length : end + 2;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      let v = "";
      while (j < s.length && s[j] !== c && s[j] !== "\n") {
        if (s[j] === "\\") {
          v += s[j + 1] ?? "";
          j += 2;
        } else v += s[j++];
      }
      out.push({ t: "str", v });
      i = j + 1;
    } else if (c === "`") {
      i = template(s, i + 1, out);
      out.push({ t: "tpl", v: "" });
    } else if (c === "/" && regexAllowed(out)) {
      let j = i + 1;
      let inClass = false;
      while (j < s.length && s[j] !== "\n") {
        if (s[j] === "\\") j += 2;
        else if (s[j] === "[" || s[j] === "]") {
          inClass = s[j] === "[";
          j++;
        }
        else if (s[j] === "/" && !inClass) break;
        else j++;
      }
      const closed = s[j] === "/"; // no closing slash on the line: a division misread as a regex, so take it alone
      i = closed ? j + 1 : i + 1;
      while (closed && i < s.length && ID_PART.test(s[i])) i++;
      out.push(closed ? { t: "re", v: "" } : { t: "p", v: c });
    } else if (ID_START.test(c)) {
      let j = i + 1;
      while (j < s.length && ID_PART.test(s[j])) j++;
      out.push({ t: "id", v: s.slice(i, j) });
      i = j;
    } else if (/[0-9]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[0-9A-Za-z_.]/.test(s[j])) j++;
      out.push({ t: "num", v: "" });
      i = j;
    } else if (/\s/.test(c)) {
      i++;
    } else {
      if (c === "{") depth++;
      // A } at depth 0 inside a ${ } closes the substitution.
      if (c === "}" && inTemplate && depth === 0) return i;
      if (c === "}") depth--;
      out.push({ t: "p", v: c });
      i++;
    }
  }
  return i;
}

// Skips a template literal body from just after its opening backtick; returns the index after the closing one.
function template(s, i, out) {
  while (i < s.length) {
    if (s[i] === "\\") i += 2;
    else if (s[i] === "`") return i + 1;
    else if (s[i] === "$" && s[i + 1] === "{") i = scan(s, i + 2, out, true) + 1;
    else i++;
  }
  return i;
}

// The string literals that an import, an export from, or a dynamic import names.
function importSpecs(toks) {
  const specs = [];
  for (let k = 0; k < toks.length; k++) {
    const a = toks[k];
    const b = toks[k + 1];
    const c = toks[k + 2];
    if (a.t !== "id") continue;
    if (a.v === "import" && b?.t === "str") specs.push(b.v);
    else if (a.v === "from" && b?.t === "str") specs.push(b.v);
    else if (a.v === "import" && b?.v === "(" && c?.t === "str") specs.push(c.v);
  }
  return specs;
}

const importsPath = (toks, suitePath, target) =>
  importSpecs(toks).some((s) => s.startsWith(".") && posix.join(posix.dirname(suitePath), s) === target);

// A string names the path by its final segment: the bare file name, or a path that ends in it. A path
// built with join() or resolve() is several strings, and the last one is the file name.
function namesPath(value, target) {
  const last = (p) => p.slice(p.lastIndexOf("/") + 1);
  return value !== "" && last(value) === last(target);
}

function spawnsPath(toks, target) {
  const calls = toks.some((t, k) => t.t === "id" && CALLS.has(t.v) && toks[k + 1]?.v === "(");
  return calls && toks.some((t) => t.t === "str" && namesPath(t.v, target));
}

// suitesFor(target, files) where files is [{ path, text }]. Returns suite paths in path order.
export function suitesFor(target, files) {
  const tier1 = [];
  const tier2 = [];
  let app = false;
  for (const { path, text } of files) {
    if (!SUITE.test(path)) continue;
    const toks = tokens(text);
    const imports = importsPath(toks, path, target);
    const spawns = !imports && spawnsPath(toks, target);
    if (path === APP) app = imports || spawns;
    else if (imports) tier1.push(path);
    else if (spawns) tier2.push(path);
  }
  const pick = tier1.length ? tier1 : tier2.length ? tier2 : app ? [APP] : [];
  return pick.sort();
}

function main() {
  const target = process.argv[2];
  if (!target) return;
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const rels = [
    ...(existsSync(join(root, "test")) ? readdirSync(join(root, "test")).map((f) => `test/${f}`) : []),
    "worker/core.test.mjs",
  ].filter((p) => SUITE.test(p) && existsSync(join(root, p)));
  const files = rels.map((path) => ({ path, text: readFileSync(join(root, path), "utf8") }));
  for (const suite of suitesFor(target, files)) console.log(suite);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
