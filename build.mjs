// Builds the single-file standalone app: src/entry.jsx -> index.html
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";
import { execFileSync } from "child_process";
import { gzipSync } from "zlib";

/* ---------- the public seed ----------
   The site is public; the ledger repo is not. Those are separate artifacts —
   Pages serves `main` root and has never served the `data` branch — so sharing
   the URL hands someone the app with no data in it at all.

   This closes that without reopening the repo: a snapshot is baked INTO
   index.html at build time, so a visitor gets the app and the data in one
   public file, hydrates it into their own localStorage, and can do whatever
   they like with it locally. They still cannot push, because pushing needs a
   token they do not have — that half was never the gap.

   What this publishes is exactly SEED_KEEP and nothing else. `envelopes` is
   deliberately absent: it is where hand-typed notes live, and CLAUDE.md is
   explicit that those carry tracking numbers and sender names. Photos never
   went near the ledger in the first place. Widen this only on purpose — the
   Pages site is world-readable and git is permanent.

   Snapshot, not live: it refreshes when you deploy. */
const SEED_KEEP = ["items", "received", "stamps", "dateFilter", "sortBy", "itemSort"];

function buildSeed() {
  let raw;
  try {
    /* straight off the data branch, which the deploying machine already has —
       no network, no key, and nothing here reaches for the private repo */
    raw = execFileSync("git", ["show", "origin/data:ledger.json"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    console.log("  seed: no origin/data ledger — building without one");
    return null;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.log("  seed: ledger.json did not parse — building without one");
    return null;
  }
  if (!data || !Array.isArray(data.items)) {
    console.log("  seed: not a ledger — building without one");
    return null;
  }
  const out = { mailday: 1 };
  for (const k of SEED_KEEP) if (data[k] !== undefined) out[k] = data[k];
  /* Stamps carry a free-text `note` — "refunded via PayPal", a case number,
     whatever you typed — and withholding envelopes while publishing these
     would be withholding the wrong half. The KIND and the date stay, so the
     status band still reads; only the prose goes. Caught by decoding the built
     page and grepping it, which is the only way to know what you published. */
  if (out.stamps && typeof out.stamps === "object")
    out.stamps = Object.fromEntries(
      Object.entries(out.stamps).map(([gk, v]) => [gk, { ...v, note: "" }])
    );
  const json = JSON.stringify(out);
  /* gzip + base64 rather than raw JSON: the real ledger is ~235KB and deflates
     about tenfold, so the page stays small enough to still feel like a static
     file. entry.jsx inflates it with DecompressionStream, the same primitive
     the version store already uses. */
  const packed = gzipSync(Buffer.from(json, "utf8")).toString("base64");
  console.log(
    `  seed: ${data.items.length} lines, ${(json.length / 1024).toFixed(0)}KB -> ` +
      `${(packed.length / 1024).toFixed(0)}KB inlined` +
      (data.envelopes?.length
        ? ` (${data.envelopes.length} envelopes withheld)`
        : "")
  );
  return packed;
}

const seed = buildSeed();

await build({
  entryPoints: ["src/entry.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  loader: { ".jsx": "jsx" },
  outfile: "dist-bundle.js",
});

const bundle = readFileSync("dist-bundle.js", "utf8");
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
<meta name="theme-color" content="#F2E9DA">
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="icon" sizes="32x32" href="icon-32.png">
<style>html,body,#root{margin:0;padding:0;background:#F2E9DA;-webkit-text-size-adjust:100%}</style>
</head>
<body>
<div id="root"></div>
${seed ? `<script id="seed" type="application/gzip-base64">${seed}</script>\n` : ""}<script>${bundle}</script>
</body>
</html>`;
/* ---------- `node build.mjs --check` ----------
   Is the committed index.html the code in this repo? That is the one thing a
   local `npm run deploy` can skip by accident, and it is worth a machine
   noticing.

   The comparison IGNORES the seed, and that is the design rather than a
   loophole. index.html carries two things: the code, and a snapshot of the
   ledger read off `origin/data` at build time. Only the first is being
   claimed — and the second cannot be compared even in principle, because that
   branch is rewritten by the phone's auto-push on a 90s idle debounce, so a
   rebuild minutes after a deploy legitimately produces different bytes.
   Diffing whole pages therefore fails one of two ways, and CI managed the
   first: ALWAYS, because actions/checkout is single-branch so the runner has
   no origin/data and builds seedless (main was red for four runs on exactly
   this); or AT RANDOM, if you fetch the branch and race the phone. A check
   that cries wolf is worse than none, because it trains you past the alarm.

   So this strips the seed from both sides. It lives here, beside the template
   that writes the tag, so the two cannot drift apart — and if the tag's shape
   ever changes without this following, the guard below says so rather than
   quietly comparing nothing. A stale SEED is harmless in a way stale code is
   not: a visitor sees a slightly older ledger, and the next deploy refreshes
   it. */
const withoutSeed = (page) =>
  page.replace(/<script id="seed"[^>]*>[^<]*<\/script>\n/, "");

if (process.argv.includes("--check")) {
  const a = withoutSeed(readFileSync("index.html", "utf8"));
  const b = withoutSeed(html);
  if (a.includes('id="seed"') || b.includes('id="seed"')) {
    console.error(
      "check: a seed tag survived the strip — the tag's shape changed and\n" +
        "       withoutSeed() in build.mjs did not follow it."
    );
    process.exit(1);
  }
  if (a !== b) {
    console.error("index.html is stale — run npm run deploy");
    process.exit(1);
  }
  console.log("index.html is in step with src/ (seed ignored — it is data)");
} else {
  writeFileSync("index.html", html);
  console.log(`index.html built (${(html.length / 1024).toFixed(0)} KB)`);
}
