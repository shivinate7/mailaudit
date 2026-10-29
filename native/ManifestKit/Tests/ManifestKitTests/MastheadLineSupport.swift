// The one home of the masthead count-line oracle (step 5). Swift holds no copy of the wording
// (rules-run-in-javascriptcore): a test asks the rules bundle what a tab's line reads for given counts,
// and compares the model with that answer. The words themselves are pinned once, in Node, by
// test/view-rules.test.mjs V21.
//
// `countLine(view, counts, range)` is called with the web's own view ids, so this table is the only
// place Swift names them. The range is null: native has no date filter yet (native-filters-tally-only).

import Foundation
@testable import ManifestKit

enum MastheadRuleLine {
    /// The web's view id for each tab: Tally is "items" and Orphaned is "mystery" there.
    static let viewId: [MastheadTab: String] = [.ledger: "ledger", .orphaned: "mystery", .tally: "items", .packages: "packages"]

    /// The real bundle with every `countLine` answer led by the view id it was asked for ("ledger|4 packages ..."),
    /// written into `dir`, so a model's line for a tab shows which view id the model asked for. The Ledger and Packages
    /// forms read alike, so a line compared with the oracle cannot tell them apart. A probe below the seam, as the
    /// sentinel bundles in PackagesToggleTests and OrphanedAssignTests are. The caller owns `dir` and removes it.
    static func writeMarkedBundle(in dir: URL) throws -> URL {
        let real = try String(contentsOf: RulesGoldenTests.bundleURL, encoding: .utf8)
        let mark = "\n;(function () { var real = Rules.countLine; Rules.countLine = function (v, c, r) { return v + \"|\" + real(v, c, r); }; })();\n"
        let probe = dir.appending(path: "rules-marked.js")
        try (real + mark).write(to: probe, atomically: true, encoding: .utf8)
        return probe
    }

    /// The bundle's line for `tab` with these counts, or nil when the bundle has no `countLine` or it throws.
    /// A caller asserts non-nil, so a missing rule is one named failure and never a throw.
    static func line(_ tab: MastheadTab, packages: Int, items: Int, envelopes: Int) async -> String? {
        guard let id = viewId[tab], let engine = try? RulesEngine(bundleURL: RulesGoldenTests.bundleURL) else { return nil }
        let args = #"["\#(id)",{"packages":\#(packages),"uniqueItems":\#(items),"envelopes":\#(envelopes)},null]"#
        guard let out = try? await engine.call("countLine", args) else { return nil }
        return (try? JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed])) as? String
    }
}
