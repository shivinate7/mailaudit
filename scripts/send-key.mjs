// Send the sync key to a device. Usage: node scripts/send-key.mjs mac|iphone [--native]
// --native sends manifestledger://sync#k=<key> for the native app, not the Pages URL.
// mac: open the sync URL here. iphone: show a QR of it, scan it, press Enter.
// The key and URL are never printed. The URL is passed as argv, never a shell string.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { KEY_RE } from "../src/sync-rules.mjs";

const run = promisify(execFile);
const ACCOUNTS = { mac: "macbook", iphone: "iphone" };

// AppleScriptObjC: QR via CIFilter, scaled up 10x, written as PNG.
// argv: item 1 = PNG path, item 2 = text to encode.
const QR_SCRIPT = `use framework "Foundation"
use framework "CoreImage"
use framework "AppKit"
on run argv
  set theData to (current application's NSString's stringWithString:(item 2 of argv))'s dataUsingEncoding:(current application's NSUTF8StringEncoding)
  set f to current application's CIFilter's filterWithName:"CIQRCodeGenerator"
  f's setValue:theData forKey:"inputMessage"
  f's setValue:"M" forKey:"inputCorrectionLevel"
  set img to f's outputImage()'s imageByApplyingTransform:(current application's CGAffineTransformMakeScale(10, 10))
  set rep to current application's NSBitmapImageRep's alloc()'s initWithCIImage:img
  set png to rep's representationUsingType:(current application's NSBitmapImageFileTypePNG) |properties|:(missing value)
  png's writeToFile:(item 1 of argv) atomically:true
end run`;

const device = process.argv[2];
const account = ACCOUNTS[device];
const flags = process.argv.slice(3);
const native = flags.includes("--native");
if (!account || flags.some((f) => f !== "--native")) {
  console.error("Usage: send-key.mjs mac|iphone [--native]");
  process.exit(1);
}

let dir;
// the QR holds the key: a signal must not leave it on disk
for (const sig of ["SIGINT", "SIGTERM"])
  process.on(sig, () => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    process.exit(130);
  });
try {
  let key;
  try {
    key = (await run("security", ["find-generic-password", "-s", "mailaudit-sync", "-a", account, "-w"])).stdout.trim();
  } catch {
    throw new Error(`Could not read the ${device} key from the Keychain.`);
  }
  if (native && !KEY_RE.test(key)) throw new Error("Could not use the Keychain key: it has characters the sync key cannot hold.");
  const url = native ? `manifestledger://sync#k=${key}` : `https://shivinate7.github.io/mailaudit/#k=${key}`;
  if (device === "mac") {
    await run("open", [url]);
    console.log("Opened the sync link on this Mac.");
  } else {
    dir = await mkdtemp(join(tmpdir(), "send-key-")); // mkdtemp makes it mode 0700
    const png = join(dir, "qr.png");
    await run("osascript", ["-e", QR_SCRIPT, png, url]);
    await run("open", [png]);
    console.log("QR for the iPhone is open. Scan it, then press Enter to delete it.");
    await new Promise((r) => createInterface({ input: process.stdin }).once("line", r).once("close", r));
  }
} catch (e) {
  console.error(e.message.startsWith("Could not") ? e.message : `send-key failed for ${device}.`);
  process.exitCode = 1;
} finally {
  if (dir) await rm(dir, { recursive: true, force: true });
}
