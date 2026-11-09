/* The options page. It never reads the device key: it sends a pasted key to the background
   worker and gets back only whether one is saved. It draws the background's local "state" at
   once, then merges the Worker's own record ("status") when that arrives, so a slow server holds
   nothing back. Until it knows, a block says so and never claims it is empty. Answers go in two
   fixed slots, so nothing moves under the pointer. */
import { mergeStatus, nextPullAt, timeText, whenText } from "./core.mjs";

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
  "bad body": { what: "The order pages were too large to send", fix: "Nothing was added. This needs a change to the extension or the server. Report it." },
  server: { what: "The ledger server reported an error", fix: "Pull again in a few minutes. If it happens again, report it." },
};

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
/* A background that does not answer reads as null. */
const ask = (msg) => chrome.runtime.sendMessage(msg).catch(() => null);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/* Answers that come from a press stay until the next press. Everything else is derived. */
let keyAnswer = null; // {text, cls}
let pullAnswer = null; // {text, store}
let armedTimer = null;
let last = null; // the background's local state, or null until it first answers
/* The Worker's record: undefined while unknown, null when there is none or it did not answer. */
let server;
let stateSeq = 0;
let inflight = null;

function setAnswer(node, text, cls = "") {
  node.textContent = text;
  node.className = `answer ${cls}`.trim();
}

function renderKey(s, failure) {
  $("key-state").textContent = s.hasKey ? "A key is saved." : "No key saved.";
  $("key-state").className = s.hasKey ? "v" : "v soft";
  $("key-input").placeholder = s.hasKey ? "Paste a new key" : "Paste the device key";
  $("key-clear").hidden = !s.hasKey;
  if (!s.hasKey) disarm();
  const answer = $("key-answer");
  if ($("key-clear").classList.contains("armed")) return;
  if (keyAnswer) setAnswer(answer, keyAnswer.text, keyAnswer.cls);
  else if (s.hasKey && failure?.kind === "unauthorized") setAnswer(answer, `The server refused this key at ${timeText(failure.at)}.`, "bad");
  else setAnswer(answer, "");
}

function renderPull(s) {
  const btn = $("pull");
  btn.textContent = s.pulling ? "Pulling" : "Pull now";
  btn.disabled = !s.hasKey || s.pulling;
  const text = $("pull-text");
  const open = $("open-store");
  open.hidden = true;
  $("stop").hidden = !(s.pulling && s.stoppable);
  /* A new pull replaces the note about a stopped one. */
  if (s.pulling && pullAnswer?.stopped) pullAnswer = null;
  let why = "";
  if (!s.hasKey) why = "Save a device key first.";
  else if (s.pulling) why = !s.stoppable ? "Sending the orders to the ledger server…" : s.page ? `Pulling order page ${s.page}…` : "Pulling order pages…";
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

function renderFailure(shown) {
  const host = $("fail");
  if (shown.failure) host.replaceChildren(failureBlock(shown.failure));
  else host.replaceChildren(el("div", "none", server === undefined ? "Checking…" : "None."));
}

function row(parts, k, v, cls = "v") {
  parts.append(el("span", "k", k), el("span", cls, v));
}

function renderRun(s, shown) {
  const parts = $("run");
  parts.replaceChildren();
  const run = shown.run;
  if (!run) {
    if (server === undefined) row(parts, "When", "Checking…", "v soft");
    else row(parts, "When", "Never. The first pull runs when a store page loads.", "v soft");
    return;
  }
  row(parts, "When", whenText(run.at));
  const outcome = el("span", "v", run.ok ? "Pulled." : "Failed.");
  if (run.ok && Number.isInteger(run.orders)) {
    const added = run.added > 0 ? plural(run.added, "new line", "new lines") : "no new lines";
    outcome.append(" ", el("span", "fig", `${plural(run.orders, "order", "orders")} read, ${added}`));
  }
  parts.append(el("span", "k", "Outcome"), outcome);
  if (!run.ok && s.lastSuccessAt) row(parts, "Last pulled", whenText(s.lastSuccessAt));
  const at = nextPullAt(s.lastSuccessAt, Date.now());
  /* The time alone reads as today, so a time on another day carries its day. */
  const sameDay = at && new Date(at).toDateString() === new Date().toDateString();
  const next = s.pulling ? "now" : at ? `after ${sameDay ? timeText(at) : whenText(at)}, on the next store page load` : "on the next store page load";
  row(parts, "Next", next, "v soft");
}

/* The local record, or the Worker's later one when it has it. Not drawn until local is known. */
function render() {
  if (!last) return;
  const local = { run: last.run, failure: last.failure };
  const shown = server ? mergeStatus(local, server) : local;
  renderKey(last, shown.failure);
  renderPull(last);
  renderFailure(shown);
  renderRun(last, shown);
}

function renderUnreadable() {
  $("key-state").textContent = "Could not read the saved state.";
  $("key-state").className = "v bad";
  $("fail").replaceChildren(el("div", "none", "Unknown."));
  $("run").replaceChildren(el("span", "k", "When"), el("span", "v soft", "Unknown."));
}

/* One status request at a time; a second caller shares it. */
function fetchServer() {
  if (!inflight) {
    const mine = (inflight = ask({ type: "status" }).finally(() => {
      if (inflight === mine) inflight = null;
    }));
  }
  return inflight;
}

/* Draws the local state at once. withServer then merges the Worker's record when it arrives. */
async function refresh(withServer = true) {
  const seq = ++stateSeq;
  const s = await ask({ type: "state" });
  if (seq !== stateSeq) return;
  if (!s || s.error) {
    if (!last) renderUnreadable();
    return;
  }
  last = s;
  if (!s.hasKey) server = null;
  render();
  if (withServer && s.hasKey) {
    const r = await fetchServer();
    server = r && !r.error ? r.server ?? null : null;
    render();
  }
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
  if (!r?.saved) {
    keyAnswer = { text: "The key was not saved.", cls: "bad" };
    return render();
  }
  /* Answer at the press; the check of the key follows and replaces this line. */
  keyAnswer = { text: "Saved.", cls: "ok" };
  pullAnswer = null;
  inflight = null;
  last = { ...last, hasKey: true };
  server = undefined;
  render();
  const checked = await fetchServer();
  const check = checked?.check;
  keyAnswer = check === "accepted"
    ? { text: "Saved. The server accepted this key.", cls: "ok" }
    : check === "refused"
      ? { text: "The server refused this key.", cls: "bad" }
      : check === "error"
        ? { text: "Saved. The server reported an error, so the key is not checked.", cls: "" }
        : { text: "Saved. The server did not answer, so the key is not checked.", cls: "" };
  server = checked && !checked.error ? checked.server ?? null : null;
  await refresh(false);
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
  inflight = null;
  server = null;
  last = { ...last, hasKey: false };
  render();
  await refresh(false);
});

/* ---------- pull ---------- */

$("pull").addEventListener("click", async () => {
  keyAnswer = null;
  const r = await ask({ type: "pull" });
  pullAnswer = r?.started || r?.reason === "running" ? null
    : r?.reason === "no-tab" ? { text: "No store.tcgplayer.com tab is open.", store: true }
    : { text: "The pull did not start.", store: false };
  /* Answer at the press: show it before the state is read again. */
  if (r?.started) last = { ...last, pulling: true, stoppable: true, page: null };
  render();
  await refresh(false);
});

$("stop").addEventListener("click", async () => {
  const r = await ask({ type: "stop" });
  if (r?.stopped) {
    pullAnswer = { text: "Stopped. Nothing was added.", stopped: true };
    last = { ...last, pulling: false, stoppable: false, page: null };
    render();
  }
  await refresh(false);
});

$("open-store").addEventListener("click", () => chrome.tabs.create({ url: STORE_URL }));

/* The background says when a pull starts or ends, when the key changes, and (light) when the
   page number moves. A light message needs only the local state. */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "changed") {
    if (last?.pulling && !pullAnswer?.stopped) pullAnswer = null;
    refresh(!msg.light);
  }
});

refresh();
