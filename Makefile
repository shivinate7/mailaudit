# The iOS standard of claude-settings (skills/ios-apps). The same targets run in every iOS repo.
# native-check runs the fast checks and the slow UI tests, once per batch on the Mac.
# phone first, then testflight if phone fails. ios-ship and sim-test are claude-settings commands on PATH.
# There is no `tokens` target: the palette is shared/tokens.json, read by the web build and decoded by the app at launch.
APP := Manifest
NATIVE := native
SHIP := ios-ship
CONFIG := tools/ios-ship.json

.PHONY: tokens-check kit-test project app-build ui-test native-check phone testflight

# The web build and the rules bundle read shared/tokens.json. A stale build means the committed pages disagree with it.
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
ui-test: project
	cd $(NATIVE) && sim-test -project $(APP).xcodeproj -scheme $(APP) -derivedDataPath build CODE_SIGNING_ALLOWED=NO

native-check: tokens-check kit-test app-build ui-test

# Install a Release build on the phone from this Mac.
phone:
	$(SHIP) install $(CONFIG) --app $(APP)

# The fallback when phone fails: archive and upload to TestFlight. Needs a clean tree at origin/main.
testflight:
	$(SHIP) testflight $(CONFIG) --app $(APP)
