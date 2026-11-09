#!/usr/bin/env bash
# The simulator steps of the duo-ui workflow, one home for its three jobs (duo-ui, pro-ui-a, pro-ui-b).
# Each subcommand prints what it reads, so a red run says why. Only the workflow runs this script.
#
#   install-xcodegen                    env XCODEGEN_VERSION, XCODEGEN_SHA256 (the workflow step pins them)
#   create-sim <device name>            pick the newest iOS runtime that supports the device type, create, boot, wait until it answers;
#                                       sets SIM_UDID and SIM_RUNTIME in GITHUB_ENV
#   fetch-hinge                         pinned hinge clone; sets HINGE in GITHUB_ENV
#   pose flat|closed                    fold the simulator with hinge
#   duo-counts                          the expected test counts of the two Duo passes; sets DUO_FLAT_EXPECTED, DUO_CLOSED_EXPECTED
#   check-results <bundle> <label> exact:<n>|nonzero
#                                       read the executed count and the retried tests from an xcresult; fail on a wrong count
#   export <bundle> <dir>               export the bundle's attachments (screenshots)
#   summary-head <title>                the run's facts for the step summary
set -euo pipefail

if [[ "${GITHUB_ACTIONS:-}" != true ]]; then
  echo "ci-sim: refusing to run outside GitHub Actions. The Mac's simulators go through sim-test and the gatekeeper." >&2
  exit 2
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${RUNNER_TEMP:?RUNNER_TEMP is not set}/ci-sim"
# hinge v0.3.0 (MIT), pinned: it folds the iPhone Duo simulator. The same pin as shivinate7/home scripts/screen-check.sh.
HINGE_REPO="https://github.com/artemnovichkov/hinge"
HINGE_SHA="afb8f0bd277cb12187f0844a79542cbac35e7385"
UI_DIR="$ROOT/native/ManifestUITests"
mkdir -p "$WORK"

die() { echo "ci-sim: $*" >&2; exit 1; }
summary() { echo "$*" >> "${GITHUB_STEP_SUMMARY:-/dev/null}"; }

install_xcodegen() {
  : "${XCODEGEN_VERSION:?}" "${XCODEGEN_SHA256:?}"
  local dl="$WORK/xcodegen-download" got
  mkdir -p "$dl"
  curl -fsSL -o "$dl/xcodegen.zip" "https://github.com/yonaskolb/XcodeGen/releases/download/${XCODEGEN_VERSION}/xcodegen.zip"
  got=$(shasum -a 256 "$dl/xcodegen.zip" | cut -d ' ' -f 1)
  if [[ "$got" != "$XCODEGEN_SHA256" ]]; then
    die "xcodegen ${XCODEGEN_VERSION} zip digest is $got, expected $XCODEGEN_SHA256"
  fi
  unzip -q "$dl/xcodegen.zip" -d "$dl/unpacked"
  # The binary reads ../share/xcodegen, so the unpacked tree stays whole.
  echo "$dl/unpacked/xcodegen/bin" >> "$GITHUB_PATH"
}

# device_type <name>: the identifier of the device type with exactly this name, or nothing.
device_type() {
  python3 -I - "$WORK/devicetypes.json" "$1" <<'PY'
import json, sys
for t in json.load(open(sys.argv[1]))["devicetypes"]:
    if t["name"] == sys.argv[2]:
        print(t["identifier"])
        break
PY
}

# runtime_for <device type id>: the newest available iOS runtime that lists this device type, or nothing.
# A runtime tied to one other device lists only that device, so it never matches (home's PR 586 fixed a mispick).
runtime_for() {
  python3 -I - "$WORK/runtimes.json" "$1" <<'PY'
import json, sys
def version(r):
    return tuple(int(p) for p in r["version"].split(".") if p.isdigit())
runtimes = [
    r for r in json.load(open(sys.argv[1]))["runtimes"]
    if ".SimRuntime.iOS-" in r["identifier"]
    and r.get("isAvailable", True)
    and any(t.get("identifier") == sys.argv[2] for t in r.get("supportedDeviceTypes", []))
]
runtimes.sort(key=version, reverse=True)
if runtimes:
    print(runtimes[0]["identifier"])
PY
}

# probe <udid>: waits for 3 answers in a row from the booted simulator, for at most 3 minutes.
probe() {
  local udid="$1" ok=0 tries=0
  while (( ok < 3 && tries < 90 )); do
    if xcrun simctl spawn "$udid" launchctl print system >/dev/null 2>&1; then ok=$((ok + 1)); else ok=0; fi
    tries=$((tries + 1))
    sleep 2
  done
  (( ok >= 3 )) || die "simulator $udid did not answer 3 probes in a row after $tries tries"
  echo "simulator answered 3 probes in a row ($tries tries)"
}

create_sim() {
  local name="$1" type_id runtime udid
  echo "uname -m: $(uname -m)"
  xcrun simctl list devicetypes -j > "$WORK/devicetypes.json"
  xcrun simctl list runtimes available -j > "$WORK/runtimes.json"
  echo "== device types matching iPhone Duo or iPhone 18 Pro"
  xcrun simctl list devicetypes | grep -E 'iPhone (Duo|18 Pro)' || true
  echo "== available runtimes"
  xcrun simctl list runtimes available
  type_id="$(device_type "$name")"
  [[ -n "$type_id" ]] || die "no device type named '$name' on this image"
  runtime="$(runtime_for "$type_id")"
  [[ -n "$runtime" ]] || die "no available iOS runtime supports $type_id"
  echo "device type: $type_id"
  echo "runtime: $runtime"
  udid="$(xcrun simctl create "ci-sim $name" "$type_id" "$runtime")"
  [[ -n "$udid" ]] || die "simctl create printed no UDID"
  echo "simulator: $udid"
  xcrun simctl boot "$udid"
  xcrun simctl bootstatus "$udid" -b
  probe "$udid"
  {
    echo "SIM_UDID=$udid"
    echo "SIM_RUNTIME=$runtime"
  } >> "$GITHUB_ENV"
}

fetch_hinge() {
  local dir="$WORK/hinge"
  [[ -d "$dir/.git" ]] || git clone --quiet "$HINGE_REPO" "$dir"
  git -C "$dir" checkout --quiet "$HINGE_SHA"
  local bin="$dir/skills/hinge/scripts/hinge"
  [[ -f "$bin" ]] || die "no hinge script at $bin"
  chmod +x "$bin"
  echo "hinge at $(git -C "$dir" rev-parse HEAD): $bin"
  echo "HINGE=$bin" >> "$GITHUB_ENV"
}

# hinge_do <args>: one hinge call. A failure is a warning, not an end: the tests check the pose they get and fail on a wrong one.
hinge_do() {
  echo "hinge $*"
  "$HINGE" -d "$SIM_UDID" "$@" || echo "ci-sim: warning: hinge $* failed or timed out; the posture below says what was set"
}

pose() {
  : "${HINGE:?}" "${SIM_UDID:?}"
  case "$1" in
    flat) hinge_do open; sleep 5 ;;
    # The outer screen may not update after the first close, so close, open and close again.
    closed) hinge_do close; sleep 3; hinge_do open; sleep 3; hinge_do close; sleep 5 ;;
    *) die "unknown pose: $1" ;;
  esac
  hinge_do posture || true
  hinge_do get || true
  # Both displays, for the reader who wants to see the pose. The tests do not use these files.
  mkdir -p "$ROOT/out/pose"
  xcrun simctl io "$SIM_UDID" screenshot --display=LCD "$ROOT/out/pose/$1-outer.png" || true
  xcrun simctl io "$SIM_UDID" screenshot --display=LCD-1 "$ROOT/out/pose/$1-inner.png" || true
}

# duo_counts: the expected executed counts, computed from the Swift sources. Prints each Duo test it finds.
duo_counts() {
  local classes closed total=0 n f id cls method
  classes="$(grep -E '^DUO_UI_TESTS[[:space:]]*:=' "$ROOT/Makefile" | sed 's/^[^=]*=//')"
  [[ -n "$classes" ]] || die "no DUO_UI_TESTS line in the Makefile"
  closed="$(make -s -C "$ROOT" duo-closed-list)"
  echo "Duo classes: $classes"
  echo "closed ids: $closed"
  for f in $classes; do
    [[ -f "$UI_DIR/$f.swift" ]] || die "no $UI_DIR/$f.swift"
    n="$(grep -cE '^[[:space:]]*(@MainActor[[:space:]]+)?func test[A-Za-z0-9_]*\(' "$UI_DIR/$f.swift" || true)"
    echo "  $f: $n tests"
    total=$((total + n))
  done
  local nclosed=0
  for id in $closed; do
    cls="${id%%/*}"; method="${id#*/}"
    grep -qE "func ${method}\(" "$UI_DIR/$cls.swift" || die "closed id $id names no method in $cls.swift"
    nclosed=$((nclosed + 1))
  done
  (( total > nclosed && nclosed > 0 )) || die "implausible counts: $total Duo tests, $nclosed closed"
  echo "expected: flat $((total - nclosed)), closed $nclosed"
  {
    echo "DUO_FLAT_EXPECTED=$((total - nclosed))"
    echo "DUO_CLOSED_EXPECTED=$nclosed"
  } >> "$GITHUB_ENV"
}

# check_results <bundle> <label> <expect>: reads the summary and the test tree of an xcresult (Xcode 16+ xcresulttool).
# Any field it cannot read fails the check with the raw JSON head in the log, never a pass.
check_results() {
  local bundle="$1" label="$2" expect="$3"
  [[ -d "$bundle" ]] || die "$label: no result bundle at $bundle (the test run wrote none)"
  xcrun xcresulttool get test-results summary --path "$bundle" --format json > "$WORK/$label-summary.json"
  xcrun xcresulttool get test-results tests --path "$bundle" --format json > "$WORK/$label-tests.json"
  echo "== $label summary (head)"
  head -c 1500 "$WORK/$label-summary.json"; echo
  python3 -I - "$WORK/$label-summary.json" "$WORK/$label-tests.json" "$label" "$expect" "${GITHUB_STEP_SUMMARY:-/dev/null}" <<'PY'
import json, sys
summary_path, tests_path, label, expect, step_summary = sys.argv[1:6]

def head(path):
    with open(path) as f:
        return f.read(3000)

def fail(msg, path):
    print("ci-sim: %s: %s" % (label, msg), file=sys.stderr)
    print("raw JSON head of %s:" % path, file=sys.stderr)
    print(head(path), file=sys.stderr)
    sys.exit(1)

summary = json.load(open(summary_path))
total = summary.get("totalTestCount")
if not isinstance(total, int):
    fail("summary has no integer totalTestCount", summary_path)
skipped = summary.get("skippedTests", 0)
failed = summary.get("failedTests", 0)
passed = summary.get("passedTests", 0)
result = summary.get("result", "unknown")

# The test tree: a Test Case node has one Repetition child per attempt when the test ran more than once.
tests = json.load(open(tests_path))
cases = []
def walk(node, suite):
    kind = node.get("nodeType")
    name = node.get("name", "?")
    children = node.get("children", [])
    if kind == "Test Case":
        attempts = [c for c in children if c.get("nodeType") == "Repetition"]
        cases.append((suite, name, node.get("result", "?"), len(attempts)))
        return
    nxt = name if kind == "Test Suite" else suite
    for c in children:
        walk(c, nxt)
for n in tests.get("testNodes", []):
    walk(n, "")
print("%s: totalTestCount %s, passed %s, failed %s, skipped %s, result %s, test-case nodes %d" % (label, total, passed, failed, skipped, result, len(cases)))

problems = []
if expect == "nonzero":
    if total <= 0:
        problems.append("executed 0 tests")
elif expect.startswith("exact:"):
    want = int(expect.split(":", 1)[1])
    if total != want:
        problems.append("executed %d tests, expected %d" % (total, want))
    if skipped:
        problems.append("%d tests were skipped; a Duo test never skips" % skipped)
else:
    problems.append("unknown expectation %s" % expect)
if cases and len(cases) != total:
    print("::warning::%s: the test tree holds %d test cases but the summary counts %d" % (label, len(cases), total))
if not cases:
    print("::warning::%s: the test tree holds no Test Case node, so retries cannot be read" % label)
    print(head(tests_path))

retried = [c for c in cases if c[3] > 1]
lines = ["#### %s" % label,
         "- executed %d (expected %s), passed %d, failed %d, skipped %d, result %s" % (total, expect, passed, failed, skipped, result)]
if retried:
    lines.append("- passed or failed only after a retry (%d):" % len(retried))
    for suite, name, res, n in retried:
        lines.append("  - %s/%s: %d attempts, last result %s" % (suite, name, n, res))
else:
    lines.append("- no test needed a retry" if cases else "- retries unread (no Test Case nodes)")
for p in problems:
    lines.append("- FAIL: " + p)
with open(step_summary, "a") as f:
    f.write("\n".join(lines) + "\n")
print("\n".join(lines))
if problems:
    fail("; ".join(problems), summary_path)
PY
}

export_attachments() {
  local bundle="$1" dir="$2"
  mkdir -p "$dir"
  if [[ ! -d "$bundle" ]]; then echo "ci-sim: warning: no bundle at $bundle to export"; return 0; fi
  xcrun xcresulttool export attachments --path "$bundle" --output-path "$dir" || echo "ci-sim: warning: attachment export failed for $bundle"
  echo "exported to $dir:"; ls "$dir" | head -50
}

summary_head() {
  {
    echo "### $1"
    echo "- PR head sha: ${HEAD_SHA:-unknown} (merge sha ${GITHUB_SHA:-unknown})"
    echo "- Xcode: $(xcodebuild -version | tr '\n' ' ')"
    echo "- runtime: ${SIM_RUNTIME:-none}"
    [[ -z "${HINGE:-}" ]] || echo "- hinge sha: $HINGE_SHA"
    [[ -z "${DUO_FLAT_EXPECTED:-}" ]] || echo "- expected counts: flat ${DUO_FLAT_EXPECTED}, closed ${DUO_CLOSED_EXPECTED}"
  } >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
}

cmd="${1:-}"; shift || true
case "$cmd" in
  install-xcodegen) install_xcodegen ;;
  create-sim) create_sim "$@" ;;
  fetch-hinge) fetch_hinge ;;
  pose) pose "$@" ;;
  duo-counts) duo_counts ;;
  check-results) check_results "$@" ;;
  export) export_attachments "$@" ;;
  summary-head) summary_head "$@" ;;
  *) die "unknown subcommand '$cmd'" ;;
esac
