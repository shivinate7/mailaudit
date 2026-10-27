// The temp folder for mailaudit's native tests (the test-temp-standard decision: one run folder
// per test run, under one temp root per repo). Each repo keeps its own helper.
//
// One temp root. One run folder per test run, named <pid>-<UUID>. Every helper takes its folder
// from RunFolder.own, never from the system temp dir. The first request of a run sweeps sibling
// run folders older than one day and keeps newer ones. The run folder is removed when the test
// bundle finishes, and each test's folder is removed at that test's teardown.
//
// Cost: one folder listing per process, on the first request. Nothing runs on a timer.

import Foundation
import XCTest

enum RunFolder {
    static let root = FileManager.default.temporaryDirectory
        .appending(path: "mailaudit-native-test-temp", directoryHint: .isDirectory)
    static let maxAge: TimeInterval = 24 * 60 * 60

    /// This run's folder. The first request makes it, sweeps older siblings and arranges its removal.
    static let own: URL = {
        let dir = root.appending(
            path: "\(ProcessInfo.processInfo.processIdentifier)-\(UUID().uuidString)", directoryHint: .isDirectory)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        sweep(root: root, keep: dir, now: Date())
        XCTestObservationCenter.shared.addTestObserver(RunFolderRemoval(folder: dir))
        return dir
    }()

    /// A new folder for one test, inside the run folder. The test removes it at teardown.
    static func fresh(_ label: String) throws -> URL {
        let dir = own.appending(path: "\(label)-\(UUID().uuidString)", directoryHint: .isDirectory)
        try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    /// Removes each sibling named like a run folder whose modification date is over a day old. `keep` stays.
    static func sweep(root: URL, keep: URL, now: Date) {
        let names = (try? FileManager.default.contentsOfDirectory(atPath: root.path)) ?? []
        for name in names where name != keep.lastPathComponent && isRunFolder(name) {
            let path = root.appending(path: name, directoryHint: .isDirectory)
            guard let attrs = try? FileManager.default.attributesOfItem(atPath: path.path),
                  let modified = attrs[.modificationDate] as? Date else { continue }
            if now.timeIntervalSince(modified) > maxAge { try? FileManager.default.removeItem(at: path) }
        }
    }

    static func isRunFolder(_ name: String) -> Bool {
        name.range(of: #"^[0-9]+-[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$"#,
                   options: .regularExpression) != nil
    }
}

/// Removes the run folder when the test bundle finishes.
final class RunFolderRemoval: NSObject, XCTestObservation {
    let folder: URL

    init(folder: URL) { self.folder = folder }

    func testBundleDidFinish(_ testBundle: Bundle) {
        try? FileManager.default.removeItem(at: folder)
    }
}
