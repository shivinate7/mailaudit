/* Tiny static server for local preview of the built index.html.

   OPTIONAL. Opening index.html straight off disk works too — file:// was
   measured supporting both localStorage and IndexedDB (Blobs included), so
   nothing the app needs is missing there. The only thing this buys you is a
   scheme that matches production, which matters if you're ever chasing a bug
   that turns on origin behaviour.

   Every origin has its OWN storage — file://, http://localhost:4173 and
   https://shivinate7.github.io are three separate ledgers that cannot see each
   other. Moving data between them means Backup → restore. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2]) || 4173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  const rel = url === "/" ? "index.html" : url.replace(/^\/+/, "");
  const file = path.join(ROOT, rel);
  // don't serve anything above the project root
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": TYPES[path.extname(file)] || "application/octet-stream",
      "cache-control": "no-store", // always serve the latest build
    });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(PORT, () => {
  console.log(`mail day ledger → http://localhost:${PORT}`);
});
