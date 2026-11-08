/* The options page. It never reads the device key: it sends a pasted key to the background
   worker and gets back only whether one is saved. Everything it shows comes from one "state"
   message to the background. Answers go in two fixed slots, so nothing moves under the pointer. */
import { nextPullAt, timeText, whenText } from "./core.mjs";

const STORE_URL = "https://store.tcgplayer.com/myaccount/orderhistory";
const DISARM_MS = 6000;

/* Per failure kind: what happened, the fix, and the one control that leads on. The text is the
   mockup's (docs/design/orders-extension/options.html). "server" is the one kind it lacks. */
const FAILURES = {
  "signed-out": { what: "Signed out of TCGplayer", fix: "Open TCGplayer and sign in, then load any store page.", act: "open" },
  fetch: { what: "TCGplayer did not answer the order page", fix: "TCGplayer may be down or busy. Pull again in a few minutes." },
  timeout: { what: "An order page took over 30 seconds", fix: "TCGplayer is slow right now. Pull again later." },
  empty: { what: "The order page held no orders", fix: "TCGplayer may have sent its sign-in page. Open TCGplayer and sign in, then pull.", act: "open" },
  "no-items": { what: "No TCGplayer card orders in the last 120 days", fix: "Nothing was added. If you ordered cards in that time, report it: the order page may have changed." },
  unreadable: { what: (f) => `${f.count ?? "Some"} ${f.count === 1 ? "line" : "lines"} could not be read and ${f.count === 1 ? "was" : "were"} left out`, fix: "The other lines were added. Nothing was guessed. If the same orders stay out, report it: the order page may have changed." },
  unauthorized: { what: "The server refused the device key", fix: "Paste the device key again and press Save key.", act: "key" },
  network: { what: "The ledger server did not answer", fix: "Check the connection, then pull again. Nothing was sent." },
  "too-large": { what: "The order pages were too large to send", fix: "Nothing was added. This needs a change to the extension or the server. Report it." },
  server: { what: "The ledger server reported an error", fix: "Pull again in a few minutes. If it happens again, report it." },
};

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const ask = (msg) => chrome.runtime.sendMessage(msg);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/* Answers that come from a press stay until the next press. Everything else is derived. */
let keyAnswer = null; // {text, cls}
let pullAnswer = null; // {text, store}
let armedTimer = null;
let last = null;

function setAnswer(node, text, cls = "") {
  node.textContent = text;
  node.className = `answer ${cls}`.trim();
}

function renderKey(s) {
  $("key-state").textContent = s.hasKey ? "A key is saved." : "No key saved.";
  $("key-state").className = s.hasKey ? "v" : "v soft";
  $("key-input").placeholder = s.hasKey ? "Paste a new key" : "Paste the device key";
  $("key-clear").hidden = !s.hasKey;
  if (!s.hasKey) disarm();
  const answer = $("key-answer");
  if ($("key-clear").classList.contains("armed")) return;
  if (keyAnswer) setAnswer(answer, keyAnswer.text, keyAnswer.cls);
  else if (s.hasKey && s.failure?.kind === "unauthorized") setAnswer(answer, `The server refused this key at ${timeText(s.failure.at)}.`, "bad");
  else setAnswer(answer, "");
}

function renderPull(s) {
  const btn = $("pull");
  btn.textContent = s.pulling ? "Pulling" : "Pull now";
  btn.disabled = !s.hasKey || s.pulling;
  const text = $("pull-text");
  const open = $("open-store");
  open.hidden = true;
  let why = "";
  if (!s.hasKey) why = "Save a device key first.";
  else if (s.pulling) why = "Pulling your order pages…";
  else if (pullAnswer) {
    why = pullAnswer.text;
    open.hidden = !pullAnswer.store;
  }
  text.textContent = why;
}

function failureBlock(f) {
  const info = FAILURES[f.kind] ?? { what: "The last pull failed", fix: "Pull again. If it happens again, report it." };
  const box = el("div", "fail");
  box.setAttribute("role", "status");
  box.append(el("div", "what", `${typeof info.what === "function" ? info.what(f) : info.what}.`));
  box.append(el("div", "when", whenText(f.at)));
  box.append(el("div", "fix", info.fix));
  if (info.act) {
    const acts = el("div", "acts");
    const b = el("button", "cell go", info.act === "open" ? "Open TCGplayer" : "Go to the key field");
    b.type = "button";
    b.addEventListener("click", () => (info.act === "open" ? chrome.tabs.create({ url: STORE_URL }) : $("key-input").focus()));
    acts.append(b);
    box.append(acts);
  }
  const details = el("details");
  details.append(el("summary", "", "What the extension recorded"), el("code", "", f.kind));
  box.append(details);
  return box;
}

function renderFailure(s) {
  const host = $("fail");
  host.replaceChildren(s.failure ? failureBlock(s.failure) : el("div", "none", "None."));
}

function row(parts, k, v, cls = "v") {
  parts.append(el("span", "k", k), el("span", cls, v));
}

function renderRun(s) {
  const parts = $("run");
  parts.replaceChildren();
  if (!s.run) {
    row(parts, "When", "Never. The first pull runs when a store page loads.", "v soft");
    return;
  }
  row(parts, "When", whenText(s.run.at));
  const outcome = el("span", "v", s.run.ok ? "Pulled." : "Failed.");
  if (s.run.ok && Number.isInteger(s.run.orders)) {
    const added = s.run.added > 0 ? plural(s.run.added, "new line", "new lines") : "no new lines";
    outcome.append(" ", el("span", "fig", `${plural(s.run.orders, "order", "orders")} read, ${added}`));
  }
  parts.append(el("span", "k", "Outcome"), outcome);
  if (!s.run.ok && s.lastSuccessAt) row(parts, "Last pulled", whenText(s.lastSuccessAt));
  const at = nextPullAt(s.lastSuccessAt, Date.now());
  /* The time alone reads as today, so a time on another day carries its day. */
  const sameDay = at && new Date(at).toDateString() === new Date().toDateString();
  const next = s.pulling ? "now" : at ? `after ${sameDay ? timeText(at) : whenText(at)}, on the next store page load` : "on the next store page load";
  row(parts, "Next", next, "v soft");
}

function render(s) {
  last = s;
  renderKey(s);
  renderPull(s);
  renderFailure(s);
  renderRun(s);
}

async function refresh() {
  const s = await ask({ type: "state" });
  if (s && !s.error) render(s);
}

/* ---------- key ---------- */

function disarm() {
  clearTimeout(armedTimer);
  const b = $("key-clear");
  b.classList.remove("armed");
  b.textContent = "Clear key";
}

$("key-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("key-input");
  const key = input.value;
  input.value = "";
  if (!key.trim()) {
    keyAnswer = { text: "Paste a key first.", cls: "bad" };
    return render(last);
  }
  const r = await ask({ type: "saveKey", key });
  keyAnswer = !r?.saved
    ? { text: "The key was not saved.", cls: "bad" }
    : r.check === "accepted"
      ? { text: "Saved. The server accepted this key.", cls: "ok" }
      : r.check === "refused"
        ? { text: "The server refused this key.", cls: "bad" }
        : { text: "Saved. The server did not answer, so the key is not checked.", cls: "" };
  pullAnswer = null;
  await refresh();
});

$("key-clear").addEventListener("click", async () => {
  const b = $("key-clear");
  if (!b.classList.contains("armed")) {
    b.classList.add("armed");
    b.textContent = "Press to clear";
    setAnswer($("key-answer"), "Press again to clear. Pulls stop until a key is saved.", "bad");
    armedTimer = setTimeout(() => {
      disarm();
      if (last) renderKey(last);
    }, DISARM_MS);
    return;
  }
  disarm();
  await ask({ type: "clearKey" });
  keyAnswer = { text: "Key cleared.", cls: "" };
  pullAnswer = null;
  await refresh();
});

/* ---------- pull ---------- */

$("pull").addEventListener("click", async () => {
  keyAnswer = null;
  const r = await ask({ type: "pull" });
  pullAnswer = r?.started || r?.reason === "running" ? null
    : r?.reason === "no-tab" ? { text: "No store.tcgplayer.com tab is open.", store: true }
    : { text: "The pull did not start.", store: false };
  await refresh();
});

$("open-store").addEventListener("click", () => chrome.tabs.create({ url: STORE_URL }));

/* The background says when a pull starts or ends, and when the key changes. */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "changed") {
    if (last?.pulling) pullAnswer = null;
    refresh();
  }
});

refresh();
