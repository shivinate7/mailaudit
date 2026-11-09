#!/usr/bin/env bash
# Screen check: iPhone screenshots of the MANIFEST app in fixture mode, for sessions that cannot boot a simulator.
# Copied from shivinate7/home scripts/screen-check.sh at f96df63 (home PRs 604 and 613). Changed for this repo: the screens are
# the four tabs, the app is built with xcodegen, the Family apps are gone, and `check-count` is new.
#
# How to use it (a cloud session has no simulator). Two ways to start the workflow; each bills macOS minutes, so run it once per
# finished piece of screen work.
#   Dispatch the branch whose screens you want, then download the artifact:
#     gh workflow run screen-check.yml --repo shivinate7/mailaudit --ref <branch>   (add -f screens=tally,packages for fewer; default all)
#   Find your run, never the newest of all (another session may have dispatched one):
#     gh run list --workflow screen-check.yml --repo shivinate7/mailaudit --branch <branch> --json databaseId,headSha,status
#   and take the one whose headSha is the head of <branch>. Download:
#     gh run download <id> --repo shivinate7/mailaudit -n screens   (PNGs named as below, plus logs/)
#   Or add the label `screen-check` to the pull request. That run uses fixed inputs: both devices, both Duo postures, all four
#   screens, sizes AX3 and AX5, and a video of Packages on the 18 Pro. Only that label starts it; a push to the PR starts nothing,
#   so remove and add the label again to repeat it. Download the artifact the same way, with the run id from `gh run list`
#   (add --event pull_request).
# It shows no press feel (timing, haptics, drags); that stays a Mac or phone check. Only the workflow runs this script (it
# refuses to start outside GitHub Actions). The app runs on its bundled fake fixture (shared/fixtures/ledger.json) with no
# network, so no artifact holds personal data.
#
# The app opens on a tab from the Debug launch argument `-ManifestUITestTab <ledger|orphaned|tally|packages>` (RootView.startTab
# in native/Manifest/RootView.swift), with `-ManifestUITestSeed` for the fixture. The screens are those four tabs.
#
# Inputs (workflow_dispatch strings, each a comma list; empty = the default, which is the run as it always was). The workflow
# passes each in as an env var of the same name in capitals:
#   screens   SCREENS   ledger,orphaned,tally,packages              default all
#   sizes     SIZES     short labels, any case: xS S M L xL xxL xxxL AX1 AX2 AX3 AX4 AX5 (AX3 = accessibility-extra-large; the
#                       table is size_name below). A raw simctl name is refused.    default none: the simulator's own size
#   devices   DEVICES   duo,18pro                                    default both
#   postures  POSTURES  folded,open (the Duo; ignored off arm64)     default both
#   video     VIDEO     one screen name; records an .mp4 on the 18 Pro only    default none
# Every device x posture x appearance (light only) x size x screen is shot. Without a size, nothing is set.
#
# File names (in out/, the artifact):
#   <device>-<posture>-<appearance>-<screen>.png                   default; Duo postures folded, open; 18 Pro posture portrait
#   <device>-<posture>-<appearance>-<size>-<screen>.png            when sizes is set (the size segment is the label, e.g. AX3)
#   18pro-<appearance>-<screen>.mp4                                when video is set: the one appearance (light), and when sizes is
#                                                                  set the last size; simctl io on the Duo captures the wrong display
# Large Content Viewer is out of scope: it needs a long press, simctl has no touch input, so it needs a UI test.
#
# `screen-check.sh check-count` (a workflow step after the shoot) counts the PNGs in out/ (and the .mp4 when video is set) against
# the count the inputs imply, and exits 1 when fewer. out/logs always exists, so the upload's if-no-files-found cannot catch an
# empty run.
#
# Env also: SCREEN_WAIT (seconds to wait after opening a screen; default 6: the app finishes launching and drawing before the
# shot), SCREEN_OUT (default <repo>/out), SCREEN_WORK (derived data, hinge clone; default <repo>/.screen-check).
set -euo pipefail

# The Mac's simulators are rationed: a run here goes through sim-test and the gatekeeper, never by hand.
if [[ "${GITHUB_ACTIONS:-}" != true ]]; then
  echo "screen-check: refusing to run outside GitHub Actions. The Mac's simulators go through sim-test and the gatekeeper." >&2
  exit 2
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${SCREEN_OUT:-$ROOT/out}"
WORK="${SCREEN_WORK:-$ROOT/.screen-check}"
LOGS="$OUT/logs"
DERIVED="$WORK/derived"
WAIT="${SCREEN_WAIT:-6}"
ALL_SCREENS="ledger orphaned tally packages"
# The tab the app opens on by default. It is shot first, as the baseline every other screen is compared with.
BASELINE_SCREEN="ledger"
# hinge v0.3.0 (MIT), pinned: it folds the iPhone Duo simulator and captures the display that hosts the UI.
# The same pin as HINGE_SHA in .github/workflows/duo-ui.yml.
HINGE_REPO="https://github.com/artemnovichkov/hinge"
HINGE_SHA="afb8f0bd277cb12187f0844a79542cbac35e7385"
# Light only: native/Manifest/Info.plist pins UIUserInterfaceStyle = Light, so a dark shot would repeat the light one.
APPEARANCES="light"
SIZE_LABELS="xS S M L xL xxL xxxL AX1 AX2 AX3 AX4 AX5" # smallest to largest
ALL_DEVICES="duo 18pro"
ALL_POSTURES="folded open"

CURRENT_UDID=""
RECORD_PID="" # the background recorder while record_video runs
FAILED=()
NOTES=()

die() { echo "screen-check: $*" >&2; exit 1; }

# Shuts down and deletes the simulator this script made; one at a time, so nothing else is left booted.
cleanup_device() {
  local udid="$CURRENT_UDID"
  if [[ -n "$RECORD_PID" ]]; then # an interrupt while recording: stop the recorder before its simulator goes
    kill -KILL "$RECORD_PID" 2>/dev/null || true
    wait "$RECORD_PID" 2>/dev/null || true
    RECORD_PID=""
  fi
  [[ -n "$udid" ]] || return 0
  CURRENT_UDID=""
  xcrun simctl shutdown "$udid" >>"$LOGS/simctl.log" 2>&1 || true
  xcrun simctl delete "$udid" >>"$LOGS/simctl.log" 2>&1 || echo "screen-check: warning: could not delete simulator $udid" >&2
}
trap cleanup_device EXIT
trap 'exit 130' INT TERM # the EXIT trap then cleans up on Ctrl-C and TERM too

# check_screen <screen>: fails on a name that is not one of the four tabs.
check_screen() {
  [[ " $ALL_SCREENS " == *" $1 "* ]] || die "unknown screen: $1 (known: $ALL_SCREENS)"
}

# Reads SCREENS into the SELECTED list, refusing an unknown name.
select_screens() {
  local raw="${SCREENS:-all}" s
  raw="${raw//,/ }"
  SELECTED=()
  if [[ -z "${raw// /}" || "$raw" == "all" ]]; then raw="$ALL_SCREENS"; fi
  for s in $raw; do
    check_screen "$s"
    SELECTED+=("$s")
  done
}

# Generic helpers (parse_list, record_video): plain functions, to lift into claude-settings later.
# parse_list <name> <raw comma list> <allowed words> <default words>: sets PARSED to the items, each one of the allowed
# words, repeats dropped; an empty list gives the default words. An unknown item stops the run, naming the allowed words
# (or the optional fifth argument, to show them differently).
parse_list() {
  local name="$1" raw="$2" allowed="$3" default="$4" item
  local -a items
  raw="${raw//,/ }"
  raw="${raw//$'\n'/ }" # a multi-line input is a list too; read splits on its first line only
  raw="${raw//$'\r'/ }"
  raw="${raw//$'\t'/ }"
  [[ -n "${raw//[[:space:]]/}" ]] || raw="$default"
  PARSED=()
  IFS=' ' read -r -a items <<<"$raw" # read, not word splitting: an item such as * must not glob
  for item in "${items[@]}"; do
    [[ " $allowed " == *" $item "* ]] || die "unknown $name: $item (known: ${5:-$allowed})"
    [[ " ${PARSED[*]-} " == *" $item "* ]] || PARSED+=("$item")
  done
}

# size_name <label>: the one table from a size label to its simctl content size name (`xcrun simctl ui <udid> content_size`).
size_name() {
  case "$1" in
    xS) echo extra-small ;; S) echo small ;; M) echo medium ;; L) echo large ;; xL) echo extra-large ;;
    xxL) echo extra-extra-large ;; xxxL) echo extra-extra-extra-large ;;
    AX1) echo accessibility-medium ;; AX2) echo accessibility-large ;; AX3) echo accessibility-extra-large ;;
    AX4) echo accessibility-extra-extra-large ;; AX5) echo accessibility-extra-extra-extra-large ;;
    *) return 1 ;;
  esac
}

# has_item <words> <item>
has_item() { [[ " $1 " == *" $2 "* ]]; }

# Reads the inputs. All empty is the default run: both devices, both postures, no size, no video.
read_inputs() {
  parse_list device "${DEVICES:-}" "$ALL_DEVICES" "$ALL_DEVICES"
  DEVICE_LIST=("${PARSED[@]}")
  parse_list posture "${POSTURES:-}" "$ALL_POSTURES" "$ALL_POSTURES"
  POSTURE_LIST=("${PARSED[@]}")
  if [[ -n "${SIZES:-}" && -n "${SIZES//[[:space:],]/}" ]]; then
    local label l lc_labels
    lc_labels="$(printf '%s' "$SIZE_LABELS" | tr '[:upper:]' '[:lower:]')"
    parse_list size "$(printf '%s' "$SIZES" | tr '[:upper:]' '[:lower:]')" "$lc_labels" "" "$SIZE_LABELS (any case; not simctl names)"
    SIZE_LIST=()
    for label in "${PARSED[@]}"; do # back to the label's own case, for the table and the file names
      for l in $SIZE_LABELS; do
        if [[ "$(printf '%s' "$l" | tr '[:upper:]' '[:lower:]')" == "$label" ]]; then SIZE_LIST+=("$l"); fi
      done
    done
  else
    SIZE_LIST=("") # one pass, no size set, no size in the file names
  fi
  VIDEO="${VIDEO:-}"
  VIDEO="${VIDEO//[[:space:]]/}"
  if [[ -n "$VIDEO" ]]; then
    check_screen "$VIDEO"
    has_item "${DEVICE_LIST[*]}" 18pro || die "video is recorded on the 18 Pro only: add 18pro to devices"
  fi
}

# runtime_for <device type id>: the newest available iOS runtime that supports that device type, as its identifier, or nothing.
# A runtime tied to one other device (such as ...SimRuntime.iOS-27-2-iPhone19-4) lists only that device, so it never matches.
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

# The device type identifier whose name is exactly $1, or nothing.
device_type() {
  python3 -I - "$WORK/devicetypes.json" "$1" <<'PY'
import json, sys
for t in json.load(open(sys.argv[1]))["devicetypes"]:
    if t["name"] == sys.argv[2]:
        print(t["identifier"])
        break
PY
}

fetch_hinge() {
  [[ -d "$WORK/hinge/.git" ]] || git clone "$HINGE_REPO" "$WORK/hinge" >>"$LOGS/hinge.log" 2>&1 || return 1
  git -C "$WORK/hinge" checkout "$HINGE_SHA" >>"$LOGS/hinge.log" 2>&1 || return 1
  HINGE="$WORK/hinge/skills/hinge/scripts/hinge"
  [[ -x "$HINGE" ]] || return 1
}

# launch_screen <udid> <screen>: relaunch the app in fixture mode on the screen's tab. The tab comes from the Debug
# `-ManifestUITestTab` launch argument (RootView.startTab in native/Manifest/RootView.swift), never from a tap: simctl has no touch input.
launch_screen() {
  local udid="$1" screen="$2"
  xcrun simctl terminate "$udid" "$BUNDLE" >>"$LOGS/simctl.log" 2>&1 || true
  xcrun simctl launch "$udid" "$BUNDLE" -ManifestUITestSeed -ManifestUITestTab "$screen" >>"$LOGS/simctl.log" 2>&1 || return 1
}

# capture_shot <udid> <file> <use hinge: 1|0>
capture_shot() {
  local udid="$1" file="$2" use_hinge="$3"
  if [[ "$use_hinge" == 1 ]]; then
    "$HINGE" -d "$udid" screenshot "$file" >>"$LOGS/hinge.log" 2>&1 || return 1
  else
    xcrun simctl io "$udid" screenshot "$file" >>"$LOGS/simctl.log" 2>&1 || return 1
  fi
  [[ -s "$file" ]] || return 1
}

# shoot_one <udid> <file> <use hinge: 1|0> <screen>: relaunch in fixture mode on the screen, wait, capture.
# Every step ends in `|| return 1`: the caller runs this inside `if`, where set -e is off.
shoot_one() {
  local udid="$1" file="$2" use_hinge="$3" screen="$4"
  launch_screen "$udid" "$screen" || return 1
  sleep "$WAIT"
  capture_shot "$udid" "$file" "$use_hinge" || return 1
}

# record_video <udid> <file> <wait seconds> <command...>: records the display to an h264 .mp4 while the command runs and
# the wait passes, then stops the recorder with SIGINT (which finishes the file) and waits for it. Returns 1 when the
# recorder dies early, the command fails, the recorder will not stop, or the file is empty.
record_video() {
  local udid="$1" file="$2" wait_s="$3" pid i rc=0
  shift 3
  rm -f "$file"
  # Job control on: a background job of a non-interactive shell otherwise starts with SIGINT ignored, and kill -INT does nothing.
  set -m
  xcrun simctl io "$udid" recordVideo --codec h264 --force "$file" >>"$LOGS/simctl.log" 2>&1 &
  pid=$!
  set +m
  RECORD_PID="$pid"
  sleep 1
  if ! kill -0 "$pid" 2>/dev/null; then
    wait "$pid" 2>/dev/null || true
    RECORD_PID=""
    rm -f "$file"
    return 1
  fi
  "$@" || rc=1
  sleep "$wait_s"
  kill -INT "$pid" 2>/dev/null || rc=1
  for ((i = 0; i < 30; i++)); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 1
  done
  if kill -0 "$pid" 2>/dev/null; then
    kill -KILL "$pid" 2>/dev/null || true
    rc=1
  fi
  wait "$pid" 2>/dev/null || true
  RECORD_PID=""
  [[ -s "$file" ]] || rc=1
  return "$rc"
}

# file_hash <file>: the file's md5.
file_hash() { md5 -q "$1"; }

# Hashes of the shots on one device, posture and appearance: the baseline screen's and the one before.
BASE_HASH=""
PREV_HASH=""
PREV_SCREEN=""

# check_identical <label> <screen> <hash>: a screen equal to the baseline (Ledger, the tab the app opens on) or to the shot
# before it never opened (an ignored -ManifestUITestTab shows the default tab, or the screen the app was on). Adds the failure
# to FAILED. The baseline screen is shot first, so it sets the baseline.
check_identical() {
  local label="$1" screen="$2" hash="$3"
  if [[ "$screen" == "$BASELINE_SCREEN" ]]; then
    BASE_HASH="$hash"
  elif [[ -n "$BASE_HASH" && "$hash" == "$BASE_HASH" ]]; then
    FAILED+=("$label: screen $screen identical to $BASELINE_SCREEN")
  elif [[ -n "$PREV_HASH" && "$hash" == "$PREV_HASH" ]]; then
    FAILED+=("$label: screen $screen identical to $PREV_SCREEN")
  fi
  PREV_SCREEN="$screen"
  PREV_HASH="$hash"
}

# shoot_device <slug> <device type id> <is duo: 1|0>
shoot_device() {
  local slug="$1" type_id="$2" is_duo="$3" udid runtime postures posture appearance screen file use_hinge=0 keep order
  local size label sizeseg last_appearance="${APPEARANCES##* }"
  runtime="$(runtime_for "$type_id")"
  if [[ -z "$runtime" ]]; then
    FAILED+=("$slug: no available iOS runtime supports $type_id")
    return 0
  fi
  echo "runtime for $slug: $runtime"
  if ! udid="$(xcrun simctl create "screen-check $slug" "$type_id" "$runtime" 2>>"$LOGS/simctl.log")"; then
    FAILED+=("$slug: simctl create failed (runtime $runtime)")
    return 0
  fi
  CURRENT_UDID="$udid"
  echo "== $slug ($udid)"
  xcrun simctl boot "$udid" >>"$LOGS/simctl.log" 2>&1 || { FAILED+=("$slug: boot failed"); cleanup_device; return 0; }
  xcrun simctl bootstatus "$udid" -b >>"$LOGS/simctl.log" 2>&1 || { FAILED+=("$slug: bootstatus failed"); cleanup_device; return 0; }
  # A fixed status bar keeps the clock from ticking between shots, so equal screens hash equal (the identical-screen check).
  xcrun simctl status_bar "$udid" override --time 9:41 --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularBars 4 \
    >>"$LOGS/simctl.log" 2>&1 || FAILED+=("$slug: status bar override failed")
  xcrun simctl install "$udid" "$APP" >>"$LOGS/simctl.log" 2>&1 || { FAILED+=("$slug: install failed"); cleanup_device; return 0; }

  postures="portrait"
  if [[ "$is_duo" == 1 ]]; then
    if fetch_hinge; then
      use_hinge=1
      if [[ "$(uname -m)" == arm64 ]]; then
        postures="${POSTURE_LIST[*]}"
      else
        echo "screen-check: uname -m is $(uname -m), not arm64: hinge's helper builds for arm64 only, so the Duo is shot in its default posture"
        postures="default"
      fi
    else
      FAILED+=("$slug: could not fetch hinge at $HINGE_SHA")
      cleanup_device
      return 0
    fi
  fi

  for posture in $postures; do
    case "$posture" in
      folded) "$HINGE" -d "$udid" close >>"$LOGS/hinge.log" 2>&1 || { FAILED+=("$slug: hinge close failed"); continue; }; sleep 3 ;;
      open) "$HINGE" -d "$udid" open >>"$LOGS/hinge.log" 2>&1 || { FAILED+=("$slug: hinge open failed"); continue; }; sleep 3 ;;
    esac
    for appearance in $APPEARANCES; do
      xcrun simctl ui "$udid" appearance "$appearance" >>"$LOGS/simctl.log" 2>&1 || { FAILED+=("$slug $posture: appearance $appearance failed"); continue; }
      sleep 2
      for size in "${SIZE_LIST[@]}"; do
        label="$slug $posture $appearance"
        sizeseg=""
        if [[ -n "$size" ]]; then
          xcrun simctl ui "$udid" content_size "$(size_name "$size")" >>"$LOGS/simctl.log" 2>&1 || { FAILED+=("$label: content size $size failed"); continue; }
          sleep 2
          label="$label $size"
          sizeseg="-$size"
        fi
        # Baselines are per size: a larger size must not be compared with the shots of the one before.
        BASE_HASH=""
        PREV_HASH=""
        PREV_SCREEN=""
        # The baseline screen goes first, as the one every other screen is compared with. When it is not selected it is shot
        # into the work folder only and deleted, so an ignored launch argument is still caught.
        order=("$BASELINE_SCREEN")
        for screen in "${SELECTED[@]}"; do [[ "$screen" == "$BASELINE_SCREEN" ]] || order+=("$screen"); done
        for screen in "${order[@]}"; do
          keep=0
          [[ " ${SELECTED[*]} " == *" $screen "* ]] && keep=1
          file="$OUT/$slug-$posture-$appearance$sizeseg-$screen.png"
          [[ "$keep" == 1 ]] || file="$WORK/baseline-$slug-$posture-$appearance$sizeseg-$screen.png"
          if shoot_one "$udid" "$file" "$use_hinge" "$screen"; then
            echo "shot $file"
            check_identical "$label" "$screen" "$(file_hash "$file")"
            [[ "$keep" == 1 ]] || rm -f "$file"
          else
            rm -f "$file"
            FAILED+=("$label $screen: shot failed")
          fi
        done
      done
      # The video is the 18 Pro's, in the last appearance (at the last size), after its stills.
      if [[ -n "$VIDEO" && "$is_duo" == 0 && "$appearance" == "$last_appearance" ]]; then
        file="$OUT/$slug-$appearance-$VIDEO.mp4"
        if record_video "$udid" "$file" $((WAIT + 2)) launch_screen "$udid" "$VIDEO"; then
          echo "recorded $file"
        else
          rm -f "$file"
          FAILED+=("$slug $appearance $VIDEO: video failed")
        fi
      fi
    done
  done
  cleanup_device
}

# expected_png_count: the PNG count the inputs imply, from the lists read_inputs and select_screens made. The Duo is shot in
# every selected posture on arm64 (one default posture off it), the 18 Pro in one; each in every appearance, size and screen.
# It reads the inputs, not what the shoot did, so a shoot that skipped a shot cannot lower it.
expected_png_count() {
  local per_posture=$((${#SELECTED[@]} * ${#SIZE_LIST[@]} * $(wc -w <<<"$APPEARANCES"))) total=0 duo_postures
  if has_item "${DEVICE_LIST[*]}" duo; then
    duo_postures=${#POSTURE_LIST[@]}
    [[ "$(uname -m)" == arm64 ]] || duo_postures=1
    total=$((total + duo_postures * per_posture))
  fi
  if has_item "${DEVICE_LIST[*]}" 18pro; then total=$((total + per_posture)); fi
  echo "$total"
}

# check_count: fails when out/ holds fewer PNGs than the inputs imply, or no .mp4 when video is set.
check_count() {
  local expected got f videos=0
  select_screens
  read_inputs
  expected="$(expected_png_count)"
  got=0
  for f in "$OUT"/*.png; do
    [[ -e "$f" ]] && got=$((got + 1))
  done
  for f in "$OUT"/*.mp4; do
    [[ -e "$f" ]] && videos=$((videos + 1))
  done
  echo "screen-check: PNGs in $OUT: $got, expected at least $expected; videos: $videos, video input: ${VIDEO:-none}"
  [[ $got -ge $expected && $expected -gt 0 ]] || die "$got PNGs in $OUT, the inputs imply $expected"
  if [[ -n "$VIDEO" && $videos -lt 1 ]]; then die "video $VIDEO was asked for and no .mp4 is in $OUT"; fi
}

main() {
  local bundle_plist type_id count f
  mkdir -p "$OUT" "$LOGS" "$WORK"
  rm -f "$OUT"/*.png "$OUT"/*.mp4
  export XDG_CACHE_HOME="$WORK/cache"
  select_screens
  read_inputs

  # The repo commits no .xcodeproj: xcodegen writes it from native/project.yml (the workflow installs xcodegen first).
  echo "== build Manifest (Debug, simulator)"
  (cd "$ROOT/native" && xcodegen generate) >"$LOGS/build.log" 2>&1 || { tail -n 40 "$LOGS/build.log" >&2; die "xcodegen failed (full log in $LOGS/build.log)"; }
  xcodebuild build -project "$ROOT/native/Manifest.xcodeproj" -scheme Manifest -configuration Debug \
    -destination 'generic/platform=iOS Simulator' -derivedDataPath "$DERIVED" CODE_SIGNING_ALLOWED=NO \
    >>"$LOGS/build.log" 2>&1 || { tail -n 40 "$LOGS/build.log" >&2; die "build failed (full log in $LOGS/build.log)"; }
  APP="$DERIVED/Build/Products/Debug-iphonesimulator/Manifest.app"
  [[ -d "$APP" ]] || die "no app at $APP"
  bundle_plist="$APP/Info.plist"
  BUNDLE="$(plutil -extract CFBundleIdentifier raw "$bundle_plist")"
  echo "bundle: $BUNDLE, screens: ${SELECTED[*]}"

  xcrun simctl list runtimes available -j >"$WORK/runtimes.json"
  xcrun simctl list devicetypes -j >"$WORK/devicetypes.json"

  if has_item "${DEVICE_LIST[*]}" duo; then
    type_id="$(device_type "iPhone Duo")"
    if [[ -n "$type_id" ]]; then
      shoot_device duo "$type_id" 1
    elif has_item "${DEVICE_LIST[*]}" 18pro; then
      echo "no iPhone Duo device type on this image; 18 Pro only"
      NOTES+=("Duo: not on this image")
    else
      FAILED+=("no iPhone Duo device type on this image")
    fi
  fi

  if has_item "${DEVICE_LIST[*]}" 18pro; then
    type_id="$(device_type "iPhone 18 Pro")"
    if [[ -n "$type_id" ]]; then
      shoot_device 18pro "$type_id" 0
    else
      FAILED+=("no iPhone 18 Pro device type on this image")
    fi
  fi

  echo "== PNGs written"
  count=0
  for f in "$OUT"/*.png; do
    [[ -e "$f" ]] || continue
    echo "$f"
    count=$((count + 1))
  done
  echo "count: $count"
  for f in "$OUT"/*.mp4; do
    [[ -e "$f" ]] || continue
    echo "video: $f"
  done
  for f in ${NOTES[@]+"${NOTES[@]}"}; do echo "note: $f"; done
  if [[ ${#FAILED[@]} -gt 0 ]]; then
    echo "== failures (${#FAILED[@]})" >&2
    for f in "${FAILED[@]}"; do echo "  $f" >&2; done
  fi
  [[ $count -gt 0 ]] || die "no screenshots written"
  [[ ${#FAILED[@]} -eq 0 ]] || exit 1
}

# Sourced (the local unit run of the parse functions) it defines the functions and stops.
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  case "${1:-}" in
    "") main ;;
    check-count) check_count ;;
    *) die "unknown command: $1 (known: check-count, or none to shoot)" ;;
  esac
fi
