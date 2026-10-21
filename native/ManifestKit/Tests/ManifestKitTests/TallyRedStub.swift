// RED STUB for lane N6. The builder deletes this whole file when the real TallySort, TallyRow
// and TallyModel land in native/ManifestKit/Sources/ManifestKit.
//
// It exists so every Tally test fails on an assertion, not on a compile error
// (native-build-lanes, testing-throwing-assert-bad-kill). Every value here is wrong on purpose.
// The signatures are the contract in TallyModelTests.swift, copied exactly. If the real types
// differ by one label, the test target stops compiling when this file goes, so keep them equal.

import Foundation
import Observation
@testable import ManifestKit

enum TallySort: String, CaseIterable, Sendable {
    case name = "n", rate = "r", value = "v", ordered = "o", basis = "b", missing = "m"
    var label: String { "?" }
}

struct TallyRow: Equatable, Sendable {
    let name: String
    let qty: Int
    let got: Int
    let basis: Double
    let avg: Double
    let sellerCount: Int
    let orderCount: Int
    let sets: [String]
    let leftValue: Double
    let copies: [LedgerItem]
    let hiddenCopies: Int
    let ratio: String
    let rateLine: String
    let leftLine: String
    let meta: String
    let acrossLine: String
    let hiddenNote: String?
}

@MainActor @Observable
final class TallyModel {
    private(set) var rows: [TallyRow] = []
    private(set) var sort: TallySort = .name
    private(set) var query = "stub"
    private(set) var hideReceived = true

    init(engine: RulesEngine, store: LedgerStore) {}
    func load() async throws {}
    func setSort(_ key: TallySort) async throws {}
    func setQuery(_ text: String) async throws {}
    func setHideReceived(_ on: Bool) async throws {}
    func clearSearch() async throws {}
    func checkIn(key: String, count: Int) async throws {}
}
