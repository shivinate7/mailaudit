// Contract tests for scripts/send-key.mjs, the key-delivery script.
// Run: npm run test:send-key. Exits 1 on any failure.
//
// The script's three outside commands are fakes placed first on PATH:
//   security   reads the Keychain. It logs its argv and prints a known key.
//   open       shows a URL or a PNG. It logs its argv. For each .png argv it
//              records whether the file existed and the mode of its directory.
//   osascript  draws the QR. It logs its argv and writes stub bytes to every
//              argv that ends in .png.
// Each fake logs one line per call, with argv joined by spaces.
//
// The contract the script must meet:
//   - It calls the bare names security, open and osascript, so the fakes win.
//   - The key never reaches stdout or stderr. Neither do its first or last 8
//     characters, or the full URL.
//   - The QR output path is a plain argv ending in .png, given to osascript.
//   - The PNG sits in a fresh directory, mode 0700 while it exists. Both the
//     PNG and its directory are removed before the script exits.
//   - A failure prints plain text and opens nothing.
//
// Every case is gated on the script file existing, so a missing script fails
// each case, not just the ones that need it.

import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  chmodSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(REPO, "scripts", "send-key.mjs");
const SCRIPT_PRESENT = existsSync(SCRIPT);

const FAKE_KEY = "f4k3K3y0a1b2c3d4e5f60718293a4b5c6d";
const URL_WITH_KEY = `https://shivinate7.github.io/mailaudit/#k=${FAKE_KEY}`;
const LEAK_TOKENS = [FAKE_KEY, FAKE_KEY.slice(0, 8), FAKE_KEY.slice(-8), URL_WITH_KEY];
const ACCOUNTS = { mac: "macbook", iphone: "iphone" };

let failures = 0;
function expect(label, cond) {
  if (SCRIPT_PRESENT && cond) {
    console.log(`ok   ${label}`);
  } else {
    failures++;
    const why = SCRIPT_PRESENT ? "" : " (scripts/send-key.mjs is missing)";
    console.log(`FAIL ${label}${why}`);
  }
}

const FAKE_SECURITY = String.raw`#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_LOG_DIR/security.log"
if [ -n "$FAKE_SECURITY_FAIL" ]; then
  echo "security: The specified item could not be found in the keychain." >&2
  exit 44
fi
printf '%s\n' "${FAKE_KEY}"
`;

const FAKE_OPEN = String.raw`#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_LOG_DIR/open.log"
for a in "$@"; do
  case "$a" in
    *.png)
      if [ -f "$a" ]; then e=yes; else e=no; fi
      d=$(dirname "$a")
      m=$(stat -c %a "$d" 2>/dev/null || stat -f %Lp "$d")
      printf '%s\t%s\t%s\n' "$a" "$e" "$m" >> "$FAKE_LOG_DIR/open-png.log"
      ;;
  esac
done
`;

const FAKE_OSASCRIPT = String.raw`#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_LOG_DIR/osascript.log"
for a in "$@"; do
  case "$a" in
    *.png) printf 'PNGSTUB' > "$a" ;;
  esac
done
`;

function writeFake(dir, name, body) {
  const p = join(dir, name);
  writeFileSync(p, body);
  chmodSync(p, 0o755);
}

function sandbox() {
  const root = mkdtempSync(join(tmpdir(), "send-key-test-"));
  const sb = {
    root,
    bin: join(root, "bin"),
    tmp: join(root, "tmp"),
    logs: join(root, "logs"),
  };
  for (const d of [sb.bin, sb.tmp, sb.logs]) mkdirSync(d);
  writeFake(sb.bin, "security", FAKE_SECURITY);
  writeFake(sb.bin, "open", FAKE_OPEN);
  writeFake(sb.bin, "osascript", FAKE_OSASCRIPT);
  return sb;
}

function cleanup(sb) {
  rmSync(sb.root, { recursive: true, force: true });
}

function readLog(sb, name) {
  const p = join(sb.logs, name);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

function run(sb, args, { stdin = "\n", securityFails = false } = {}) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: REPO,
    input: stdin,
    encoding: "utf8",
    timeout: 20000,
    env: {
      ...process.env,
      PATH: `${sb.bin}:${process.env.PATH}`,
      TMPDIR: sb.tmp,
      FAKE_LOG_DIR: sb.logs,
      FAKE_SECURITY_FAIL: securityFails ? "1" : "",
    },
  });
  return {
    status: r.status,
    timedOut: r.signal !== null,
    out: r.stdout ?? "",
    err: r.stderr ?? "",
  };
}

const securityLine = (account) =>
  `find-generic-password -s mailaudit-sync -a ${account} -w\n`;
const leaks = (text) => LEAK_TOKENS.some((t) => text.includes(t));
const plainMessage = (err) =>
  err.trim().length > 0 && !/^\s+at /m.test(err) && !/ERR_/.test(err);

// mac: one Keychain read, one open of the URL with its fragment, no QR.
{
  const sb = sandbox();
  try {
    const r = run(sb, ["mac"]);
    expect("mac: exits 0", r.status === 0 && !r.timedOut);
    expect(
      "mac: security read is exact argv (-s mailaudit-sync -a macbook -w)",
      readLog(sb, "security.log") === securityLine(ACCOUNTS.mac)
    );
    expect(
      "mac: open got exactly the URL with the fragment",
      readLog(sb, "open.log") === `${URL_WITH_KEY}\n`
    );
    expect("mac: no QR drawn", readLog(sb, "osascript.log") === null);
    expect("mac: no key bytes in stdout or stderr", !leaks(r.out + r.err));
  } finally {
    cleanup(sb);
  }
}

// iphone: one QR PNG, drawn by osascript, shown by open, then removed with its
// directory after exit.
{
  const sb = sandbox();
  try {
    const r = run(sb, ["iphone"]);
    expect("iphone: exits 0", r.status === 0 && !r.timedOut);
    expect(
      "iphone: security read is exact argv (-a iphone)",
      readLog(sb, "security.log") === securityLine(ACCOUNTS.iphone)
    );
    expect(
      "iphone: osascript drew the QR of the URL with the fragment",
      (readLog(sb, "osascript.log") ?? "").includes(URL_WITH_KEY)
    );
    const rows = (readLog(sb, "open-png.log") ?? "").split("\n").filter((l) => l !== "");
    expect("iphone: open got exactly one PNG argv", rows.length === 1);
    const [png, existed, mode] = (rows[0] ?? "").split("\t");
    expect("iphone: the PNG existed when open ran", existed === "yes");
    expect("iphone: its directory was mode 700 while the PNG existed", mode === "700");
    expect(
      "iphone: the PNG sits in a fresh directory, not the TMPDIR root",
      Boolean(png) && dirname(png) !== sb.tmp
    );
    expect("iphone: open was given the PNG path alone", readLog(sb, "open.log") === `${png}\n`);
    expect("iphone: PNG gone after exit", Boolean(png) && !existsSync(png));
    expect(
      "iphone: PNG directory gone after exit",
      Boolean(png) && !existsSync(dirname(png))
    );
    expect("iphone: no key bytes in stdout or stderr", !leaks(r.out + r.err));
  } finally {
    cleanup(sb);
  }
}

// An unknown device name exits non-zero before any Keychain read.
{
  const sb = sandbox();
  try {
    const r = run(sb, ["laptop"]);
    expect("unknown device: exits non-zero", r.status !== 0 && !r.timedOut);
    expect("unknown device: security never called", readLog(sb, "security.log") === null);
    expect(
      "unknown device: nothing opened or drawn",
      readLog(sb, "open.log") === null && readLog(sb, "osascript.log") === null
    );
    expect("unknown device: plain message on stderr", plainMessage(r.err));
  } finally {
    cleanup(sb);
  }
}

// A failing Keychain read exits non-zero with a plain message, and nothing is
// opened or drawn. Each device gets its own sandbox.
for (const dev of ["mac", "iphone"]) {
  const sb = sandbox();
  try {
    const r = run(sb, [dev], { securityFails: true });
    expect(
      `${dev}, security fails: security was called with the device's account`,
      readLog(sb, "security.log") === securityLine(ACCOUNTS[dev])
    );
    expect(`${dev}, security fails: exits non-zero`, r.status !== 0 && !r.timedOut);
    expect(`${dev}, security fails: plain message on stderr`, plainMessage(r.err));
    expect(`${dev}, security fails: nothing opened`, readLog(sb, "open.log") === null);
    expect(`${dev}, security fails: no QR drawn`, readLog(sb, "osascript.log") === null);
    expect(`${dev}, security fails: no key bytes in stdout or stderr`, !leaks(r.out + r.err));
  } finally {
    cleanup(sb);
  }
}

// Runs the script with a pipe for stdin, and sends SIGINT once the script has
// printed its "press Enter" line, which comes after the fake open has run. The
// script is then waiting on stdin, so the signal lands in the Enter wait.
function runThenInterrupt(sb, args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      cwd: REPO,
      env: {
        ...process.env,
        PATH: `${sb.bin}:${process.env.PATH}`,
        TMPDIR: sb.tmp,
        FAKE_LOG_DIR: sb.logs,
        FAKE_SECURITY_FAIL: "",
      },
    });
    let out = "";
    let err = "";
    let sent = false;
    child.stdout.on("data", (d) => {
      out += d;
      if (!sent && /press Enter/.test(out)) {
        sent = true;
        child.kill("SIGINT");
      }
    });
    child.stderr.on("data", (d) => {
      err += d;
    });
    const guard = setTimeout(() => child.kill("SIGKILL"), 20000);
    child.on("close", (status, signal) => {
      clearTimeout(guard);
      resolve({ status, signal, out, err });
    });
  });
}

// iphone, SIGINT during the Enter wait: the PNG and its directory must still go.
{
  const sb = sandbox();
  try {
    const r = await runThenInterrupt(sb, ["iphone"]);
    const rows = (readLog(sb, "open-png.log") ?? "").split("\n").filter((l) => l !== "");
    const [png] = (rows[0] ?? "").split("\t");
    expect("iphone, SIGINT: open ran, so the PNG was shown", rows.length === 1 && Boolean(png));
    expect("iphone, SIGINT: PNG gone after the signal", Boolean(png) && !existsSync(png));
    expect(
      "iphone, SIGINT: PNG directory gone after the signal",
      Boolean(png) && !existsSync(dirname(png))
    );
    expect("iphone, SIGINT: no key bytes in stdout or stderr", !leaks(r.out + r.err));
  } finally {
    cleanup(sb);
  }
}

if (failures > 0) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nall send-key checks pass");
