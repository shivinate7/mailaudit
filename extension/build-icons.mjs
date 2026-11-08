/* Exports the toolbar icons: favicon_svg() from icon/gen-icon.py, drawn by headless Chromium
   at 16, 32, 48 and 128 px with a transparent ground, into extension/icons/. Run
   `npm run build:extension-icons` after the favicon drawing changes. Not part of
   `npm run build:extension`: PNG bytes are not stable across Chromium builds, so a check would
   flap. The favicon, not the 1024 master, because the master fails at 16 px (record assets-and-icons). */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = `${root}extension/icons`;
const SIZES = [16, 32, 48, 128];

const svg = execFileSync("python3", [
  "-I", "-c",
  "import importlib.util, sys\n"
  + "spec = importlib.util.spec_from_file_location('gen_icon', sys.argv[1])\n"
  + "m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)\n"
  + "sys.stdout.write(m.favicon_svg())",
  `${root}icon/gen-icon.py`,
], { encoding: "utf8" });

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const size of SIZES) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    await page.screenshot({ path: `${out}/icon-${size}.png`, omitBackground: true });
    await page.close();
    console.log(`wrote extension/icons/icon-${size}.png`);
  }
} finally {
  await browser.close();
}
