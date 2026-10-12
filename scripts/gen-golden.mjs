/* Writes shared/fixtures/golden/*.json by running src/view-rules.mjs on the
   shared fixtures with a FIXED clock. The native app must reproduce them.
   An optional argument is the output dir. scripts/check-golden.mjs diffs it. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";
import {
  dateRange, groupPackages, lostMail, parseItems, sortPackages, sortTally,
  tallyGroups, totalsOf,
} from "../src/view-rules.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIX = path.join(ROOT, "shared", "fixtures");
const GOLDEN = path.join(FIX, "golden");
const NOW = Date.parse("2026-08-12T14:03:00Z");

const ledger = JSON.parse(readFileSync(path.join(FIX, "ledger.json"), "utf8")).items;
const csv = Papa.parse(readFileSync(path.join(FIX, "orderwand.csv"), "utf8"), {
  header: true,
  skipEmptyLines: true,
}).data;
const received = { [ledger[0].key]: 1 };
const pkgs = groupPackages(ledger);
const tally = tallyGroups(ledger);

const files = {
  "parse-items.json": parseItems(csv),
  "packages.json": pkgs,
  "tally.json": tally,
  "totals.json": { none: totalsOf(ledger, {}), partial: totalsOf(ledger, received) },
  "lost-mail.json": pkgs.map((p) => ({ gk: p.gk, lost: lostMail(p.date, p.tracking, false, NOW) })),
  "date-range.json": [30, "all"].map((preset) => dateRange({ preset }, NOW)),
  "sort-packages.json": Object.fromEntries(
    ["newest", "oldest", "value", "rate", "seller"].map((k) => [
      k,
      sortPackages(pkgs, k, received).map((p) => p.gk),
    ])
  ),
  "sort-tally.json": Object.fromEntries(
    ["missing", "basis", "ordered", "value", "rate", "name"].map((k) => [
      k,
      sortTally(tally, k, received).map((g) => g.name),
    ])
  ),
};

const write = (dir) => {
  mkdirSync(dir, { recursive: true });
  for (const [n, v] of Object.entries(files))
    writeFileSync(path.join(dir, n), JSON.stringify(v, null, 2) + "\n");
};

write(process.argv[2] ? path.resolve(process.argv[2]) : GOLDEN);
