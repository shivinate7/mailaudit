# The iOS standard of claude-settings (skills/ios-apps). The same targets run in every iOS repo.
# native-check runs the fast checks and the slow UI tests, once per batch on the Mac.
# phone first, then testflight if phone fails. ios-ship and sim-test are claude-settings commands on PATH.
# There is no `tokens` target: the palette is shared/tokens.json, read by the web build and decoded by the app at launch.
APP := Manifest
NATIVE := native
SHIP := ios-ship
CONFIG := tools/ios-ship.json
# The command that runs the UI tests. On the owner's Mac it is sim-test, which picks the one shared simulator.
# A hosted runner has no sim-test, so the milestone workflow sets this to xcodebuild test with its own destination.
UI_TEST ?= sim-test
# The UI test classes, by who runs them. The Duo classes need the hinge tool and separate pose runs,
# so no hosted run and no native-check runs them: the owner runs them by hand (debt native-ui-tests-not-in-ci).
# UI_TESTS_A is the first milestone job's share. The second job runs every class that is in neither list.
# test/ci-wiring.test.mjs proves each class is in exactly one of A, the rest and Duo.
DUO_UI_TESTS := DuoHandUITests DuoSpreadUITests DuoShellUITests
UI_TESTS_A := AuditSkippingTabBarUITests LedgerSyncUITests MastheadBackupUITests MastheadPaintUITests OrphanedUITests
UI_ONLY_A := $(addprefix -only-testing:ManifestUITests/,$(UI_TESTS_A))
UI_SKIP_DUO := $(addprefix -skip-testing:ManifestUITests/,$(DUO_UI_TESTS))
UI_SKIP_A := $(addprefix -skip-testing:ManifestUITests/,$(UI_TESTS_A))

.PHONY: tokens-check kit-test project app-build ui-test ui-a ui-b native-check phone testflight

# index.html embeds shared/tokens.json. This check proves the committed index.html matches this repo's code.
tokens-check:
	npm run check:build

# The app logic lives in the Kit package, so its tests run in seconds with no simulator.
kit-test:
	swift test --package-path $(NATIVE)/$(APP)Kit

project:
	cd $(NATIVE) && xcodegen generate

app-build: project
	cd $(NATIVE) && xcodebuild build-for-testing -project $(APP).xcodeproj -scheme $(APP) -derivedDataPath build \
		-destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO

# Slow: the UI tests, on the one shared simulator. Once per batch, never on each pull request.
# Every class but the Duo classes. The milestone workflow runs the same set as two parallel jobs, ui-a and ui-b.
ui-test: project
	cd $(NATIVE) && $(UI_TEST) -project $(APP).xcodeproj -scheme $(APP) -derivedDataPath build CODE_SIGNING_ALLOWED=NO $(UI_SKIP_DUO)

# Milestone job part-a: only the UI_TESTS_A classes.
ui-a: project
	cd $(NATIVE) && $(UI_TEST) -project $(APP).xcodeproj -scheme $(APP) -derivedDataPath build CODE_SIGNING_ALLOWED=NO $(UI_ONLY_A)

# Milestone job part-b: every class that is not in UI_TESTS_A and not a Duo class.
ui-b: project
	cd $(NATIVE) && $(UI_TEST) -project $(APP).xcodeproj -scheme $(APP) -derivedDataPath build CODE_SIGNING_ALLOWED=NO $(UI_SKIP_DUO) $(UI_SKIP_A)

native-check: tokens-check kit-test app-build ui-test

# Install a Release build on the phone from this Mac.
phone:
	$(SHIP) install $(CONFIG) --app $(APP)

# The fallback when phone fails: archive and upload to TestFlight. Needs a clean tree at origin/main.
testflight:
	$(SHIP) testflight $(CONFIG) --app $(APP)
