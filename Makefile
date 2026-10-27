# Phone install has no target: run `ios-ship install tools/ios-ship.json --app Manifest` after each merge.
# make testflight: Release archive, then upload to TestFlight. The fallback when the install fails.
# Only the key path is passed; the .p8 file is never read here.
KEY_ID   := H94598Y59P
ISSUER   := d79993df-0368-488f-8f75-db28c701f92b
KEY_PATH := $(HOME)/.appstoreconnect/private_keys/AuthKey_$(KEY_ID).p8
AUTH     := -allowProvisioningUpdates -authenticationKeyPath $(KEY_PATH) -authenticationKeyID $(KEY_ID) -authenticationKeyIssuerID $(ISSUER)
BUILD    := $(shell date -u +%Y%m%d%H%M)
ARCHIVE  := native/build/Manifest-$(BUILD).xcarchive

.PHONY: testflight archive

archive:
	npm run build
	cd native && xcodegen generate
	xcodebuild archive -project native/Manifest.xcodeproj -scheme Manifest -configuration Release \
		-destination generic/platform=iOS -archivePath $(ARCHIVE) CURRENT_PROJECT_VERSION=$(BUILD) $(AUTH)
	@echo "ARCHIVE=$(ARCHIVE) BUILD=$(BUILD)"

# One upload, no retry: a failed upload stops make.
testflight: archive
	xcodebuild -exportArchive -archivePath $(ARCHIVE) -exportOptionsPlist native/ExportOptions.plist \
		-exportPath native/build/export-$(BUILD) $(AUTH)
