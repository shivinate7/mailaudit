// Builds the single-file standalone app: src/entry.jsx -> index.html
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";

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
<title>Mail Day Ledger</title>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Mail Day">
<meta name="theme-color" content="#F4F5F2">
<style>html,body,#root{margin:0;padding:0;background:#F4F5F2;-webkit-text-size-adjust:100%}</style>
</head>
<body>
<div id="root"></div>
<script>${bundle}</script>
</body>
</html>`;
writeFileSync("index.html", html);
console.log(`index.html built (${(html.length / 1024).toFixed(0)} KB)`);
