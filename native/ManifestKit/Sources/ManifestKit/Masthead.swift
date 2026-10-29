import Foundation
import Observation

public struct TallyCell: Equatable, Sendable {
    public let label: String
    public let figure: String
    public init(label: String, figure: String) {
        self.label = label
        self.figure = figure
    }
}

/// The first and last frame of the letterhead's compose, in the web's order
/// (motion-letterhead-composes-once). The view draws from these.
public struct LetterheadFrame: Equatable, Sendable {
    public var sealScale, sealOpacity, ruleFill, titleOpacity, talliesOpacity: Double
    public init(sealScale: Double, sealOpacity: Double, ruleFill: Double, titleOpacity: Double, talliesOpacity: Double) {
        self.sealScale = sealScale
        self.sealOpacity = sealOpacity
        self.ruleFill = ruleFill
        self.titleOpacity = titleOpacity
        self.talliesOpacity = talliesOpacity
    }
}

public enum LetterheadMotion {
    public static let final = LetterheadFrame(sealScale: 1, sealOpacity: 1, ruleFill: 1, titleOpacity: 1, talliesOpacity: 1)

    /// Reduced motion starts on the final frame, so nothing is hidden (motion-reduced-leaves-it-drawn).
    public static func start(reduceMotion: Bool) -> LetterheadFrame {
        reduceMotion ? final : LetterheadFrame(sealScale: 0.68, sealOpacity: 0, ruleFill: 0, titleOpacity: 0, talliesOpacity: 0)
    }

    /// The web sequence ends by about 1060 ms.
    public static func duration(reduceMotion: Bool) -> Double { reduceMotion ? 0 : 1.06 }
}

/// The four tabs the masthead sits on. Each reads its own count line (see `MastheadModel.countLine(for:)`).
public enum MastheadTab: CaseIterable, Sendable { case ledger, orphaned, tally, packages }

/// The save slot holds one of four labels (masthead-save-slot-reserved).
public enum SaveIndicator: CaseIterable, Equatable, Sendable {
    case idle, saving, saved, failed

    public var label: String {
        switch self {
        case .idle: "\u{00A0}"
        case .saving: "saving\u{2026}"
        case .saved: "saved \u{2713}"
        case .failed: "couldn\u{2019}t save"
        }
    }

    /// The longest label, `couldn’t save`. The slot reserves this many characters.
    public static let reservedCharacters = 13
}

/// The masthead's figures and save slot. Every figure comes from the rules bundle
/// (rules-run-in-javascriptcore). It holds no key (the-token-is-a-credential).
@MainActor @Observable
public final class MastheadModel {
    @ObservationIgnored private let engine: RulesEngine
    @ObservationIgnored private let store: LedgerStore
    @ObservationIgnored private let pinned: SaveIndicator?
    public private(set) var cells: [TallyCell] = []
    /// The Packages line, which the Ledger tab shares. The other tabs read `countLine(for:)`.
    public private(set) var countLine = ""
    private var lines: [MastheadTab: String] = [:]
    /// The running head's figure: `got/total`, plus the exact money still missing while anything is.
    public private(set) var runningFigure = ""
    /// Set by the first masthead copy to compose (motion-letterhead-composes-once).
    @ObservationIgnored private var composed = false
    public private(set) var missingLine = ""
    /// Cards in, as a share of all cards, 0 to 100. 0 with no cards.
    public private(set) var percent = 0.0
    /// Cards still out; the number the missing line prints.
    public private(set) var remaining = 0
    private var current = SaveIndicator.idle

    /// `pinned` holds the slot on one state for a whole run (a UI test sets it).
    public init(engine: RulesEngine, store: LedgerStore, pinned: SaveIndicator? = nil) {
        self.engine = engine
        self.store = store
        self.pinned = pinned
    }

    public var indicator: SaveIndicator { pinned ?? current }

    /// The line the masthead on `tab` prints: "" when the ledger has no items, on every tab.
    public func countLine(for tab: MastheadTab) -> String { lines[tab] ?? "" }

    /// The frame a masthead copy starts from. Four tabs hold four copies, and only the first composes;
    /// every later copy starts drawn (motion-letterhead-composes-once).
    public func claimStartFrame(reduceMotion: Bool) -> LetterheadFrame {
        defer { composed = true }
        return composed ? LetterheadMotion.final : LetterheadMotion.start(reduceMotion: reduceMotion)
    }

    /// True once a masthead copy has composed, so a copy that mounts later is built on the final frame.
    public var hasComposed: Bool { composed }

    private func json(_ value: Any) throws -> String {
        String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed]), as: UTF8.self)
    }

    /// A bundle function of one number that gives a string: `compact` and `money`.
    private func text(_ fn: String, _ n: Double) async throws -> String {
        let out = try await engine.call(fn, "[\(n)]")
        guard let s = try JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed]) as? String else {
            throw RulesFailure.threw("\(fn) gave \(out)")
        }
        return s
    }

    /// The bundle's line for a view id (view-rules.mjs `countLine`). Native has no date filter, so the range is null.
    private func line(_ view: String, _ counts: String) async throws -> String {
        let out = try await engine.call("countLine", "[\"\(view)\",\(counts),null]")
        guard let s = try JSONSerialization.jsonObject(with: Data(out.utf8), options: [.fragmentsAllowed]) as? String else {
            throw RulesFailure.threw("countLine gave \(out)")
        }
        return s
    }

    /// Re-reads the store: totalsOf, groupPackages, tallyGroups, packagesDone and compact.
    public func refresh() async throws {
        let got = try json(store.received())
        guard !store.items().isEmpty else {
            (cells, countLine, missingLine, runningFigure, lines, percent, remaining) = ([], "", "", "", [:], 0, 0)
            return
        }
        let items = try await LiveItems.of(store.items(), stamps: store.stamps(), engine: engine)
        let t = try JSONSerialization.jsonObject(with: Data(try await engine.call("totalsOf", "[\(items),\(got)]").utf8)) as? [String: Double] ?? [:]
        let pkgs = try await engine.call("groupPackages", "[\(items)]")
        let n = (try JSONSerialization.jsonObject(with: Data(pkgs.utf8)) as? [Any])?.count ?? 0
        let done = Int(try await engine.call("packagesDone", "[\(pkgs),\(got)]")) ?? 0
        let unique = (try JSONSerialization.jsonObject(with: Data(try await engine.call("tallyGroups", "[\(items)]").utf8)) as? [Any])?.count ?? 0
        // The same live records the Orphaned badge counts, so the line and the badge cannot disagree.
        let waiting = store.envelopeRecords().filter(OrphanedModel.isLive).count
        let counts = #"{"packages":\#(n),"uniqueItems":\#(unique),"envelopes":\#(waiting)}"#
        let (packagesLine, tallyLine, orphanedLine, ledgerLine) = (try await line("packages", counts), try await line("items", counts), try await line("mystery", counts), try await line("ledger", counts))
        let (total, have, val, missingVal) = (t["total"] ?? 0, t["got"] ?? 0, t["val"] ?? 0, t["missingVal"] ?? 0)
        let (inVal, allVal) = (try await text("compact", val - missingVal), try await text("compact", val))
        // The bundle's money, so the line rounds half up as the web does.
        let money = try await text("money", missingVal)
        // Every published field is set below with no await between, so a throw above changes none of them.
        let left = Int(total - have)
        cells = [
            TallyCell(label: "cards", figure: "\(Int(have))/\(Int(total))"),
            TallyCell(label: "packages", figure: "\(done)/\(n)"),
            TallyCell(label: "value", figure: "$\(inVal)/$\(allVal)"),
        ]
        countLine = packagesLine
        lines = [.packages: packagesLine, .ledger: ledgerLine, .tally: tallyLine, .orphaned: orphanedLine]
        runningFigure = "\(Int(have))/\(Int(total))" + (left == 0 ? "" : " \u{00B7} \(money)")
        remaining = left
        percent = total > 0 ? have * 100 / total : 0
        missingLine = left == 0 ? "ALL ACCOUNTED FOR \u{2713}" : "\(left) still missing \u{00B7} \(money)"
    }

    public func saving() { current = .saving }

    /// After a check-in: the figures follow, and the slot reads saved or failed until the
    /// next save, as the web slot does (a clock would be one more thing that moves).
    public func finished(failed: Bool) async {
        try? await refresh()
        current = failed ? .failed : .saved
    }
}
