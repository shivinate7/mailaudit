// Takes the panel-paper-fill shots again: the built index.html, Ledger tab, with the
// Sorted by or History panel open, at 375 and 760 px, light, device scale 2.
//   inflow: the page as built (the panel pushes the rows down).
//   none:   the overlay drawn by a style override (a guess at its geometry), panelWrap as built.
//   paper:  the same overlay, plus background: paper on the panel.
//   rule:   paper, plus a 1px line rule at the panel's foot.
// Run from the repo root after `npm install`:
//   node docs/design/shots/panel-paper-fill/capture.mjs
// Set CHROMIUM to a Chromium binary if Playwright's own browser is not installed.
// Prints each frame's readings (document px) as JSON; the mockup's R table holds them.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const OUT = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(OUT, "../../../..");
const C = JSON.parse(readFileSync(path.join(ROOT, "shared/tokens.json"), "utf8"));
const ledger = JSON.parse(readFileSync(path.join(ROOT, "shared/fixtures/ledger.json"), "utf8"));
const STORE_KEY = "mailday:mailday:v1"; // STORE_KEY in test/screens.mjs
const OVERLAY = `
.mdl-lcard:has(> .mdl-panel) { position: relative; overflow: visible; }
.mdl-lcard > .mdl-panel { position: absolute; left: 0; right: 0; z-index: 4; }`;
const FILL = `.mdl-lcard > .mdl-panel { background: ${C.paper}; }`;
const RULE = `.mdl-lcard > .mdl-panel { border-bottom: 1px solid ${C.line}; }`;
const STYLE = { inflow: null, none: OVERLAY, paper: OVERLAY + FILL, rule: OVERLAY + FILL + RULE };
const PANELS = { sort: /^Sorted by/, history: /^History/ };
const ROWS = ["Showing", "Sorted by", "Orders from", "Sync", "History", "Re-import CSV", "Backup", "Reset"];

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const readings = {};
for (const width of [375, 760]) {
  for (const [panel, re] of Object.entries(PANELS)) {
    for (const [mode, css] of Object.entries(STYLE)) {
      const ctx = await browser.newContext({ viewport: { width, height: 812 }, reducedMotion: "reduce", deviceScaleFactor: 2 });
      await ctx.route(/^https?:\/\//, (r) => r.abort());
      await ctx.addInitScript(
        ([k, v]) => {
          try {
            if (!localStorage.getItem(k)) localStorage.setItem(k, v);
          } catch {}
        },
        [STORE_KEY, JSON.stringify({ mailday: 1, ...ledger })]
      );
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(pathToFileURL(path.join(ROOT, "index.html")).href);
      await page.waitForTimeout(1200);
      if (css) await page.addStyleTag({ content: css });
      await page.getByRole("button", { name: /^Ledger/ }).first().click();
      await page.waitForTimeout(300);
      const btn = page.getByRole("button", { name: re });
      await btn.click();
      await page.waitForTimeout(600);
      await btn.evaluate((b) => {
        b.scrollIntoView({ block: "start" });
        window.scrollBy(0, -140);
      });
      await page.waitForTimeout(300);
      const r = await page.evaluate((rows) => {
        const out = { scrollY: Math.round(window.scrollY), rows: {} };
        for (const b of document.querySelectorAll("button")) {
          const t = b.textContent.trim();
          const hit = rows.find((n) => t.startsWith(n));
          if (hit && !(hit in out.rows)) out.rows[hit] = Math.round(b.getBoundingClientRect().top + window.scrollY);
        }
        const p = document.querySelector(".mdl-panel");
        if (p) {
          const q = p.getBoundingClientRect();
          out.panel = { top: Math.round(q.top + window.scrollY), height: Math.round(q.height), width: Math.round(q.width) };
          const card = p.closest(".mdl-lcard");
          if (card) out.cardBottom = Math.round(card.getBoundingClientRect().bottom + window.scrollY);
        }
        return out;
      }, ROWS);
      r.errors = errors;
      readings[`${panel}-${mode}-${width}`] = r;
      await page.screenshot({ path: path.join(OUT, `${panel}-${mode}-${width}-light.png`) });
      await ctx.close();
    }
  }
}
await browser.close();
console.log(JSON.stringify(readings, null, 1));
