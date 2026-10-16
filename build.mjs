// Builds the single-file standalone app: src/entry.jsx -> index.html
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "fs";

/* ---------- the rules bundle (rules-run-in-javascriptcore) ----------
   The Swift client runs the same pure rules modules in JavaScriptCore. One
   esbuild IIFE exposes them all as the global `Rules`; the RulesEngine actor
   calls `Rules[name](...args)`. The merge rules stay out: the merge has one
   home, the Worker. Built in memory (write:false), so --check-rules compares
   bytes without touching the tree. This runs before the app
   build, so the check needs neither git nor a ledger remote. */
const RULES_OUT = "native/ManifestKit/Sources/ManifestKit/rules.js";
async function buildRules() {
  const r = await build({
    stdin: {
      contents: ["view", "sync", "version", "photo"]
        .map((m) => `export * from "./src/${m}-rules.mjs";`)
        .join("\n"),
      resolveDir: process.cwd(),
    },
    bundle: true,
    minify: true,
    format: "iife",
    globalName: "Rules",
    // esbuild exports are getter-only; a plain copy lets a test swap one rule (PackagesToggleTests).
    footer: { js: "Rules=Object.assign({},Rules);" },
    write: false,
  });
  return r.outputFiles[0].text;
}
if (process.argv.includes("--check-rules")) {
  let committed = null;
  try {
    committed = readFileSync(RULES_OUT, "utf8");
  } catch {}
  if (committed === null) {
    console.error(`check: ${RULES_OUT} is missing — run npm run build and commit it.`);
    process.exit(1);
  }
  if (committed !== (await buildRules())) {
    console.error(`check: ${RULES_OUT} is stale — run npm run build and commit it.`);
    process.exit(1);
  }
  console.log("rules.js is in step with src/");
  process.exit(0);
}

await build({
  entryPoints: ["src/entry.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  loader: { ".jsx": "jsx" },
  outfile: "dist-bundle.js",
});

const bundle = readFileSync("dist-bundle.js", "utf8");
const { paper } = JSON.parse(readFileSync("shared/tokens.json", "utf8"));
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Manifest</title>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Mail Day">
<meta name="theme-color" content="${paper}">
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="icon" sizes="32x32" href="icon-32.png">
<style>html,body,#root{margin:0;padding:0;background:${paper};-webkit-text-size-adjust:100%}</style>
</head>
<body>
<div id="root"></div>
<script>${bundle}</script>
</body>
</html>`;
/* ---------- `node build.mjs --check` ----------
   Is the committed index.html the code in this repo? That is the one thing a
   local `npm run deploy` can skip by accident, and it is worth a machine
   noticing. The page is built from src/ alone, so the whole page is compared. */

/* ---------- `node build.mjs --check-seed` ----------
   The page publishes no ledger data (owner ruling 2026-10-14: the public seed
   is gone). The Pages site is world-readable and git keeps every version, so
   this stays as the backstop: it refuses a data script tag and a ledger-shaped
   payload in the committed page. A backstop, not a proof: it refuses only the
   shapes someone already thought of. */
function checkSeed() {
  const page = readFileSync("index.html", "utf8");
  const leaks = [];
  if (/<script id="seed"/.test(page)) leaks.push('index.html carries a <script id="seed"> tag');
  if (/type="application\/gzip-base64"/.test(page)) leaks.push("index.html carries a packed data script");
  if (/\{"mailday":1,/.test(page)) leaks.push("index.html carries a ledger payload");
  if (leaks.length) {
    for (const l of leaks) console.error(`check: ${l}`);
    return 1;
  }
  console.log("check: index.html publishes no ledger data");
  return 0;
}

if (process.argv.includes("--check")) {
  if (readFileSync("index.html", "utf8") !== html) {
    console.error("index.html is stale — run npm run build and commit it");
    process.exit(1);
  }
  console.log("index.html is in step with src/");
} else if (process.argv.includes("--check-seed")) {
  process.exit(checkSeed());
} else {
  writeFileSync("index.html", html);
  mkdirSync("native/ManifestKit/Sources/ManifestKit", { recursive: true });
  writeFileSync(RULES_OUT, await buildRules());
  console.log(`index.html built (${(html.length / 1024).toFixed(0)} KB)`);
}
