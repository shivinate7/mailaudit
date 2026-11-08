// The probe bundle: the real rules.js with one override appended, written into the run folder
// (test-temp-standard). A test that needs the bundle to lack a rule, or to break one, builds its probe
// here, so the rule under test is the bundle's own and no Swift copy stands in for it. This is the one
// home of the probe; a test that wants a probe calls it.
//
// Fake fixtures only. No Keychain item is read.

import Foundation

enum RulesProbeBundle {
    /// The real rules.js, then `override` (JavaScript that runs after the bundle loads), in a new file.
    static func make(_ override: String) throws -> URL {
        let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
        let probe = PhotoTestKit.runFolder.appending(path: "rules-probe-\(UUID().uuidString).js")
        try (real + "\n;" + override + ";\n").write(to: probe, atomically: true, encoding: .utf8)
        return probe
    }
}
