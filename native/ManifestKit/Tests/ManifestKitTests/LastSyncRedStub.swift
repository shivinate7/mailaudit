// RED-PROOF STUB for SyncPanelTests.testLastSyncSurvivesARelaunch. THE BUILDER DELETES THIS FILE.
//
// The save and the restore of lastSyncAt sit in the app target (ManifestApp.startSync), where the package tests
// cannot reach them. The builder moves them into ManifestKit as the member below, with the SAME name and signature,
// calls it from ManifestApp.startSync, and deletes this file. A stub next to the real member is an ambiguity error.
//
// Contract: SyncPanelTests.swift, testLastSyncSurvivesARelaunch.
//   extension SyncClient { public func persistLastSync(in defaults: UserDefaults) }
//   - sets lastSyncAt from the Double under "dev.shivinate.manifest.lastSyncAt" (nil when there is none);
//   - then keeps that key current through onLastSync.
// The "-ManifestUITestSeed" removeObject for that key stays in the app, so a UI run never reads an earlier run's time.
//
// The stub does nothing, so the test fails on its assertions and not on a compile error.

import Foundation
@testable import ManifestKit

extension SyncClient {
    func persistLastSync(in defaults: UserDefaults) {}
}
